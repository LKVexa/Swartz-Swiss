#!/usr/bin/env python3
from pathlib import Path
import copy, importlib.util, json, shutil, tempfile, time, unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('qvm',ROOT/'toolchain/quorum_vm.py')
qvm=importlib.util.module_from_spec(spec); import sys; sys.modules['qvm']=qvm; spec.loader.exec_module(qvm)

class QVMTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source=ROOT/'src/CORE.lctlc'
        cls.compiled=qvm.compile_source(cls.source,ROOT,True)
        cls.seed=bytes.fromhex((ROOT/'keys/DEV_ONLY_private_seed.hex').read_text().strip())
        cls.trust=json.loads((ROOT/'keys/TRUST_STORE.json').read_text())
        cls.image=qvm.sign_payload(copy.deepcopy(cls.compiled['payload']),cls.seed,'dev-root')

    def test_01_lctl_canonical_verifier(self):
        self.assertEqual(self.compiled['lctl_verification']['status'],'PASS')

    def test_02_compile_determinism(self):
        a=qvm.compile_source(self.source,ROOT,True)
        b=qvm.compile_source(self.source,ROOT,True)
        self.assertEqual(qvm.canonical(a['brir']),qvm.canonical(b['brir']))
        self.assertEqual(qvm.canonical(a['payload']),qvm.canonical(b['payload']))

    def test_03_signature_verify(self):
        p=qvm.verify_image(self.image,self.trust,0)
        self.assertEqual(p['magic'],'QBRIM')

    def test_04_signature_tamper_rejected(self):
        bad=copy.deepcopy(self.image); bad['payload']['instructions'][0]['imm']=66
        with self.assertRaises(qvm.VMTrap) as cm: qvm.verify_image(bad,self.trust,0)
        self.assertEqual(cm.exception.name,'TRAP_SIGNATURE')

    def test_05_revoked_key_rejected(self):
        trust=copy.deepcopy(self.trust); trust['keys']['dev-root']['revoked']=True
        with self.assertRaises(qvm.VMTrap) as cm: qvm.verify_image(self.image,trust,0)
        self.assertEqual(cm.exception.name,'TRAP_SIGNATURE')

    def test_06_rollback_rejected(self):
        with self.assertRaises(qvm.VMTrap) as cm: qvm.verify_image(self.image,self.trust,2)
        self.assertEqual(cm.exception.name,'TRAP_ROLLBACK')

    def test_07_core_execution(self):
        p=qvm.verify_image(self.image,self.trust,0); vm=qvm.VM(p); s=vm.run()
        self.assertEqual(s['status'],'HALTED'); self.assertEqual(vm.regs[3],12); self.assertEqual(vm.regs[6],12); self.assertEqual(bytes(vm.output),b'A')

    def test_08_deterministic_replay(self):
        p=qvm.verify_image(self.image,self.trust,0)
        a=qvm.VM(copy.deepcopy(p)).run(); b=qvm.VM(copy.deepcopy(p)).run()
        self.assertEqual(a['state_sha256'],b['state_sha256']); self.assertEqual(a['trace_sha256'],b['trace_sha256'])

    def test_09_memory_capability(self):
        p=copy.deepcopy(qvm.verify_image(self.image,self.trust,0)); p['capabilities']['memory']=[[128,64]]
        vm=qvm.VM(p)
        with self.assertRaises(qvm.VMTrap) as cm: vm.run()
        self.assertEqual(cm.exception.name,'TRAP_CAPABILITY')

    def test_10_stack_underflow(self):
        p=copy.deepcopy(self.compiled['payload']); p['instructions']=[{'op':'POP','dst':0},{'op':'HALT'}]
        with self.assertRaises(qvm.VMTrap) as cm: qvm.VM(p).run()
        self.assertEqual(cm.exception.name,'TRAP_STACK_UNDERFLOW')

    def test_11_stack_overflow(self):
        p=copy.deepcopy(self.compiled['payload']); p['instructions']=[{'op':'PUSH','a':0}]*257+[{'op':'HALT'}]
        with self.assertRaises(qvm.VMTrap) as cm: qvm.VM(p,max_steps=400).run()
        self.assertEqual(cm.exception.name,'TRAP_STACK_OVERFLOW')

    def test_12_div_zero(self):
        p=copy.deepcopy(self.compiled['payload']); p['instructions']=[{'op':'MOVI','dst':0,'imm':1},{'op':'MOVI','dst':1,'imm':0},{'op':'DIVU','dst':2,'a':0,'b':1},{'op':'HALT'}]
        with self.assertRaises(qvm.VMTrap) as cm: qvm.VM(p).run()
        self.assertEqual(cm.exception.name,'TRAP_DIV_ZERO')

    def test_13_oob_memory(self):
        p=copy.deepcopy(self.compiled['payload']); p['instructions']=[{'op':'MOVI','dst':0,'imm':4095},{'op':'LOAD','dst':1,'a':0,'width':8},{'op':'HALT'}]
        with self.assertRaises(qvm.VMTrap) as cm: qvm.VM(p).run()
        self.assertEqual(cm.exception.name,'TRAP_OOB_MEMORY')

    def test_14_step_limit(self):
        p=copy.deepcopy(self.compiled['payload']); p['instructions']=[{'op':'JMP','target':0}]
        with self.assertRaises(qvm.VMTrap) as cm: qvm.VM(p,max_steps=10).run()
        self.assertEqual(cm.exception.name,'TRAP_RESOURCE')

    def test_15_wide_word_boundary(self):
        p=copy.deepcopy(self.compiled['payload']); p['instructions']=[{'op':'HALT'}]
        vm=qvm.VM(p); v=1 << (qvm.WORD_BITS-1); vm.setreg(0,v,'exact'); self.assertEqual(vm.regs[0],v)
        with self.assertRaises(qvm.VMTrap): vm.setreg(1,1<<qvm.WORD_BITS,'exact')
        vm.setreg(1,1<<qvm.WORD_BITS,'modular'); self.assertEqual(vm.regs[1],0)

    def test_16_all_24_opcodes_compile_and_execute(self):
        c=qvm.compile_source(ROOT/'examples/all_opcodes.lctlc',ROOT,True)
        ops={i['op'] for i in c['payload']['instructions']}; self.assertEqual(ops,set(qvm.OPCODES))
        vm=qvm.VM(c['payload']); s=vm.run(); self.assertEqual(s['status'],'HALTED')
        executed={t['op'] for t in vm.trace}; self.assertEqual(executed,set(qvm.OPCODES))

    def test_17_persistence_roundtrip_and_fallback(self):
        key=b'K'*32
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            qvm.save_state_dual(root,{'x':1,'rollback_floor':1},key)
            qvm.save_state_dual(root,{'x':2,'rollback_floor':2},key)
            self.assertEqual(qvm.load_state_dual(root,key)['x'],2)
            ctrl=json.loads((root/'control.json').read_text()); newest=root/f"slot_{ctrl['active']}.json"
            newest.write_text('{corrupt')
            self.assertEqual(qvm.load_state_dual(root,key)['x'],1)

    def test_18_apdu_contract(self):
        self.assertLessEqual(qvm.MAX_APDU_BYTES,4096)
        self.assertEqual(qvm.VERSION,'5.0.0-candidate')

    def test_19_multiple_instances_isolated(self):
        p=copy.deepcopy(self.compiled['payload']); a=qvm.VM(copy.deepcopy(p)); b=qvm.VM(copy.deepcopy(p)); a.memory[0]=9
        self.assertEqual(b.memory[0],0); a.regs[0]=123; self.assertEqual(b.regs[0],0)

    def test_20_image_limits(self):
        p=copy.deepcopy(self.compiled['payload']); p['instructions']=[{'op':'NOP'}]*(qvm.MAX_PROGRAM_INSNS+1)
        img=qvm.sign_payload(p,self.seed,'dev-root')
        with self.assertRaises(qvm.VMTrap) as cm: qvm.verify_image(img,self.trust,0)
        self.assertEqual(cm.exception.name,'TRAP_RESOURCE')

if __name__=='__main__':
    unittest.main(verbosity=2)
