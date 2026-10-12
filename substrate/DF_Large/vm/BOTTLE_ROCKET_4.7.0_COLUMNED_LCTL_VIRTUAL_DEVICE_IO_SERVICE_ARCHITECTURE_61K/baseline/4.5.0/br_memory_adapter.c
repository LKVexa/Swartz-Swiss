#include "br_adapters.h"
#include <string.h>
static uint8_t*obj(br_memory_ctx*c,uint32_t id,size_t*cap){if(id<2){*cap=512;return c->control[id];}if(id<4){*cap=BR_UPDATE_BYTES;return c->image[id-2];}if(id<BR_STORAGE_OBJECTS){*cap=BR_STORAGE_OBJECT_BYTES;return c->object[id-BR_STORAGE_OBJECT0];}return NULL;}
static int sr(void*x,uint32_t id,uint8_t*out,size_t cap,size_t*n){br_memory_ctx*c=x;size_t z;uint8_t*p=obj(c,id,&z);if(!c||!out||!n||!p||c->length[id]>cap)return BR_EBOUNDS;memcpy(out,p,c->length[id]);*n=c->length[id];return 0;}
static int sw(void*x,uint32_t id,const uint8_t*in,size_t n){br_memory_ctx*c=x;size_t z;uint8_t*p=obj(c,id,&z);if(!c||(!in&&n)||!p||n>z)return BR_EBOUNDS;if(n)memcpy(p,in,n);if(n<z)memset(p+n,0,z-n);c->length[id]=n;return 0;}
static int sc(void*x,uint32_t id){(void)x;return id<BR_STORAGE_OBJECTS?0:BR_EINVAL;}
static int se(void*x,uint32_t id){br_memory_ctx*c=x;size_t z;uint8_t*p=obj(c,id,&z);if(!c||!p)return BR_EINVAL;memset(p,0,z);c->length[id]=0;return 0;}
static int mr(void*x,uint64_t*v){br_memory_ctx*c=x;if(!c||!v)return BR_EINVAL;*v=c->monotonic;return 0;}
static int mc(void*x,uint64_t v){br_memory_ctx*c=x;if(!c||v<c->monotonic)return BR_EREPLAY;c->monotonic=v;return 0;}
static int vs(void*x,const uint8_t*k,size_t kn,const uint8_t*m,size_t mn,const uint8_t*s,size_t sn){(void)x;(void)k;(void)kn;(void)m;(void)mn;(void)s;(void)sn;return BR_EUNSUPPORTED;}
static int rb(void*x,uint8_t*out,size_t n){br_memory_ctx*c=x;size_t i;if(!c||(!out&&n))return BR_EINVAL;for(i=0;i<n;i++){c->rng^=c->rng<<13;c->rng^=c->rng>>7;c->rng^=c->rng<<17;out[i]=(uint8_t)c->rng;}return 0;}
static int cr(void*x,uint64_t*v){br_memory_ctx*c=x;if(!c||!v)return BR_EINVAL;*v=++c->clock;return 0;}
static int cir(void*x,uint8_t*out,size_t cap,size_t*n){br_memory_ctx*c=x;size_t z;if(!c||!out||!n)return BR_EINVAL;z=c->console_in_n-c->console_in_pos;if(z>cap)z=cap;memcpy(out,c->console_in+c->console_in_pos,z);c->console_in_pos+=z;*n=z;return 0;}
static int cow(void*x,const uint8_t*in,size_t n){br_memory_ctx*c=x;if(!c||(!in&&n)||n>sizeof(c->console_out)-c->console_out_n)return BR_EBOUNDS;memcpy(c->console_out+c->console_out_n,in,n);c->console_out_n+=n;return 0;}
static int dc(void*x,uint32_t id,const uint8_t*in,size_t n,uint8_t*out,size_t cap,size_t*used){br_memory_ctx*c=x;size_t z=n;if(!c||!out||!used)return BR_EINVAL;if(z+4>cap)z=cap>4?cap-4:0;if(cap<4)return BR_EBOUNDS;out[0]=(uint8_t)id;out[1]=(uint8_t)(id>>8);out[2]=(uint8_t)(id>>16);out[3]=(uint8_t)(id>>24);if(z&&in)memcpy(out+4,in,z);*used=z+4;c->dc_s++;return 0;}
static void pn(void*x,int e){br_memory_ctx*c=x;if(c)c->panic_code=e;}
static int yi(void*x){br_memory_ctx*c=x;return c?0:BR_EINVAL;}
static int lk(void*x){br_memory_ctx*c=x;if(!c||c->locked)return BR_ESTATE;c->locked=1;return 0;}
static int ul(void*x){br_memory_ctx*c=x;if(!c||!c->locked)return BR_ESTATE;c->locked=0;return 0;}
#define H {sr,sw,sc,se,mr,mc,vs,rb,cr,cir,cow,dc,pn,yi,lk,ul}
const br_hal br_hal_memory=H,br_hal_deterministic=H,br_hal_baremetal=H,br_hal_smartcard=H;
void br_memory_adapter_init(br_memory_ctx*c,enum br_memory_adapter_kind k,uint64_t seed){if(!c)return;memset(c,0,sizeof(*c));c->kind=k;c->rng=seed?seed:UINT64_C(0x4100b07e12345678);c->clock=k==BR_ADAPTER_DETERMINISTIC?UINT64_C(4100000):0;}
void br_memory_adapter_console(br_memory_ctx*c,const uint8_t*d,size_t n){if(!c)return;if(n>sizeof(c->console_in))n=sizeof(c->console_in);if(n&&d)memcpy(c->console_in,d,n);c->console_in_n=n;c->console_in_pos=0;}
