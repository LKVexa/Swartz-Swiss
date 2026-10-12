#include "brvm.h"
#include "br_host.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
static unsigned long long S=0x480060480060ULL;
static unsigned R(void){S^=S<<13;S^=S>>7;S^=S<<17;return(unsigned)S;}
static int loadf(const char*p,unsigned char**b,size_t*n){FILE*f=fopen(p,"rb");long z;if(!f)return-1;fseek(f,0,2);z=ftell(f);rewind(f);*b=malloc((size_t)z+32);if(!*b){fclose(f);return-1;}*n=fread(*b,1,(size_t)z,f);fclose(f);return 0;}
static int init(br_vm*v,br_memory_adapter*a,br_hal*h){memset(v,0,sizeof(*v));if(br_vm_init(v)||br_memory_adapter_init(a,h,N46)||br_vm_bind_hal(v,h))return-1;v->caps[0]=N46;return 0;}
int main(int ac,char**av){unsigned char*raw=0,q[768],o[768],tmp[768],payload[64];size_t rn=0,i,j,n,on=0;unsigned long apdu=0,img=0,svc=0,pers=0;int rc; br_vm*v=calloc(1,sizeof* v);br_memory_adapter*a=calloc(1,sizeof*a),*base=calloc(1,sizeof*base);br_hal*h=calloc(1,sizeof*h);if(ac!=2||!v||!a||!base||!h||loadf(av[1],&raw,&rn)||rn>700)return 2;if(init(v,a,h))return 3;
/* APDU parser fuzz: arbitrary lengths/bytes, response must stay bounded. */
for(i=0;i<8000;i++){n=R()%sizeof q;for(j=0;j<n;j++)q[j]=(unsigned char)R();on=br_apdu(v,q,n,o,sizeof o);if(on>sizeof o){fprintf(stderr,"APDU overflow\n");return 10;}apdu++;if(!(i%64))br_vm_reset(v,1);}
/* Image parser/loader fuzz: mutate valid seed and vary truncation/extension. */
for(i=0;i<6000;i++){size_t z=rn;memcpy(tmp,raw,rn);for(j=0;j<1+(R()%6);j++){size_t k=R()%rn;tmp[k]^=(unsigned char)(1u+(R()%255));}if((i%3)==0)z=R()%(rn+1);else if((i%7)==0){z=rn+(R()%16);for(j=rn;j<z;j++)tmp[j]=(unsigned char)R();}B32 ver=0,caps=0;B16 cc=0,dl=0;int sg=0;(void)br_image_inspect(tmp,z,&ver,&cc,&dl,&caps,&sg);br_vm_reset(v,1);v->caps[0]=N46;(void)br_image_load(v,tmp,z,NULL,0,0);img++;}
/* Service/device ABI fuzz: arbitrary slot/op/buffer tuples. */
for(i=0;i<6000;i++){if(!(i%32)){br_vm_reset(v,1);v->caps[0]=N46;}size_t off=R()%(K3+64u), in=R()%(BR_DPKT+64u), oo=R()%(K3+64u), cap=R()%(BR_DPKT+64u);on=0;(void)br_device_invoke(v,R()%10u,R()%10u,off,in,oo,cap,&on);if(on>cap&&cap<=BR_DPKT){fprintf(stderr,"device length contract\n");return 11;}svc++;}
/* Persistence-record fuzz: establish two authenticated controls, mutate copies, recover; monotonic must never decrease. */
br_vm_reset(v,1);v->caps[0]=N46;v->image_version=9;v->persistent_generation=1;if(br_vm_save(v))return 12;v->persistent_generation=2;if(br_vm_save(v))return 13;memcpy(base,a,sizeof(*a));
for(i=0;i<2500;i++){memcpy(a,base,sizeof(*a));for(j=0;j<1+(R()%5);j++){unsigned obj=R()%2u;if(a->lengths[obj])a->objects[obj][R()%a->lengths[obj]]^=(unsigned char)(1+(R()%255));}a->monotonic=base->monotonic;memset(v,0,sizeof(*v));if(br_vm_init(v)||br_vm_bind_hal(v,h))return 14;v->caps[0]=N46;rc=br_vm_recover(v);(void)rc;if(a->monotonic<base->monotonic){fprintf(stderr,"monotonic rollback\n");return 15;}pers++;br_vm_free(v);}
/* Malformed guest persistence payloads through public API. */
if(init(v,a,h))return 16;
for(i=0;i<2500;i++){for(j=0;j<sizeof payload;j++)payload[j]=(unsigned char)R();size_t z=R()%sizeof payload;(void)br_persist_guest_write(v,R()%300u,payload,z);size_t got=0;(void)br_persist_guest_read(v,R()%300u,o,sizeof o,&got);if(got>sizeof o)return 17;pers++;}
printf("{\"suite\":\"BR-480_C_FUZZ\",\"result\":\"PASS\",\"seed\":\"0x480060480060\",\"apdu_cases\":%lu,\"image_cases\":%lu,\"service_cases\":%lu,\"persistence_cases\":%lu,\"total\":%lu}\n",apdu,img,svc,pers,apdu+img+svc+pers);br_vm_free(v);free(raw);free(v);free(a);free(base);free(h);return 0;}
