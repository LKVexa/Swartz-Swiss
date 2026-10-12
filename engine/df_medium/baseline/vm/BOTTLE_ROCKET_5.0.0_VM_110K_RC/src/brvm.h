#ifndef BOTTLE_ROCKET_BRVM_H
#define BOTTLE_ROCKET_BRVM_H
#include <stddef.h>
#include <stdint.h>
typedef unsigned BU;typedef uint8_t B8;typedef uint16_t B16;typedef uint32_t B32;typedef uint64_t B64;typedef size_t BZ;
#define BR_VERSION_MAJOR 4u
#define BR_VERSION_MINOR 7u
#define BR_VERSION_PATCH 0u
#define BR_CORE_ABI 0x00040700u
#define BR_IMAGE_ABI 1u
#define BR_ISA_MAJOR 4u
#define BR_ISA_MINOR 1u
#define BR_ABI_MAJOR 1u
#define BR_ABI_MINOR 0u
#define BR_ABI_VERSION 0x00010000u
#define N32 1048576u
#define K2 16384u
#define N47 (K2*8u)
#define N89 4194304u
#define BR_REGISTER_CEILING N47
#define N70 1048576u
#define N63 262144u
#define N13 4096u
#define N59 8u
#define N43 16u
#define N71 16u
#define N30 24u
#define N28 32u
#define N55 20u
#define N75 64u
#define N05 256u
#define K3 4096u
#define N69 256u
#define N18 16u
#define N48 4096u
#define K11 80u
#define K22 16u
#define N20 51200u
#define N11 51616u
#define N51 8u
#define BR_DABI_MAJ 1u
#define BR_DABI_MIN 0u
#define BR_DABI 0x00010000u
#define BR_DPKT 256u
#define BR_NPKT 512u
#define BR_MDEP 4u
#define BR_BCAP 4096u
#define BR_QCALL 64u
#define BR_QBYTE 8192u
#define BR_QWRITE 16u
#define BR_QENT 8u
#define N36 96u
#define K17 512u
#define BR_CONTROL_FORMAT 1u
#define K8 2048u
#define N83 1u
#define BR_IMAGE_FLAG_FACTORY 1u
#define N49 2u
#define N02 4u
#define BR_FEAT_CALL 1u
#define N67 2u
#define BR_FEAT_SYSTEM 4u
#define N50 8u
#define N57 16u
#define BR_FEAT_TRAP_TABLE 32u
#define BR_FEAT_ALL 63u
enum br_opcode{N25=0,BR_MOVI,BR_MOV,BR_JMP,BR_JZ,BR_JNZ,BR_HALT,BR_ADD,BR_SUB,BR_MUL,BR_DIVU,BR_MODU,BR_AND,BR_OR,BR_XOR,BR_NOT,BR_SHL,BR_SHR,BR_CMP,BR_LOAD,BR_STORE,BR_PUSH,BR_POP,N16,N72,BR_RET,BR_YIELD,BR_TRAP,BR_CAPQ,N35,BR_LDX,BR_STX};enum br_arithmetic_mode{BR_WRAP=0,BR_CHECKED=1,BR_SATURATE=2,BR_TRAPPING=3};enum br_machine_status{BR_READY=0,N77=1,BR_HALTED=2,BR_TRAPPED=3,BR_CANCELLED=4,BR_SUSPENDED=5};enum br_lifecycle{BR_LC_ZERO=0,BR_LC_CREATED,BR_LC_INITIALIZED,N54,BR_LC_LOADED,N52,N74,BR_LC_SUSPENDED,BR_LC_STOPPED,BR_LC_FAULTED,BR_LC_DESTROYED};enum br_trap{N44=0,N29=1,N12=2,N07=3,K21=4,BR_TRAP_OVERFLOW=5,BR_TRAP_DIV_ZERO=6,BR_TRAP_STACK=7,N15=8,BR_TRAP_CANCEL=9,BR_TRAP_OOM=10,BR_TRAP_STATE=11,N22=12,N68=13,N06=14,BR_TRAP_PROTOCOL=15,K6=16,K19=17,BR_TRAP_REGISTER=18,K16=19,BR_TRAP_ACCESS=20,BR_TRAP_STACK_OVERFLOW=21,BR_TRAP_STACK_UNDERFLOW=22,N01=23,BR_TRAP_EXEC_BUDGET=24,BR_TRAP_DEVICE=25,N09=26,BR_TRAP_CALL_OVERFLOW=27,BR_TRAP_CALL_UNDERFLOW=28,BR_TRAP_CFI=29,BR_TRAP_GUEST=30,BR_TRAP_DEBUG=31};enum br_capability{BR_CAP_CONTROL=1u<<0,BR_CAP_ARITH=1u<<1,BR_CAP_MEMORY=1u<<2,BR_CAP_STACK=1u<<3,N00=1u<<4,N58=1u<<5,N60=1u<<6,BR_CAP_DIAG=1u<<7,N46=0xffu};enum br_flag{N87=1u<<0,BR_FLAG_LESS=1u<<1,BR_FLAG_GREATER=1u<<2,BR_FLAG_CARRY=1u<<3,BR_FLAG_OVERFLOW=1u<<4};enum br_apdu_command{N88=1,BR_APDU_STATUS=2,BR_APDU_LOAD=3,BR_APDU_EXEC=4,BR_APDU_STATE=5,BR_APDU_INPUT=6,BR_APDU_UPDATE=7,N84=8,BR_APDU_DIAG=9,BR_APDU_RESET=10,BR_APDU_CAPS=11,BR_APDU_HELLO=12,BR_APDU_ABI=13};enum br_apdu_status{BR_SW_OK=0x9000,BR_SW_MORE=0x6100,BR_SW_BAD_LENGTH=0x6700,N40=0x6982,BR_SW_REPLAY=0x6985,K12=0x6a80,BR_SW_NOT_FOUND=0x6a88,BR_SW_BAD_INS=0x6d00,K14=0x6f00};enum br_status{K0=0,K20=-1,K15=-2,N14=-3,N78=-4,N17=-5,K9=-6,N56=-7,K4=-8,K23=-9,K7=-10,K5=-11,N26=-12,N27=-13,K1=-14,N21=-15};enum br_storage_object{K24=1,K25,BR_STORE_ISSUER,N80,N79,K13,N82,N81,N23};enum br_recovery_status{N45=0,N19=1,N10=2,N37=3};enum br_storage_flag{BR_STORAGE_DURABLE=1u,BR_STORAGE_ATOMIC_REPLACE=2u,BR_STORAGE_LOCKED=4u};enum br_service_id{BR_SVC_YIELD=0,BR_SVC_STATUS,BR_SVC_REVOKE,BR_SVC_DELEGATE,BR_SVC_CONFIGURE,BR_SVC_COMMIT,BR_SVC_DIAG_EVENT,BR_SVC_SHA256,BR_SVC_ED25519_VERIFY,BR_SVC_DEVICE_CALL,BR_SVC_CONSOLE_READ,BR_SVC_CONSOLE_WRITE,BR_SVC_STORAGE_READ,BR_SVC_STORAGE_WRITE,BR_SVC_ENTROPY,BR_SVC_MONOTONIC,BR_SVC_TIMER,BR_SVC_DIAGNOSTIC,BR_SVC_MAILBOX,BR_SVC_DEVICE_ENUM};enum br_host_call_id{BR_HOST_YIELD=0,BR_HOST_HASH256=1,BR_HOST_VERIFY_SIGNATURE=2,BR_HOST_DEVICE=3,BR_HOST_RANDOM=4,BR_HOST_CLOCK=5,BR_HOST_CONSOLE_READ=6,BR_HOST_CONSOLE_WRITE=7};enum br_device_id{BR_DCON=0x4701u,BR_DBLK=0x4702u,BR_DMON=0x4703u,BR_DENT=0x4704u,BR_DCLK=0x4705u,BR_DMBX=0x4706u,BR_DDIA=0x4707u,BR_DNET=0x4708u};enum br_device_flag{BR_DDET=1u,BR_DNON=2u,BR_DOPT=4u,BR_DOFF=8u};enum br_device_status{BR_DEV_OK=0,BR_DEV_BAD_DEVICE=1,BR_DEV_BAD_OPERATION=2,BR_DEV_DENIED=3,BR_DEV_BAD_BUFFER=4,BR_DEV_EXHAUSTED=5,BR_DEV_UNAVAILABLE=6,BR_DEV_IO_ERROR=7};enum br_console_op{BR_OCR=1,BR_OCW=2,BR_OCF=3};enum br_block_op{BR_OBR=1,BR_OBW=2,BR_OBS=3,BR_OBC=4};enum br_monotonic_op{BR_OMR=1,BR_OMC=2};enum br_entropy_op{BR_OEG=1};enum br_clock_op{BR_OCM=1,BR_OCWALL=2};enum br_mailbox_op{BR_OMRcv=1,BR_OMS=2,BR_OMST=3};enum br_diag_op{BR_ODS=1,BR_ODT=2,BR_ODR=3,BR_ODI=4,BR_ODB=5};enum br_network_op{BR_ONS=1,BR_ONR=2};enum br_word_kind{BR_WORD_ZERO=0,BR_WORD_SMALL=1,N39=2,N04=3,BR_WORD_CONST=4};enum br_word_flag{BR_WORD_IMMUTABLE=1u};typedef struct br_word_blob{B32 r,c,u,reserved;B64 l[];}br_word_blob;typedef struct{br_word_blob*b;B64 v;B32 i;B16 p;B8 k,flags;}br_word;typedef struct{B64*buf[2];B32 c[2];}br_scratch;typedef struct{B64 size,capacity;B32 flags,reserved;}br_storage_status;typedef struct br_hal{void*ctx;int(*storage_read)(void*,B32,BZ,B8*,BZ,BZ*);int(*storage_write)(void*,B32,BZ,const B8*,BZ);int(*storage_erase)(void*,B32);int(*storage_flush)(void*,B32);int(*storage_sync)(void*,B32);int(*storage_replace)(void*,B32,B32);int(*storage_status)(void*,B32,br_storage_status*);int(*state_auth)(void*,const B8*,BZ,B8[32]);int(*monotonic_read)(void*,B64*);int(*monotonic_commit)(void*,B64);int(*verify_signature)(void*,const B8*,BZ,const B8*,BZ,const B8*,BZ);int(*random_bytes)(void*,B8*,BZ);int(*clock_read)(void*,B64*);int(*monotonic_time)(void*,B64*);int(*console_read)(void*,B8*,BZ,BZ*);int(*console_write)(void*,const B8*,BZ);int(*console_flush)(void*);int(*device_call)(void*,B32,B32,const B8*,BZ,B8*,BZ,BZ*);void(*panic)(void*,int);int(*yield)(void*);int(*lock)(void*,B32);int(*unlock)(void*,B32);int(*hash256)(void*,const B8*,BZ,B8[32]);int(*trust_anchor)(void*,B8[32],B64*,B32*);}br_hal;typedef struct{B32 abi,capability_allowlist,instruction_budget,service_budget,host_call_budget,storage_quota,io_quota,wm,sm,xm,dm;}br_config;typedef struct{B8 op,mode,rd,ra,rb,cap;B16 flags;B64 imm;}br_insn;typedef struct{B32 seq;B16 event,trap;B32 ip;B8 opcode,status;B16 reserved;}br_diag;typedef struct{B32 id,v,c,flags;B16 n,mi,mo,reserved;}br_device;typedef struct{B32 abi,trap,error,ip,flags,sp,call_sp;B8 opcode,status,reserved[2];}br_trap_frame;typedef struct br_vm{br_word regs[N43],stack[N69],constants[N59];br_scratch scratch;B32 caps[N71];B8 memory[K3];br_insn code[N05];br_diag diag[N18];B8 fragments[N48];br_device devices[N51];B32 ip,code_count,sp,call_sp,flags,trap,status,lifecycle,last_error;B32 call_stack[N75];B32 instruction_budget,service_budget,services_used,host_call_budget,host_calls_used,storage_quota,storage_used,io_quota,io_used,dc,db,dw,de,wm,wu0,wp0,sm,sb,xm,dm;B32 persistent_generation,image_version,image_features,last_txid,config_word,diag_seq,diag_head,fragment_txid,update_txid,update_total,update_received,active_image_length,active_slot,capability_allowlist;B32 slot_generation[2],slot_length[2];B8 slot_hash[2][32],slot_signed[2],candidate_slot,previous_good_slot,recovery_status,persist_reserved;B16 fragment_next_seq,fragment_length,update_next_seq;B8 issuer_public_key[32],active_image_hash[32];B64 trusted_issuer_id,revoked_issuers[4];B32 issuer_epoch,image_generation,trust_txseq,revoked_images[4];B8 arithmetic_mode,cancel_requested,initialized,issuer_key_set,image_verified,loaded_isa_minor,loaded_abi_major,secure_authorized,rm,mh0,mh1,mh2,mg0,mg1,mg2;B16 mhl[BR_MDEP],mgl[BR_MDEP];B8 mh[BR_MDEP][BR_DPKT],mg[BR_MDEP][BR_DPKT];B64 rr,rc;const br_hal*hal;}br_vm;int br_core_create(br_vm*);int br_core_initialize(br_vm*);int br_core_configure(br_vm*,const br_hal*,const br_config*);int br_core_reset(br_vm*,int);int br_core_load(br_vm*,const B8*,BZ,const B8*,BZ,int);int br_core_verify(br_vm*);int br_core_start(br_vm*);int br_core_step(br_vm*);int br_core_run(br_vm*,B32);int br_core_suspend(br_vm*);int br_core_resume(br_vm*);int br_core_stop(br_vm*);int br_core_fault(br_vm*,B32);int br_core_recover(br_vm*);void br_core_destroy(br_vm*);int br_core_set_device(br_vm*,unsigned,B32,B32);int br_device_info_get(const br_vm*,unsigned,br_device*);int br_device_invoke(br_vm*,unsigned,B32,BZ,BZ,BZ,BZ,BZ*);int br_vm_replay_configure(br_vm*,B64,B64);int br_mailbox_host_send(br_vm*,const B8*,BZ);int br_mailbox_host_recv(br_vm*,B8*,BZ,BZ*);int br_vm_trap_frame(const br_vm*,br_trap_frame*);int br_vm_init(br_vm*);void br_vm_free(br_vm*);void br_vm_reset(br_vm*,int);int br_vm_load_code(br_vm*,const br_insn*,BZ);int br_vm_step(br_vm*);int br_vm_run(br_vm*,B32);int br_vm_save(br_vm*);int br_vm_recover(br_vm*);int br_vm_bind_hal(br_vm*,const br_hal*);int br_vm_set_issuer_key(br_vm*,const B8*,BZ);int br_persist_guest_write(br_vm*,B32,const B8*,BZ);int br_persist_guest_read(br_vm*,B32,B8*,BZ,BZ*);int br_persist_guest_migrate(br_vm*,B32,B16,const B8*,BZ);int br_persist_boot_prepare(br_vm*);int br_persist_boot_confirm(br_vm*);int br_image_load(br_vm*,const B8*,BZ,const B8*,BZ,int);int br_image_inspect(const B8*,BZ,B32*,B16*,B16*,B32*,int*);B64 br_vm_reg_u64(const br_vm*,unsigned);B64 br_vm_reg_limb(const br_vm*,unsigned,B32);int br_vm_reg_set_limb(br_vm*,unsigned,B32,B64);int br_vm_reg_fill(br_vm*,unsigned,B64);B32 br_vm_reg_kind(const br_vm*,unsigned);BZ br_vm_reg_storage_bytes(const br_vm*,unsigned);B32 br_vm_wide_bytes(const br_vm*);B32 br_vm_wide_peak_bytes(const br_vm*);BZ br_apdu(br_vm*,const B8*,BZ,B8*,BZ);
#endif
