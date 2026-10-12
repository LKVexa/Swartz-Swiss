#ifndef BRVM_H
#define BRVM_H
#include <stddef.h>
#include <stdint.h>

enum{BR_VERSION_MAJOR=4u,BR_VERSION_MINOR=6u,BR_VERSION_PATCH=0u,BR_ABI_VERSION=2u,BR_LEGACY_ABI_VERSION=1u,BR_ISA_MAJOR=1u,BR_ISA_MINOR=1u,BR_ISA_MARKER=21u,BR_LEGACY_ISA_MARKER=20u,BR_LEGACY_OPCODES=24u,BR_WORD_BITS=1048576u,BR_LIMBS=16384u,BR_WORD_BYTES=131072u,BR_REGS=16u,BR_CAPS=16u,BR_OPCODES=41u,BR_MAX_CODE=256u,BR_MEMORY_BYTES=4096u,BR_STACK_WORDS=256u,BR_DIAG_RECORDS=16u,BR_FRAGMENT_BYTES=4096u,BR_UPDATE_BYTES=51200u,BR_IMAGE_HEADER=80u,BR_INSN_BYTES=16u,BR_DEVICES=8u,BR_HOST_CALLS=16u,BR_STORAGE_CONTROL0=0u,BR_STORAGE_CONTROL1=1u,BR_STORAGE_IMAGE0=2u,BR_STORAGE_IMAGE1=3u,BR_STORAGE_OBJECT0=4u,BR_STORAGE_GUEST_OBJECTS=4u,BR_STORAGE_STATE0=8u,BR_STORAGE_STATE1=9u,BR_STORAGE_OBJECTS=10u,BR_STORAGE_OBJECT_BYTES=512u,BR_MAILBOX_BYTES=64u,BR_CONST_POOL=8u,BR_VM_HEAP_BYTES=4194304u,BR_STACK_BYTES=2097152u,BR_SCRATCH_BYTES=262144u,BR_DEVICE_BUFFER_BYTES=64u,BR_IMAGE_FLAG_FACTORY=1u,BR_IMAGE_FLAG_SIGNED=2u,BR_FEATURE_BASE=1u,BR_FEATURE_CALL_ABI=2u,BR_FEATURE_INDEXED_MEMORY=4u,BR_FEATURE_SYSTEM=8u,BR_FEATURE_EXTENSIONS=16u,BR_FEATURES=(BR_FEATURE_BASE|BR_FEATURE_CALL_ABI|BR_FEATURE_INDEXED_MEMORY|BR_FEATURE_SYSTEM|BR_FEATURE_EXTENSIONS),BR_EXT_OPCODE_FIRST=48u,BR_EXT_OPCODE_LAST=63u,BR_IF_SIGNED=0x8000u,BR_IF_REGION_SHIFT=12u,BR_IF_REGION_MASK=0x7000u,BR_REGION_MEM=0u,BR_REGION_CODE=1u,BR_REGION_STATE=2u,BR_REGION_IO=3u,BR_ABI_ARG_FIRST=0u,BR_ABI_ARG_LAST=5u,BR_ABI_RET_FIRST=0u,BR_ABI_RET_LAST=1u,BR_ABI_SCRATCH_FIRST=0u,BR_ABI_SCRATCH_LAST=7u,BR_ABI_PRESERVED_FIRST=8u,BR_ABI_PRESERVED_LAST=13u,BR_ABI_FP=14u,BR_ABI_RESERVED=15u};
enum br_opcode{BR_NOP,BR_MOVI,BR_MOV,BR_JMP,BR_JZ,BR_JNZ,BR_HALT,BR_ADD,BR_SUB,BR_MUL,BR_DIVU,BR_MODU,BR_AND,BR_OR,BR_XOR,BR_NOT,BR_SHL,BR_SHR,BR_CMP,BR_LOAD,BR_STORE,BR_PUSH,BR_POP,BR_SVC,BR_NEG,BR_BITTST,BR_ASHR,BR_ROL,BR_ROR,BR_LOADX,BR_STOREX,BR_BEQ,BR_CALL,BR_RET,BR_JMPR,BR_ENTER,BR_LEAVE,BR_TRAP,BR_CAPQ,BR_CHECKPOINT,BR_YIELD};
enum br_arithmetic_mode{BR_WRAP,BR_CHECKED,BR_SATURATE,BR_TRAPPING};
enum br_machine_status{BR_READY,BR_RUNNING,BR_HALTED,BR_TRAPPED,BR_CANCELLED,BR_SUSPENDED,BR_STOPPED};
enum br_lc_{BR_LIFE_EMPTY,BR_LIFE_CREATED,BR_LIFE_INITIALIZED,BR_LIFE_CONFIGURED,BR_LIFE_LOADED,BR_LIFE_VERIFIED,BR_LIFE_RUNNING,BR_LIFE_SUSPENDED,BR_LIFE_STOPPED,BR_LIFE_FAULTED,BR_LIFE_DESTROYED};
enum br_status{BR_OK=0,BR_EINVAL=-1,BR_ESTATE=-2,BR_EBOUNDS=-3,BR_ERESOURCE=-4,BR_ECAP=-5,BR_EIMAGE=-6,BR_EISA=-7,BR_EABI=-8,BR_ESTORAGE=-9,BR_ESIGNATURE=-10,BR_EUNSUPPORTED=-11,BR_EREPLAY=-12,BR_EINTEGRITY=-13,BR_EIO=-14};
enum br_trap{BR_TRAP_NONE,BR_TRAP_BAD_IMAGE,BR_TRAP_BAD_OPCODE,BR_TRAP_CAPABILITY,BR_TRAP_BOUNDS,BR_TRAP_OVERFLOW,BR_TRAP_DIV_ZERO,BR_TRAP_STACK,BR_TRAP_BUDGET,BR_TRAP_CANCEL,BR_TRAP_OOM,BR_TRAP_STATE,BR_TRAP_REPLAY,BR_TRAP_INTEGRITY,BR_TRAP_TRUST,BR_TRAP_PROTOCOL,BR_TRAP_UNSUPPORTED_ISA,BR_TRAP_UNSUPPORTED_ABI,BR_TRAP_HOST,BR_TRAP_MALFORMED,BR_TRAP_REGISTER,BR_TRAP_ACCESS,BR_TRAP_STACK_OVERFLOW,BR_TRAP_STACK_UNDERFLOW,BR_TRAP_RESOURCE,BR_TRAP_DEVICE,BR_TRAP_SIGNATURE,BR_TRAP_EXPLICIT,BR_TRAP_WORD_WIDTH,BR_TRAP_SCRATCH};



enum br_capability{BR_CAP_CONTROL=1u,BR_CAP_ARITH=2u,BR_CAP_MEMORY=4u,BR_CAP_STACK=8u,BR_CAP_SERVICE=16u,BR_CAP_STATE=32u,BR_CAP_UPDATE=64u,BR_CAP_DIAG=128u,BR_CAP_ALL=255u};
enum br_flag{BR_FLAG_ZERO=1u,BR_FLAG_LESS=2u,BR_FLAG_GREATER=4u,BR_FLAG_CARRY=8u,BR_FLAG_OVERFLOW=16u};
enum br_service{BR_SVC_NOP,BR_SVC_STATUS,BR_SVC_REVOKE,BR_SVC_GRANT,BR_SVC_CONFIG,BR_SVC_SAVE,BR_SVC_DIAG,BR_SVC_SHA256,BR_SVC_VERIFY,BR_SVC_TRUST,BR_SVC_ENTROPY,BR_SVC_TIMER,BR_SVC_CONSOLE_WRITE,BR_SVC_CONSOLE_READ,BR_SVC_DEVICE_CALL,BR_SVC_YIELD,BR_SVC_STORAGE_READ,BR_SVC_STORAGE_WRITE,BR_SVC_MONOTONIC,BR_SVC_MAILBOX_PUT,BR_SVC_MAILBOX_GET,BR_SVC_DEVICE_ENUM,BR_SVC_COUNT};
enum br_apdu_command{BR_APDU_INIT=1,BR_APDU_STATUS,BR_APDU_LOAD,BR_APDU_EXEC,BR_APDU_STATE,BR_APDU_INPUT,BR_APDU_UPDATE,BR_APDU_RECOVER,BR_APDU_DIAG,BR_APDU_RESET,BR_APDU_CAPS,BR_APDU_HELLO};
enum br_apdu_status{BR_SW_OK=0x9000,BR_SW_MORE=0x6100,BR_SW_BAD_LENGTH=0x6700,BR_SW_SECURITY=0x6982,BR_SW_REPLAY=0x6985,BR_SW_BAD_DATA=0x6a80,BR_SW_NOT_FOUND=0x6a88,BR_SW_BAD_INS=0x6d00,BR_SW_INTERNAL=0x6f00};
typedef struct{uint8_t op,mode,rd,ra,rb,cap;uint16_t flags;uint64_t imm;}br_insn;
typedef struct{uint32_t seq;uint16_t event,trap;uint32_t ip;uint8_t opcode,status;uint16_t reserved;}br_diag;
typedef struct{uint32_t trap,ip,flags,le_;uint8_t opcode,status,abi,isa_minor;}br_trap_frame;
typedef struct{uint32_t id,rc_;}br_device;
typedef struct br_hal{
 int(*sr_)(void*,uint32_t,uint8_t*,size_t,size_t*);int(*sw_)(void*,uint32_t,const uint8_t*,size_t);int(*sc_)(void*,uint32_t);int(*se_)(void*,uint32_t);int(*mr_)(void*,uint64_t*);int(*mc_)(void*,uint64_t);int(*vs_)(void*,const uint8_t*,size_t,const uint8_t*,size_t,const uint8_t*,size_t);int(*rb_)(void*,uint8_t*,size_t);int(*cr_)(void*,uint64_t*);int(*ci_)(void*,uint8_t*,size_t,size_t*);int(*co_)(void*,const uint8_t*,size_t);int(*dc_)(void*,uint32_t,const uint8_t*,size_t,uint8_t*,size_t,size_t*);void(*panic)(void*,int);int(*yield)(void*);int(*lock)(void*);int(*unlock)(void*);
}br_hal;
typedef struct{uint32_t ib_,sb_,hb_,pa_;const br_device*devices;size_t dn_;}br_vm_config;
typedef struct{void*p;uint64_t v;uint16_t n,x;uint8_t k,f;}br_word;
typedef struct{
 br_word regs[BR_REGS],stack[BR_STACK_WORDS],cp[BR_CONST_POOL];uint8_t*scratch,*fragments;uint32_t caps[BR_CAPS];uint8_t memory[BR_MEMORY_BYTES],mailbox[BR_MAILBOX_BYTES];br_insn code[BR_MAX_CODE];br_diag diag[BR_DIAG_RECORDS];br_device devices[BR_DEVICES];
 uint32_t ip,cc_,sp,flags,trap,status,lc_,ib_,sb_,hb_,su_,hu_,pg_,iv_,last_txid,cw_,ds_,dh_,ft_,fl_,pa_,le_,mb_,mu_,stb_,stu_,scb_,scu_;uint16_t fn_,ml_;uint8_t am_,cn_,iz_,as_,ks_,dn_,ia_,ii_,cpn_;uint8_t ih_[32],ik_[32];uint8_t sa_;const br_hal*hal;void*hc_;
}br_vm;

void br_sha256(const uint8_t*,size_t,uint8_t[32]);
int br_vm_create(br_vm*,const br_hal*,void*);int br_vm_initialize(br_vm*);int br_vm_configure(br_vm*,const br_vm_config*);int br_vm_set_limits(br_vm*,uint32_t,uint32_t,uint32_t);int br_vm_init(br_vm*);void br_vm_reset(br_vm*,int);int br_vm_load_code(br_vm*,const br_insn*,size_t);int br_vm_verify(br_vm*);int br_vm_start(br_vm*);int br_vm_step(br_vm*);int br_vm_run(br_vm*,uint32_t);int br_vm_suspend(br_vm*);int br_vm_resume(br_vm*);int br_vm_stop(br_vm*);int br_vm_fault(br_vm*,unsigned);int br_vm_save(br_vm*);int br_vm_recover(br_vm*);void br_vm_destroy(br_vm*);void br_vm_free(br_vm*);int br_vm_set_ik_(br_vm*,const uint8_t*,size_t);int br_vm_trap_frame(const br_vm*,br_trap_frame*);
int br_image_encode(uint8_t*,size_t,size_t*,const br_insn*,size_t,uint32_t,uint32_t,const uint8_t*,size_t,uint8_t);int br_image_load(br_vm*,const uint8_t*,size_t,const uint8_t*,size_t,int);size_t br_apdu(br_vm*,const uint8_t*,size_t,uint8_t*,size_t);
uint64_t*br_vm_reg(br_vm*,unsigned);const uint64_t*br_vm_reg_const(const br_vm*,unsigned);size_t br_vm_allocated_bytes(const br_vm*);size_t br_vm_stack_bytes(const br_vm*);size_t br_vm_word_bytes(const br_vm*,unsigned);unsigned br_vm_word_kind(const br_vm*,unsigned);int br_vm_status_code(const br_vm*);const char*br_status_name(int);int br_core_selftest(void);
#endif
