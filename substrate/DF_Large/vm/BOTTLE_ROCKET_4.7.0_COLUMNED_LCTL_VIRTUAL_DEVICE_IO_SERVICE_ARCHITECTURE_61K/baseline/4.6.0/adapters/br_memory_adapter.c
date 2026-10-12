#include "br_adapters.h"
#include <string.h>
#define A uint8_t
#define B size_t
#define C uint32_t
#define D uint64_t
#define E br_memory_ctx
#define F memcpy
#define G memset
#define H BR_EINVAL
#define I BR_EBOUNDS
#define J BR_STORAGE_OBJECTS
#define K length
#define L console_in_pos
#define M console_in
#define N console_out_n
#define O console_out
static A*obj(E*c,C id,B*cap){if(id<2){*cap=512;return c->control[id];}if(id<4){*cap=BR_UPDATE_BYTES;return c->image[id-2];}if(id<J){*cap=BR_STORAGE_OBJECT_BYTES;return c->object[id-BR_STORAGE_OBJECT0];}return NULL;}
static int sr(void*x,C id,A*out,B cap,B*n){E*c=x;B z;A*p=obj(c,id,&z);if(!c||!out||!n||!p||c->K[id]>cap)return I;F(out,p,c->K[id]);*n=c->K[id];return 0;}
static int sw(void*x,C id,const A*in,B n){E*c=x;B z;A*p=obj(c,id,&z);if(!c||(!in&&n)||!p||n>z)return I;if(n)F(p,in,n);if(n<z)G(p+n,0,z-n);c->K[id]=n;return 0;}
static int sc(void*x,C id){(void)x;return id<J?0:H;}
static int se(void*x,C id){E*c=x;B z;A*p=obj(c,id,&z);if(!c||!p)return H;G(p,0,z);c->K[id]=0;return 0;}
static int mr(void*x,D*v){E*c=x;if(!c||!v)return H;*v=c->monotonic;return 0;}
static int mc(void*x,D v){E*c=x;if(!c||v<c->monotonic)return BR_EREPLAY;c->monotonic=v;return 0;}
static int vs(void*x,const A*k,B kn,const A*m,B mn,const A*s,B sn){(void)x;(void)k;(void)kn;(void)m;(void)mn;(void)s;(void)sn;return BR_EUNSUPPORTED;}
static int rb(void*x,A*out,B n){E*c=x;B i;if(!c||(!out&&n))return H;for(i=0;i<n;i++){c->rng^=c->rng<<13;c->rng^=c->rng>>7;c->rng^=c->rng<<17;out[i]=(A)c->rng;}return 0;}
static int cr(void*x,D*v){E*c=x;if(!c||!v)return H;*v=++c->clock;return 0;}
static int cir(void*x,A*out,B cap,B*n){E*c=x;B z;if(!c||!out||!n)return H;z=c->console_in_n-c->L;if(z>cap)z=cap;F(out,c->M+c->L,z);c->L+=z;*n=z;return 0;}
static int cow(void*x,const A*in,B n){E*c=x;if(!c||(!in&&n)||n>sizeof(c->O)-c->N)return I;F(c->O+c->N,in,n);c->N+=n;return 0;}
static int dc(void*x,C id,const A*in,B n,A*out,B cap,B*used){E*c=x;B z=n;if(!c||!out||!used)return H;if(z+4>cap)z=cap>4?cap-4:0;if(cap<4)return I;out[0]=(A)id;out[1]=(A)(id>>8);out[2]=(A)(id>>16);out[3]=(A)(id>>24);if(z&&in)F(out+4,in,z);*used=z+4;c->dc_s++;return 0;}
static void pn(void*x,int e){E*c=x;if(c)c->panic_code=e;}
static int yi(void*x){E*c=x;return c?0:H;}
static int lk(void*x){E*c=x;if(!c||c->locked)return BR_ESTATE;c->locked=1;return 0;}
static int ul(void*x){E*c=x;if(!c||!c->locked)return BR_ESTATE;c->locked=0;return 0;}
#define _H {sr,sw,sc,se,mr,mc,vs,rb,cr,cir,cow,dc,pn,yi,lk,ul}
const br_hal br_hal_memory=_H,br_hal_deterministic=_H,br_hal_baremetal=_H,br_hal_smartcard=_H;
void br_memory_adapter_init(E*c,enum br_memory_adapter_kind k,D seed){if(!c)return;G(c,0,sizeof(*c));c->kind=k;c->rng=seed?seed:UINT64_C(0x4100b07e12345678);c->clock=k==BR_ADAPTER_DETERMINISTIC?UINT64_C(4100000):0;}
void br_memory_adapter_console(E*c,const A*d,B n){if(!c)return;if(n>sizeof(c->M))n=sizeof(c->M);if(n&&d)F(c->M,d,n);c->console_in_n=n;c->L=0;}
