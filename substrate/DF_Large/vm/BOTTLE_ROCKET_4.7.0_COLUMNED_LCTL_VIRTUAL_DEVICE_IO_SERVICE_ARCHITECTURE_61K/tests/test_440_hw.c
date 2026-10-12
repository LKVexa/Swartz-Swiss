#include "brtrust.h"
#include "br_adapters.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
static uint8_t K[32];static int anchor(void*x,uint8_t o[32]){(void)x;memcpy(o,K,32);return 0;}static int load(const char*p,uint8_t**b,size_t*n){FILE*f=fopen(p,"rb");long z;if(!f)return-1;fseek(f,0,SEEK_END);z=ftell(f);fseek(f,0,SEEK_SET);*b=malloc(z);*n=fread(*b,1,z,f);fclose(f);return 0;}
int main(void){br_vm v;br_posix_ctx c;br_vm_config q={4096,64,64,BR_CAP_ALL,0,0};br_trust t;uint8_t*p,*k;size_t n,kn;int r;if(load("tests/keys/DEV_ONLY_DO_NOT_DEPLOY/dev.pub",&k,&kn)||kn!=32||load("tests/trust_fixtures/hw_policy.brtp",&p,&n))return 2;memcpy(K,k,32);br_posix_adapter_init(&c,".build/t440hw");br_vm_create(&v,&br_hal_posix,&c);br_vm_initialize(&v);br_vm_configure(&v,&q);r=br_trust_init(&t,&v,anchor,0);if(!r)r=br_trust_apply_policy(&t,p,n);printf("%s hardware_trust_anchor\n",r?"FAIL":"PASS");free(p);free(k);br_vm_destroy(&v);return r?1:0;}
