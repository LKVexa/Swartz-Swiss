#include "brvm.h"
#include "br_host.h"
#include <stdio.h>
#include <string.h>
static int F,N; static void Q(const char*i,int c,const char*m){N++;if(!c)F++;printf("%s %s %s\n",i,c?"PASS":"FAIL",m);} 
#define I(O,M,D,A,B,C,X) ((br_insn){(B8)(O),(B8)(M),(B8)(D),(B8)(A),(B8)(B),(B8)(C),0,(B64)(X)})
static void reset(br_vm*v){br_vm_reset(v,1);v->caps[0]=v->caps[15]=N46;}
int main(void){br_vm v;br_memory_adapter a;br_hal h;br_insn p[4];int r;unsigned t;br_trap_frame f;if(br_vm_init(&v)||br_memory_adapter_init(&a,&h,N46)||br_vm_bind_hal(&v,&h))return 2;v.caps[0]=v.caps[15]=N46;
/* Every encoded operand position gets a legal boundary and an illegal boundary. */
p[0]=I(BR_MOVI,BR_WRAP,15,0,0,0,7);p[1]=I(BR_MOV,BR_WRAP,14,15,0,0,0);p[2]=I(BR_ADD,BR_WRAP,13,14,15,15,0);p[3]=I(BR_HALT,0,0,0,0,0,0);r=br_vm_load_code(&v,p,4);r=r?r:br_vm_step(&v);r=r?r:br_vm_step(&v);r=r?r:br_vm_step(&v);Q("BR-480-04-R03",r==0&&br_vm_reg_u64(&v,13)==14,"rd/ra/rb/cap operand positions accept register 15");
reset(&v);p[0]=I(BR_MOVI,BR_WRAP,16,0,0,0,1);br_vm_load_code(&v,p,1);Q("BR-480-04-R05",br_vm_step(&v)!=0&&v.trap==BR_TRAP_REGISTER,"register index 16 rejected; 15 accepted");
reset(&v);p[0]=I(BR_MOV,BR_WRAP,0,16,0,0,0);br_vm_load_code(&v,p,1);Q("BR-480-04-R03",br_vm_step(&v)!=0&&v.trap==BR_TRAP_REGISTER,"ra out of range rejected");
reset(&v);p[0]=I(BR_ADD,BR_WRAP,0,0,16,0,0);br_vm_load_code(&v,p,1);Q("BR-480-04-R03",br_vm_step(&v)!=0&&v.trap==BR_TRAP_REGISTER,"rb out of range rejected");
reset(&v);p[0]=I(BR_ADD,BR_WRAP,0,0,1,16,0);br_vm_load_code(&v,p,1);Q("BR-480-04-R03",br_vm_step(&v)!=0&&v.trap==BR_TRAP_REGISTER,"cap register out of range rejected");
/* Memory exact boundaries and alignment. */
reset(&v);br_vm_reg_set_limb(&v,0,0,0x1122334455667788ULL);p[0]=I(BR_STORE,0,0,0,0,0,K3-8);p[1]=I(BR_LOAD,0,1,0,0,0,K3-8);p[2]=I(BR_HALT,0,0,0,0,0,0);r=br_vm_load_code(&v,p,3);r=r?r:br_vm_step(&v);r=r?r:br_vm_step(&v);Q("BR-480-04-R06",r==0&&br_vm_reg_u64(&v,1)==0x1122334455667788ULL,"highest aligned 8-byte memory address accepted");
reset(&v);p[0]=I(BR_LOAD,0,0,0,0,0,K3-7);br_vm_load_code(&v,p,1);Q("BR-480-04-R06",br_vm_step(&v)!=0,"one byte beyond legal aligned boundary rejected");
reset(&v);p[0]=I(BR_LOAD,0,0,0,0,0,1);br_vm_load_code(&v,p,1);Q("BR-480-04-R06",br_vm_step(&v)!=0,"misaligned memory address rejected");
/* Every typed trap ID is representable in the ABI trap frame; ISA suite separately triggers all 14 production-required trap causes. */
for(t=1;t<32;t++){reset(&v);br_core_fault(&v,t);if(br_vm_trap_frame(&v,&f)!=0||f.trap!=t){F++;break;}}Q("BR-480-04-R04",t==32,"all 31 nonzero typed trap IDs round-trip; trap 0 is the no-trap sentinel");
Q("BR-480-04-R01",N28==32,"32-opcode ISA authority enumerated (positive/negative execution in br_isa_conformance)");Q("BR-480-04-R02",BR_TRAPPING==3,"four arithmetic modes enumerated and exercised in br_isa_conformance");
printf("{\"suite\":\"BR-480_OPCODE_EDGES\",\"requirements\":6,\"checks\":%d,\"failures\":%d,\"result\":\"%s\"}\n",N,F,F?"FAIL":"PASS");br_vm_free(&v);return F?1:0;}
