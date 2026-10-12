#include "brvm.h"
#include "br_host.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
static int loadf(const char*p,unsigned char**b,size_t*n){FILE*f=fopen(p,"rb");long z;if(!f)return-1;fseek(f,0,2);z=ftell(f);rewind(f);*b=malloc((size_t)z);if(!*b){fclose(f);return-1;}*n=fread(*b,1,(size_t)z,f);fclose(f);return *n==(size_t)z?0:-1;}
int main(int ac,char**av){unsigned char*raw=0,d[32],o[32];size_t rn=0,on=0;const unsigned cycles=20000;unsigned i;unsigned long execs=0,resets=0,loads=0,pers=0,roll=0;B32 peak=0;clock_t a0=clock();br_vm*v=calloc(1,sizeof*v);br_memory_adapter*m=calloc(1,sizeof*m);br_hal*h=calloc(1,sizeof*h);if(ac!=2||!v||!m||!h||loadf(av[1],&raw,&rn))return 2;if(br_vm_init(v)||br_memory_adapter_init(m,h,N46)||br_vm_bind_hal(v,h))return 3;v->caps[0]=N46;
for(i=0;i<cycles;i++){
 br_vm_reset(v,1);resets++;v->caps[0]=N46;
 if(br_image_load(v,raw,rn,NULL,0,0)!=0)return 10;
 loads++;
 if(br_vm_run(v,64)!=0||br_vm_reg_u64(v,2)!=42)return 11;
 execs++;
 if(br_vm_wide_bytes(v)>v->wm||br_vm_wide_peak_bytes(v)>v->wm)return 12;
 if(br_vm_wide_peak_bytes(v)>peak)peak=br_vm_wide_peak_bytes(v);
 if((i%10)==0){unsigned j;for(j=0;j<sizeof d;j++)d[j]=(unsigned char)(i+j);if(br_persist_guest_write(v,7,d,sizeof d)!=0)return 13;if(br_persist_guest_read(v,7,o,sizeof o,&on)!=0||on!=sizeof d||memcmp(d,o,sizeof d))return 14;pers++;}
 if((i%100)==0){B64 before=m->monotonic;m->monotonic=before+1;br_vm_reset(v,1);v->caps[0]=N46;(void)br_vm_recover(v);if(m->monotonic<before+1)return 15;roll++;}
}
printf("{\"suite\":\"BR-480_ACCELERATED_SOAK\",\"result\":\"PASS\",\"wall_hours\":%.6f,\"cycles\":%u,\"executions\":%lu,\"resets\":%lu,\"loads\":%lu,\"persistence_roundtrips\":%lu,\"rollback_attempts\":%lu,\"peak_wide_bytes\":%u,\"wide_ceiling_bytes\":%u,\"72_hour_requirement\":\"BLOCKED_NOT_ELAPSED\"}\n",(double)(clock()-a0)/CLOCKS_PER_SEC/3600.0,cycles,execs,resets,loads,pers,roll,peak,v->wm);br_vm_free(v);free(raw);free(v);free(m);free(h);return 0;}
