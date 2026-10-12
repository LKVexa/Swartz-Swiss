#include "brvm.h"
#include "br_host.h"
#include <stdio.h>
#include <string.h>
static int f,n;
static void Q(const char*id,int ok,const char*m){n++;if(!ok)f++;printf("%s %s %s\n",id,ok?"PASS":"FAIL",m);} 
#define I(O,M,D,A,B,IMM) ((br_insn){(B8)(O),(B8)(M),(B8)(D),(B8)(A),(B8)(B),0,0,(B64)(IMM)})
static void R(br_vm*v,br_memory_adapter*a,br_hal*h){br_vm_free(v);br_vm_init(v);br_memory_adapter_init(a,h,N46);br_vm_bind_hal(v,h);v->caps[0]=N46;}
static int run(br_vm*v,br_insn*x,size_t k){int r=br_vm_load_code(v,x,k);return r?r:br_vm_run(v,64);}
int main(void){br_vm a,b;br_memory_adapter ma,mb;br_hal ha,hb;br_insn p[6];int r;memset(&a,0,sizeof a);memset(&b,0,sizeof b);br_vm_init(&a);br_vm_init(&b);br_memory_adapter_init(&ma,&ha,N46);br_memory_adapter_init(&mb,&hb,N46);br_vm_bind_hal(&a,&ha);br_vm_bind_hal(&b,&hb);a.caps[0]=b.caps[0]=N46;
 p[0]=I(BR_MOVI,0,0,0,0,0x1234);p[1]=I(BR_MOVI,0,1,0,0,0);p[2]=I(BR_ADD,0,2,0,1,0);p[3]=I(BR_HALT,0,0,0,0,0);r=run(&a,p,4);Q("BR-480-05-R01",r==0&&br_vm_reg_u64(&a,2)==0x1234,"a + 0 = a");
 R(&a,&ma,&ha);p[0]=I(BR_MOVI,0,0,0,0,0xdeadbeef);p[1]=I(BR_XOR,0,2,0,0,0);p[2]=I(BR_HALT,0,0,0,0,0);r=run(&a,p,3);Q("BR-480-05-R02",r==0&&br_vm_reg_u64(&a,2)==0,"a XOR a = 0");
 R(&a,&ma,&ha);br_vm_reg_fill(&a,0,UINT64_MAX);br_vm_reg_set_limb(&a,1,0,1);p[0]=I(BR_ADD,0,2,0,1,0);p[1]=I(BR_HALT,0,0,0,0,0);r=run(&a,p,2);Q("BR-480-05-R03",r==0&&br_vm_reg_u64(&a,2)==0,"2^W modular wrap invariant");
 R(&a,&ma,&ha);br_vm_reg_set_limb(&a,0,0,0x1122334455667788ULL);p[0]=I(BR_STORE,0,0,0,0,128);p[1]=I(BR_LOAD,0,2,0,0,128);p[2]=I(BR_HALT,0,0,0,0,0);r=run(&a,p,3);Q("BR-480-05-R04",r==0&&br_vm_reg_u64(&a,2)==0x1122334455667788ULL,"load/store roundtrip");
 R(&a,&ma,&ha);br_vm_reg_set_limb(&a,0,0,0xa5a5);p[0]=I(BR_PUSH,0,0,0,0,0);p[1]=I(BR_MOVI,0,0,0,0,0);p[2]=I(BR_POP,0,2,0,0,0);p[3]=I(BR_HALT,0,0,0,0,0);r=run(&a,p,4);Q("BR-480-05-R05",r==0&&br_vm_reg_u64(&a,2)==0xa5a5&&a.sp==0,"push/pop invariant");
 R(&a,&ma,&ha);R(&b,&mb,&hb);p[0]=I(BR_MOVI,0,0,0,0,40);p[1]=I(BR_MOVI,0,1,0,0,2);p[2]=I(BR_ADD,1,2,0,1,0);p[3]=I(BR_HALT,0,0,0,0,0);int r1=run(&a,p,4),r2=run(&b,p,4);Q("BR-480-05-R06",r1==r2&&br_vm_reg_u64(&a,2)==br_vm_reg_u64(&b,2)&&a.trap==b.trap&&a.ip==b.ip,"deterministic execution invariant");
 printf("BR-480 property conformance: %s requirements=%d failures=%d\n",f?"FAIL":"PASS",n,f);br_vm_free(&a);br_vm_free(&b);return f?1:0;}
