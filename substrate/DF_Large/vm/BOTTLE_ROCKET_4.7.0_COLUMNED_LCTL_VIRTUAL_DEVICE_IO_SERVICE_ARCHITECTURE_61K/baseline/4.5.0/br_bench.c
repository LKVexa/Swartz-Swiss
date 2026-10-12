#define _POSIX_C_SOURCE 200809L
#include "brvm.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
static unsigned long long ns(void){struct timespec t;clock_gettime(CLOCK_MONOTONIC,&t);return(unsigned long long)t.tv_sec*1000000000ull+(unsigned long long)t.tv_nsec;}
static double runbench(br_vm*v,br_insn*c,size_t n,unsigned loops,unsigned counted){unsigned i;unsigned long long a=ns();for(i=0;i<loops;i++){if(br_vm_load_code(v,c,n)||br_vm_run(v,(uint32_t)n+1u))return 0;}return(double)loops*counted*1e9/(double)(ns()-a);}
int main(void){br_vm v;br_insn c[256];double ips,aops,lsops,bops;unsigned i;if(br_vm_init(&v))return 2;
memset(c,0,sizeof(c));for(i=0;i<255;i++){c[i].op=BR_NOP;c[i].cap=0;}c[255].op=BR_HALT;ips=runbench(&v,c,256,1200,256);
memset(c,0,sizeof(c));c[0].op=BR_MOVI;c[0].rd=0;c[0].imm=1;c[1].op=BR_MOVI;c[1].rd=1;c[1].imm=2;for(i=2;i<255;i++){c[i].op=BR_ADD;c[i].rd=2;c[i].ra=0;c[i].rb=1;c[i].mode=BR_WRAP;}c[255].op=BR_HALT;aops=runbench(&v,c,256,40,253);
memset(c,0,sizeof(c));c[0].op=BR_MOVI;c[0].rd=0;c[0].imm=7;for(i=1;i<254;i+=2){c[i].op=BR_STORE;c[i].ra=0;c[i].imm=0;c[i+1].op=BR_LOAD;c[i+1].rd=1;c[i+1].imm=0;}c[255].op=BR_HALT;lsops=runbench(&v,c,256,100,253);
memset(c,0,sizeof(c));for(i=0;i<254;i+=2){c[i].op=BR_JMP;c[i].imm=i+1;c[i+1].op=BR_NOP;}c[254].op=BR_NOP;c[255].op=BR_HALT;bops=runbench(&v,c,256,2000,128);
printf("{\"record\":\"BOTTLE_ROCKET.PerformanceBaseline\",\"instructions_per_second\":%.3f,\"arithmetic_ops_per_second\":%.3f,\"load_store_ops_per_second\":%.3f,\"load_store_mean_ns\":%.3f,\"branch_ops_per_second\":%.3f,\"branch_mean_ns\":%.3f}\n",ips,aops,lsops,lsops?1e9/lsops:0,bops,bops?1e9/bops:0);
br_vm_free(&v);return(ips&&aops&&lsops&&bops)?0:3;}
