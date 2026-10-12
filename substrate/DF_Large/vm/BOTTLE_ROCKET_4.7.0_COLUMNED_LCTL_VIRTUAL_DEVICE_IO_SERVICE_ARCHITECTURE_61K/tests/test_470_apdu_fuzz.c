#include "brvm.h"
#include "br_adapters.h"
#include <stdio.h>
#include <stdint.h>
#include <string.h>
static unsigned x=0x47012345u;static unsigned r(void){x=x*1664525u+1013904223u;return x;}
int main(void){br_vm v;br_memory_ctx c;br_vm_config q={64,64,64,BR_CAP_ALL,0,0};uint8_t in[96],out[600];unsigned i,j;int fail=0;br_memory_adapter_init(&c,BR_ADAPTER_MEMORY,1);if(br_vm_create(&v,&br_hal_memory,&c)||br_vm_initialize(&v)||br_vm_configure(&v,&q))return 2;for(i=0;i<512;i++){size_t n=r()%sizeof(in),z;for(j=0;j<n;j++)in[j]=(uint8_t)r();z=br_apdu(&v,in,n,out,sizeof(out));if(z>sizeof(out))fail++;}br_vm_destroy(&v);printf("%s deterministic_apdu_fuzz_512\n{\"suite\":\"BR-470-APDU-FUZZ\",\"tests\":512,\"failures\":%d,\"result\":\"%s\"}\n",fail?"FAIL":"PASS",fail,fail?"FAIL":"PASS");return fail?1:0;}
