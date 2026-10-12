#include "brvm.h"
#include "br_host.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#define LIMBS (1048576u/64u)
static int load_sparse(br_vm*v,unsigned r,const char*p){FILE*f=fopen(p,"r");unsigned idx;unsigned long long val;if(!f)return-1;while(fscanf(f,"%u %llx",&idx,&val)==2){if(idx>=LIMBS||br_vm_reg_set_limb(v,r,idx,(uint64_t)val)!=K0){fclose(f);return-1;}}fclose(f);return 0;}
static int emit(const br_vm*v,unsigned r,const char*p){FILE*f=fopen(p,"wb");uint64_t x;unsigned i;if(!f)return-1;for(i=0;i<LIMBS;i++){x=br_vm_reg_limb(v,r,i);if(fwrite(&x,1,8,f)!=8){fclose(f);return-1;}}return fclose(f);}
int main(int ac,char**av){br_vm v;br_memory_adapter a;br_hal h;br_insn prog[2];unsigned op,mode;unsigned long long imm;int rc;if(ac!=7){fprintf(stderr,"usage: %s OP MODE IMM A.sparse B.sparse OUT.bin\n",av[0]);return 2;}op=(unsigned)strtoul(av[1],0,0);mode=(unsigned)strtoul(av[2],0,0);imm=strtoull(av[3],0,0);if(op>=N28||mode>BR_TRAPPING)return 2;if(br_vm_init(&v)!=K0||br_memory_adapter_init(&a,&h,N46)!=K0||br_vm_bind_hal(&v,&h)!=K0)return 3;v.caps[0]=N46;if(load_sparse(&v,0,av[4])||load_sparse(&v,1,av[5])){br_vm_free(&v);return 4;}memset(prog,0,sizeof prog);prog[0].op=(B8)op;prog[0].mode=(B8)mode;prog[0].rd=2;prog[0].ra=0;prog[0].rb=1;prog[0].imm=(B64)imm;prog[1].op=BR_HALT;rc=br_vm_load_code(&v,prog,2);if(rc==K0)rc=br_vm_run(&v,4);if(emit(&v,2,av[6]))rc=5;printf("rc=%d trap=%u flags=%u status=%u kind=%u wide_bytes=%u\n",rc,v.trap,v.flags,v.status,br_vm_reg_kind(&v,2),br_vm_wide_bytes(&v));br_vm_free(&v);return 0;}
