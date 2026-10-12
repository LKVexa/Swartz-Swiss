#include "brvm.h"
#include "br_host.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define I(OP,M,RD,RA,RB,C,IMM) (br_insn){(OP),(M),(RD),(RA),(RB),(C),0,(IMM)}
static int failures;
static void ok(int cond,const char *name){if(!cond){fprintf(stderr,"FAIL %s\n",name);failures++;}}
static uint64_t rr(const br_vm*v,unsigned r,size_t i){return br_vm_reg_limb(v,r,(uint32_t)i);}
static void rs(br_vm*v,unsigned r,size_t i,uint64_t x){ok(br_vm_reg_set_limb(v,r,(uint32_t)i,x)==K0,"reg-set");}
static void rz(br_vm*v,unsigned r){rs(v,r,0,0);}
static void rf(br_vm*v,unsigned r,uint64_t x){ok(br_vm_reg_fill(v,r,x)==K0,"reg-fill");}
static int dev_fail(void *c,uint32_t id,uint32_t op,const uint8_t *in,size_t n,uint8_t *out,size_t cap,size_t *on){(void)c;(void)id;(void)op;(void)in;(void)n;(void)out;(void)cap;(void)on;return K5;}
static int read_all(const char *p,uint8_t **out,size_t *n){FILE *f=fopen(p,"rb");long z;uint8_t *b;if(!f)return -1;if(fseek(f,0,SEEK_END)||(z=ftell(f))<0||fseek(f,0,SEEK_SET)){fclose(f);return -1;}b=malloc((size_t)z);if(!b){fclose(f);return -1;}if(fread(b,1,(size_t)z,f)!=(size_t)z){free(b);fclose(f);return -1;}fclose(f);*out=b;*n=(size_t)z;return 0;}
static int load1(br_vm *v,br_insn in){br_insn p[2]={in,I(BR_HALT,BR_WRAP,0,0,0,0,0)};v->caps[0]=N46;return br_vm_load_code(v,p,2);}
static void pos(br_vm *v,unsigned op,int seen[N28]){
 br_insn p[3];int r=K0;rz(v,0);rz(v,1);rz(v,2);v->flags=0;v->caps[0]=N46;
 switch(op){
 case N25:r=load1(v,I(N25,BR_WRAP,0,0,0,0,0));break;
 case BR_MOVI:r=load1(v,I(BR_MOVI,BR_WRAP,0,0,0,0,7));break;
 case BR_MOV:rs(v,1,0,9);r=load1(v,I(BR_MOV,BR_WRAP,0,1,0,0,0));break;
 case BR_JMP:p[0]=I(BR_JMP,BR_WRAP,0,0,0,0,1);p[1]=I(BR_HALT,BR_WRAP,0,0,0,0,0);r=br_vm_load_code(v,p,2);break;
 case BR_JZ:v->flags=N87;p[0]=I(BR_JZ,BR_WRAP,0,0,0,0,1);p[1]=I(BR_HALT,BR_WRAP,0,0,0,0,0);r=br_vm_load_code(v,p,2);v->flags=N87;break;
 case BR_JNZ:p[0]=I(BR_JNZ,BR_WRAP,0,0,0,0,1);p[1]=I(BR_HALT,BR_WRAP,0,0,0,0,0);r=br_vm_load_code(v,p,2);v->flags=0;break;
 case BR_HALT:r=br_vm_load_code(v,(br_insn[]){I(BR_HALT,BR_WRAP,0,0,0,0,0)},1);break;
 case BR_ADD:rs(v,0,0,2);rs(v,1,0,3);r=load1(v,I(BR_ADD,BR_WRAP,2,0,1,0,0));break;
 case BR_SUB:rs(v,0,0,7);rs(v,1,0,3);r=load1(v,I(BR_SUB,BR_WRAP,2,0,1,0,0));break;
 case BR_MUL:rs(v,0,0,7);rs(v,1,0,6);r=load1(v,I(BR_MUL,BR_WRAP,2,0,1,0,0));break;
 case BR_DIVU:rs(v,0,0,8);rs(v,1,0,2);r=load1(v,I(BR_DIVU,BR_WRAP,2,0,1,0,0));break;
 case BR_MODU:rs(v,0,0,9);rs(v,1,0,4);r=load1(v,I(BR_MODU,BR_WRAP,2,0,1,0,0));break;
 case BR_AND:rs(v,0,0,0xf0);rs(v,1,0,0x3c);r=load1(v,I(BR_AND,BR_WRAP,2,0,1,0,0));break;
 case BR_OR:rs(v,0,0,0xf0);rs(v,1,0,0x0f);r=load1(v,I(BR_OR,BR_WRAP,2,0,1,0,0));break;
 case BR_XOR:rs(v,0,0,0xaa);rs(v,1,0,0xff);r=load1(v,I(BR_XOR,BR_WRAP,2,0,1,0,0));break;
 case BR_NOT:rs(v,0,0,0);r=load1(v,I(BR_NOT,BR_WRAP,2,0,0,0,0));break;
 case BR_SHL:rs(v,0,0,1);r=load1(v,I(BR_SHL,BR_WRAP,2,0,0,0,1));break;
 case BR_SHR:rs(v,0,0,4);r=load1(v,I(BR_SHR,BR_WRAP,2,0,0,0,1));break;
 case BR_CMP:rs(v,0,0,1);rs(v,1,0,2);r=load1(v,I(BR_CMP,BR_WRAP,0,0,1,0,0));break;
 case BR_LOAD:v->memory[0]=0x2a;r=load1(v,I(BR_LOAD,BR_WRAP,0,0,0,0,0));break;
 case BR_STORE:rs(v,0,0,0x11223344);r=load1(v,I(BR_STORE,BR_WRAP,0,0,0,0,8));break;
 case BR_PUSH:rs(v,0,0,5);r=load1(v,I(BR_PUSH,BR_WRAP,0,0,0,0,0));break;
 case BR_POP:r=load1(v,I(BR_POP,BR_WRAP,0,0,0,0,0));v->stack[0]=v->constants[5];v->sp=1;break;
 case N16:r=load1(v,I(N16,BR_WRAP,0,0,0,0,BR_SVC_STATUS));break;
 case N72:p[0]=I(N72,BR_WRAP,0,0,0,0,2);p[1]=I(BR_HALT,BR_WRAP,0,0,0,0,0);p[2]=I(BR_RET,BR_WRAP,0,0,0,0,1);r=br_vm_load_code(v,p,3);break;
 case BR_RET:p[0]=I(BR_RET,BR_WRAP,0,0,0,0,1);p[1]=I(BR_HALT,BR_WRAP,0,0,0,0,0);r=br_vm_load_code(v,p,2);v->call_sp=1;v->call_stack[0]=1;break;
 case BR_YIELD:r=load1(v,I(BR_YIELD,BR_WRAP,0,0,0,0,0));break;
 case BR_TRAP:r=load1(v,I(BR_TRAP,BR_WRAP,0,0,0,0,0));break;
 case BR_CAPQ:r=load1(v,I(BR_CAPQ,BR_WRAP,0,0,0,0,0));break;
 case N35:v->image_version=1;r=load1(v,I(N35,BR_WRAP,0,0,0,0,0));break;
 case BR_LDX:rs(v,0,0,8);v->memory[16]=0x2a;r=load1(v,I(BR_LDX,BR_WRAP,2,0,0,0,8));break;
 case BR_STX:rs(v,0,0,0x55);rs(v,1,0,8);r=load1(v,I(BR_STX,BR_WRAP,0,0,1,0,8));break;
 default:r=K20;break;}
 ok(r==K0,"positive-load");if(r==K0){r=br_vm_step(v);if(op==BR_TRAP)ok(r!=K0&&v->trap==BR_TRAP_GUEST,"TRAP-positive");else ok(r==K0,"positive-step");}seen[op]=r==K0||op==BR_TRAP;
}
static void test_opcodes(br_vm *v){int seen[N28]={0};unsigned o;for(o=0;o<N28;o++)pos(v,o,seen);for(o=0;o<N28;o++){char n[48];snprintf(n,sizeof n,"opcode-positive-%u",o);ok(seen[o],n);}for(o=0;o<N28;o++){br_insn x=I(o,BR_WRAP,N43,0,0,0,0);char n[48];snprintf(n,sizeof n,"opcode-negative-%u",o);br_vm_load_code(v,&x,1);ok(br_vm_step(v)!=K0&&v->trap==BR_TRAP_REGISTER,n);}}
static void test_modes_and_width(br_vm *v){br_insn x=I(BR_ADD,BR_WRAP,2,0,1,0,0);unsigned m;rf(v,0,UINT64_MAX);rz(v,1);rs(v,1,0,1);for(m=0;m<4;m++){x.mode=(uint8_t)m;load1(v,x);v->caps[0]=N46;rf(v,0,UINT64_MAX);rz(v,1);rs(v,1,0,1);if(m==BR_TRAPPING)ok(br_vm_step(v)!=K0&&v->trap==BR_TRAP_OVERFLOW,"mode-trapping");else{ok(br_vm_step(v)==K0,"mode-nontrapping");if(m==BR_SATURATE)ok(rr(v,2,0)==UINT64_MAX&&rr(v,2,K2-1)==UINT64_MAX,"mode-saturate");else ok(rr(v,2,0)==0&&rr(v,2,K2-1)==0,"mode-wrap-checked");}}
 rz(v,0);rs(v,0,0,1);x=I(BR_SHL,BR_WRAP,2,0,0,0,0);load1(v,x);ok(br_vm_step(v)==K0&&rr(v,2,0)==1,"shift-zero");x.imm=N32-1;load1(v,x);rz(v,0);rs(v,0,0,1);ok(br_vm_step(v)==K0&&rr(v,2,K2-1)==(1ull<<63),"shift-width-edge");x.imm=N32;load1(v,x);ok(br_vm_step(v)!=K0&&v->trap==K19,"shift-oversize");}
static void expect_trap(br_vm*v,br_insn x,uint32_t trap,const char*n){br_vm_load_code(v,&x,1);v->caps[0]=N46;ok(br_vm_step(v)!=K0&&v->trap==trap,n);}
static void test_traps(br_vm *v,br_hal *hal){br_insn x;
 x=I(255,BR_WRAP,0,0,0,0,0);expect_trap(v,x,N12,"trap-illegal-opcode");x=I(N25,BR_WRAP,0,0,0,0,0);x.flags=1;expect_trap(v,x,K19,"trap-malformed");x=I(N25,BR_WRAP,N43,0,0,0,0);expect_trap(v,x,BR_TRAP_REGISTER,"trap-register");x=I(BR_LOAD,BR_WRAP,0,0,0,0,1);expect_trap(v,x,K16,"trap-memory");
 x=I(BR_LDX,BR_WRAP,0,1,0,0,0);br_vm_load_code(v,&x,1);v->caps[0]=N46;rs(v,1,0,0xf000000000000000ull);ok(br_vm_step(v)!=K0&&v->trap==BR_TRAP_ACCESS,"trap-access");
 x=I(BR_ADD,BR_WRAP,0,0,1,0,0);br_vm_load_code(v,&x,1);v->caps[0]=BR_CAP_CONTROL;ok(br_vm_step(v)!=K0&&v->trap==N07,"trap-capability");
 x=I(BR_DIVU,BR_WRAP,2,0,1,0,0);br_vm_load_code(v,&x,1);v->caps[0]=N46;rs(v,0,0,1);rz(v,1);ok(br_vm_step(v)!=K0&&v->trap==BR_TRAP_DIV_ZERO,"trap-divzero");
 x=I(BR_ADD,BR_TRAPPING,2,0,1,0,0);br_vm_load_code(v,&x,1);v->caps[0]=N46;rf(v,0,UINT64_MAX);rz(v,1);rs(v,1,0,1);ok(br_vm_step(v)!=K0&&v->trap==BR_TRAP_OVERFLOW,"trap-overflow");
 x=I(BR_PUSH,BR_WRAP,0,0,0,0,0);br_vm_load_code(v,&x,1);v->caps[0]=N46;v->sp=N69;ok(br_vm_step(v)!=K0&&v->trap==BR_TRAP_STACK_OVERFLOW,"trap-stack-overflow");x=I(BR_POP,BR_WRAP,0,0,0,0,0);br_vm_load_code(v,&x,1);v->caps[0]=N46;v->sp=0;ok(br_vm_step(v)!=K0&&v->trap==BR_TRAP_STACK_UNDERFLOW,"trap-stack-underflow");
 x=I(N16,BR_WRAP,0,0,0,0,BR_SVC_STATUS);br_vm_load_code(v,&x,1);v->caps[0]=N46;v->service_budget=0;v->services_used=0;ok(br_vm_step(v)!=K0&&v->trap==N01,"trap-resource");v->service_budget=64;
 x=I(BR_JMP,BR_WRAP,0,0,0,0,0);br_vm_load_code(v,&x,1);v->caps[0]=N46;ok(br_vm_run(v,1)!=K0&&v->trap==BR_TRAP_EXEC_BUDGET,"trap-exec-budget");
 {br_hal bad=*hal;bad.device_call=dev_fail;br_vm_bind_hal(v,&bad);br_core_set_device(v,0,1,N00);x=I(N16,BR_WRAP,0,1,2,0,BR_SVC_DEVICE_CALL);br_vm_load_code(v,&x,1);v->caps[0]=N46;rs(v,1,0,0);rs(v,2,0,0);rs(v,2,1,1);rs(v,0,0,0);rs(v,0,1,1);ok(br_vm_step(v)!=K0&&v->trap==BR_TRAP_DEVICE,"trap-device");br_vm_bind_hal(v,hal);}
}
static void test_signature(br_vm*v,const char *signed_image){uint8_t *im=0,badkey[32]={0};size_t n=0;if(!signed_image)return;ok(read_all(signed_image,&im,&n)==0,"signature-fixture-read");if(im){v->image_version=0;v->host_calls_used=v->io_used=v->storage_used=0;ok(br_image_load(v,im,n,badkey,32,1)==K23&&v->trap==N09,"trap-signature");free(im);}}
static void test_service_abi(br_vm*v){unsigned s;for(s=0;s<N55;s++){br_insn x=I(N16,BR_WRAP,0,1,2,0,s);int expected_ok=1;load1(v,x);v->caps[0]=N46;v->service_budget=64;v->services_used=0;v->host_calls_used=0;v->storage_used=0;v->io_used=0;rz(v,0);rz(v,1);rz(v,2);switch(s){case BR_SVC_DELEGATE:rs(v,1,0,1);rs(v,2,0,BR_CAP_CONTROL);break;case BR_SVC_SHA256:rs(v,1,0,0);rs(v,2,0,4);rs(v,0,0,32);break;case BR_SVC_ED25519_VERIFY:expected_ok=0;break;case BR_SVC_DEVICE_CALL:br_core_set_device(v,0,1,N00);rs(v,1,0,0);rs(v,2,0,0);rs(v,2,1,1);rs(v,0,0,0);rs(v,0,1,1);break;case BR_SVC_CONSOLE_READ:rs(v,1,0,0);rs(v,2,0,16);break;case BR_SVC_CONSOLE_WRITE:rs(v,1,0,0);rs(v,2,0,1);break;case BR_SVC_STORAGE_READ:rs(v,1,0,0);rs(v,2,0,0);rs(v,2,1,16);break;case BR_SVC_STORAGE_WRITE:rs(v,1,0,0);rs(v,2,0,1);rs(v,2,1,0);break;case BR_SVC_ENTROPY:rs(v,1,0,0);rs(v,2,0,16);break;case BR_SVC_DEVICE_ENUM:rs(v,1,0,0);rs(v,2,0,64);break;default:break;}if(expected_ok)ok(br_vm_step(v)==K0,"service-abi-positive");else ok(br_vm_step(v)!=K0&&v->trap==N09,"service-signature-requires-key");}}
static void test_abi(br_vm*v){uint8_t req[12]={1,BR_APDU_ABI,0,0,0,0,0,0,0,0,0,0},rsp[64];size_t n;br_trap_frame f;br_insn x=I(BR_TRAP,BR_WRAP,0,0,0,0,0);n=br_apdu(v,req,sizeof req,rsp,sizeof rsp);ok(n==32&&rsp[8]==BR_ISA_MAJOR&&rsp[9]==BR_ISA_MINOR&&rsp[10]==BR_ABI_MAJOR&&rsp[11]==BR_ABI_MINOR,"abi-query");ok(rsp[12]==0&&rsp[13]==0&&rsp[14]==1&&rsp[15]==0,"abi-version-le");br_vm_load_code(v,&x,1);v->caps[0]=N46;(void)br_vm_step(v);ok(br_vm_trap_frame(v,&f)==K0&&f.abi==BR_ABI_VERSION&&f.trap==BR_TRAP_GUEST,"abi-trap-frame");ok(N43==16&&N71==16&&N75==64,"abi-geometry");}
int main(int argc,char **argv){br_vm v;br_memory_adapter a;br_hal h;if(br_vm_init(&v)!=K0||br_memory_adapter_init(&a,&h,N46)!=K0||br_vm_bind_hal(&v,&h)!=K0){fprintf(stderr,"setup failure\n");return 2;}test_opcodes(&v);test_modes_and_width(&v);test_traps(&v,&h);test_service_abi(&v);test_abi(&v);test_signature(&v,argc>1?argv[1]:NULL);printf("{\"suite\":\"BR-430_ISA_ABI_CONFORMANCE\",\"opcodes\":%u,\"services\":%u,\"required_traps\":14,\"isa\":\"%u.%u\",\"abi\":\"%u.%u\",\"failures\":%d,\"result\":\"%s\"}\n",N28,N55,BR_ISA_MAJOR,BR_ISA_MINOR,BR_ABI_MAJOR,BR_ABI_MINOR,failures,failures?"FAIL":"PASS");br_vm_free(&v);return failures?1:0;}
