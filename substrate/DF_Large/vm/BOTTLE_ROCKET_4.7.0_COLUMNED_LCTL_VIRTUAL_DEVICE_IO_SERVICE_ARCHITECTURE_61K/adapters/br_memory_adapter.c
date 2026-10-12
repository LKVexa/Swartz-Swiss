#include "br_adapters.h"
#include <string.h>
#define U_ unsigned
#define S_ static
#define C_ const
#define V_ void
#define I_ int
#define R_ return
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
S_ A*obj(E*c,C id,B*cap){if(id<2){*cap=512;R_ c->control[id];}if(id<4){*cap=BR_UPDATE_BYTES;R_ c->image[id-2];}if(id<J){*cap=BR_STORAGE_OBJECT_BYTES;R_ c->object[id-BR_STORAGE_OBJECT0];}R_ NULL;}
S_ I_ sr(V_*x,C id,A*out,B cap,B*n){E*c=x;B z;A*p=obj(c,id,&z);if(!c||!out||!n||!p||c->K[id]>cap)R_ I;F(out,p,c->K[id]);*n=c->K[id];R_ 0;}
S_ I_ sw(V_*x,C id,C_ A*in,B n){E*c=x;B z;A*p=obj(c,id,&z);if(!c||(!in&&n)||!p||n>z)R_ I;if(n)F(p,in,n);if(n<z)G(p+n,0,z-n);c->K[id]=n;R_ 0;}
S_ I_ sc(V_*x,C id){(V_)x;R_ id<J?0:H;}
S_ I_ se(V_*x,C id){E*c=x;B z;A*p=obj(c,id,&z);if(!c||!p)R_ H;G(p,0,z);c->K[id]=0;R_ 0;}
S_ I_ mr(V_*x,D*v){E*c=x;if(!c||!v)R_ H;*v=c->monotonic;R_ 0;}
S_ I_ mc(V_*x,D v){E*c=x;if(!c||v<c->monotonic)R_ BR_EREPLAY;c->monotonic=v;R_ 0;}
S_ I_ vs(V_*x,C_ A*k,B kn,C_ A*m,B mn,C_ A*s,B sn){(V_)x;(V_)k;(V_)kn;(V_)m;(V_)mn;(V_)s;(V_)sn;R_ BR_EUNSUPPORTED;}
S_ I_ rb(V_*x,A*out,B n){E*c=x;B i;if(!c||(!out&&n))R_ H;for(i=0;i<n;i++){c->rng^=c->rng<<13;c->rng^=c->rng>>7;c->rng^=c->rng<<17;out[i]=(A)c->rng;}R_ 0;}
S_ I_ cr(V_*x,D*v){E*c=x;if(!c||!v)R_ H;*v=++c->clock;R_ 0;}
S_ I_ cir(V_*x,A*out,B cap,B*n){E*c=x;B z;if(!c||!out||!n)R_ H;z=c->console_in_n-c->L;if(z>cap)z=cap;F(out,c->M+c->L,z);c->L+=z;*n=z;R_ 0;}
S_ I_ cow(V_*x,C_ A*in,B n){E*c=x;if(!c||(!in&&n)||n>sizeof(c->O)-c->N)R_ I;F(c->O+c->N,in,n);c->N+=n;R_ 0;}
S_ I_ dc(V_*x,C id,C_ A*in,B n,A*out,B cap,B*used){E*c=x;B z=n;if(!c||!out||!used)R_ H;if(id==BR_DEVICE_WALL_CLOCK&&in&&n&&in[0]==1&&cap>=8){D t=++c->clock;F(out,&t,8);*used=8;c->dc_s++;R_ 0;}if(z+4>cap)z=cap>4?cap-4:0;if(cap<4)R_ I;out[0]=(A)id;out[1]=(A)(id>>8);out[2]=(A)(id>>16);out[3]=(A)(id>>24);if(z&&in)F(out+4,in,z);*used=z+4;c->dc_s++;R_ 0;}
S_ V_ pn(V_*x,I_ e){E*c=x;if(c)c->panic_code=e;}
S_ I_ yi(V_*x){E*c=x;R_ c?0:H;}
S_ I_ lk(V_*x){E*c=x;if(!c||c->locked)R_ BR_ESTATE;c->locked=1;R_ 0;}
S_ I_ ul(V_*x){E*c=x;if(!c||!c->locked)R_ BR_ESTATE;c->locked=0;R_ 0;}
#define _H {sr,sw,sc,se,mr,mc,vs,rb,cr,cir,cow,dc,pn,yi,lk,ul}
C_ br_hal br_hal_memory=_H,br_hal_deterministic=_H,br_hal_baremetal=_H,br_hal_smartcard=_H;
V_ br_memory_adapter_init(E*c,enum br_memory_adapter_kind k,D seed){if(!c)R_;G(c,0,sizeof(*c));c->kind=k;c->rng=seed?seed:UINT64_C(0x4100b07e12345678);c->clock=k==BR_ADAPTER_DETERMINISTIC?UINT64_C(4100000):0;}
V_ br_memory_adapter_console(E*c,C_ A*d,B n){if(!c)R_;if(n>sizeof(c->M))n=sizeof(c->M);if(n&&d)F(c->M,d,n);c->console_in_n=n;c->L=0;}
