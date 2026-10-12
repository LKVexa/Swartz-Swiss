#include "brtrust.h"
#include <string.h>
#define U_ unsigned
#define S_ static
#define C_ const
#define V_ void
#define I_ int
#define R_ return
#define A uint8_t
#define B uint32_t
#define C uint64_t
#define D size_t
#define E br_trust
#define F memcpy
#define G memcmp
#define H BR_TRUST_MANIFEST_BYTES
#define I BR_ESIGNATURE
#define J BR_ESTORAGE
#define K BR_EINTEGRITY
#define L BR_EINVAL
#define M BR_TRUST_LOGS
#define N BR_STORAGE_IMAGE0
#define O fragments
#define P br_trust_verify_manifest
#define Q BR_TRUST_EVENT_SIGNATURE_REJECTED
#define R BR_TRUST_EVENT_ROLLBACK_REJECTED
#define S BR_TRUST_EVENT_MALFORMED_IMAGE
#define T BR_TRUST_REVOKED
S_ C_ A ROOT[32]={0x57,0x31,0x74,0x08,0x1d,0x96,0x12,0x81,0x85,0xca,0x4d,0x4f,0x4a,0x02,0xdf,0x87,0x77,0xeb,0x90,0xd2,0x4c,0x47,0x4b,0x76,0xa2,0x70,0x48,0x54,0x4b,0x43,0x7d,0xd3};
S_ C_ A RID[8]={0x5c,0x3a,0x7d,0x9f,0xaf,0xc3,0xaa,0xfa};
S_ C_ A DP[]="BR-TRUST-POLICY-1\0",DM[]="BR-IMAGE-MANIFEST-1\0";
S_ B g32(C_ A*p){R_(B)p[0]|((B)p[1]<<8)|((B)p[2]<<16)|((B)p[3]<<24);}S_ C g64(C_ A*p){C v=0;U_ i;for(i=0;i<8;i++)v|=(C)p[i]<<(8*i);R_ v;}
S_ V_ lg(E*t,B e,B d,C v){br_trust_log*x=&t->log[t->lh_++%M];x->seq=++t->ls_;x->event=e;x->detail=d;x->value=v;}
S_ I_ sig(E*t,C_ A*k,C_ A*d,D dn,C_ A*s,C_ A*dom,D z){A b[384];if(!t||!t->vm||!t->vm->hal||!t->vm->hal->vs_||z+dn>sizeof(b))R_ I;F(b,dom,z);F(b+z,d,dn);R_ t->vm->hal->vs_(t->vm->hc_,k,32,b,z+dn,s,64);}
S_ I_ eq(C_ A*a,C_ A*b,D n){R_ G(a,b,n)==0;}S_ I_ rev(C_ E*t,C_ A*id){U_ i;for(i=0;i<t->rn_;i++)if(eq(t->revoked[i],id,8))R_ 1;R_ 0;}S_ I_ rvv(C_ E*t,B v){U_ i;for(i=0;i<T;i++)if(t->rv_[i]==v&&v)R_ 1;R_ 0;}
C_ A*br_trust_root_public(V_){R_ ROOT;}C_ A*br_trust_root_id(V_){R_ RID;}
I_ br_trust_init(E*t,br_vm*v,br_trust_anchor_read rd,V_*x){if(!t||!v)R_ L;memset(t,0,sizeof(*t));t->vm=v;F(t->root,ROOT,32);F(t->root_id,RID,8);
#ifdef BR_TRUST_HARDWARE_ANCHOR
if(rd){A h[32],d[32];if(rd(x,h))R_ BR_EIO;br_sha256(h,32,d);F(t->root,h,32);F(t->root_id,d,8);}
#else
(V_)x;if(rd)R_ BR_EUNSUPPORTED;
#endif
R_ BR_OK;}
I_ br_trust_apply_policy(E*t,C_ A*p,D n){C q,mono=0;B e,g,seq;U_ i;if(!t||!p||n!=BR_TRUST_POLICY_BYTES||G(p,"BRTP",4)||p[4]!=1||p[5]!=BR_TRUST_POLICY_VERSION||p[7]>T)R_ BR_EIMAGE;if(sig(t,t->root,p,288,p+288,DP,sizeof(DP)-1)){lg(t,Q,1,0);R_ I;}e=g32(p+8);g=g32(p+16);q=g64(p+24);seq=(B)g64(p+256);if((t->pl_&&(e<t->epoch||seq<=t->ps_))||(t->vm->hal&&t->vm->hal->mr_&&!t->vm->hal->mr_(t->vm->hc_,&mono)&&(C)e<(mono>>32))){lg(t,R,1,((C)e<<32)|g);R_ BR_EREPLAY;}t->epoch=e;t->mv_=g32(p+12);t->mg_=g;t->og_=g32(p+20);t->mt_=q;t->mx_=g32(p+32)&BR_CAP_ALL;t->ps_=seq;F(t->issuer_id,p+40,8);F(t->ri_,p+48,8);F(t->yi_,p+56,8);F(t->oi_,p+64,8);F(t->or_,p+72,8);F(t->ik_,p+80,32);F(t->rk_,p+112,32);F(t->yk_,p+144,32);F(t->old_rk_,p+176,32);t->rn_=p[7];memset(t->revoked,0,sizeof(t->revoked));memset(t->rv_,0,sizeof(t->rv_));for(i=0;i<t->rn_;i++)F(t->revoked[i],p+208+8*i,8);for(i=0;i<T;i++)t->rv_[i]=g32(p+240+4*i);t->pl_=1;lg(t,BR_TRUST_EVENT_SIGNATURE_ACCEPTED,1,e);R_ BR_OK;}
I_ P(E*t,C_ A*im,D n,C_ A*m,D mn){A d[32];C_ A*k;B ver,gen,ep,caps;C tx,exp,now=0,mono=0;I_ recovery,old=0;if(!t||!t->pl_||!im||!m||mn!=H||G(m,"BRMF",4)||m[4]!=1||m[5]!=BR_TRUST_POLICY_VERSION){if(t)lg(t,S,1,n);R_ BR_EIMAGE;}recovery=(m[6]&BR_TRUST_FLAG_RECOVERY)!=0;ver=g32(m+24);gen=g32(m+28);ep=g32(m+32);caps=g32(m+36);tx=g64(m+40);exp=g64(m+48);if(rev(t,m+8)||rev(t,m+16)){lg(t,BR_TRUST_EVENT_REVOKED_ISSUER,0,ep);R_ I;}if(recovery){k=t->yk_;if(!eq(m+8,t->root_id,8)||!eq(m+16,t->yi_,8)){lg(t,Q,2,0);R_ I;}}else{old=eq(m+16,t->or_,8)&&gen<=t->og_;k=old?t->old_rk_:t->rk_;if((!old&&!eq(m+16,t->ri_,8))||(!old&&!eq(m+8,t->issuer_id,8))||(old&&!eq(m+8,t->oi_,8))){lg(t,Q,3,0);R_ I;}}if(sig(t,k,m,152,m+152,DM,sizeof(DM)-1)){lg(t,Q,4,0);R_ I;}br_sha256(im,n,d);if(!eq(d,m+120,32)){lg(t,S,2,n);R_ K;}if(n<BR_IMAGE_HEADER||G(im,"BRIM",4)||!(im[7]&BR_IMAGE_FLAG_SIGNED)||g32(im+16)!=ver){lg(t,S,3,n);R_ BR_EIMAGE;}if(caps&~t->mx_||((B)(im[20]|im[21]<<8|im[22]<<16|im[23]<<24)&~caps)){lg(t,BR_TRUST_EVENT_UNAUTHORIZED_CAPABILITY,caps,t->mx_);R_ BR_ECAP;}if(ver<t->mv_||rvv(t,ver)||gen<t->mg_||gen<t->lg_||((!old&&!recovery)&&ep<t->epoch)||tx<t->mt_||tx<=t->lt_){lg(t,R,2,tx);R_ BR_EREPLAY;}if(exp){if(!t->vm->hal||!t->vm->hal->cr_||t->vm->hal->cr_(t->vm->hc_,&now)||now>exp)R_ BR_EREPLAY;}if(t->vm->hal&&t->vm->hal->mr_&&!t->vm->hal->mr_(t->vm->hc_,&mono)&&(((C)ep<<32)|gen)<mono){lg(t,R,3,mono);R_ BR_EREPLAY;}if(br_image_load(t->vm,im,n,k,32,1)!=BR_OK){lg(t,Q,5,0);R_ I;}t->vm->caps[0]&=caps;t->vm->sa_=1;t->lg_=gen;t->lt_=tx;if(t->vm->hal&&t->vm->hal->mc_&&t->vm->hal->mc_(t->vm->hc_,((C)ep<<32)|gen))R_ J;lg(t,BR_TRUST_EVENT_SIGNATURE_ACCEPTED,2,ver);if(recovery)lg(t,BR_TRUST_EVENT_RECOVERY,0,ver);R_ BR_OK;}
S_ V_ q32(A*p,B v){p[0]=v;p[1]=v>>8;p[2]=v>>16;p[3]=v>>24;}S_ B cr(C_ A*d,D n){B c=~0u;D i;U_ b;for(i=0;i<n;i++){c^=d[i];for(b=0;b<8;b++)c=(c>>1)^(0xedb88320u&(0u-(c&1u)));}R_~c;}S_ I_ nm(V_*x,C v){(V_)x;(V_)v;R_ 0;}
S_ I_ pre(E*t,C_ A*i,D n,C_ A*m,D z){E c;br_vm v;br_hal h;if(!t||!t->vm||!t->vm->hal)R_ L;c=*t;v=*t->vm;h=*v.hal;h.mc_=nm;v.hal=&h;c.vm=&v;R_ P(&c,i,n,m,z);}
S_ V_ ce(A*r,A st,A sl,A pv,C_ A*m){memset(r,0,512);F(r,"BRC2",4);r[4]=BR_PERSIST_VERSION;r[5]=st;r[6]=sl;r[7]=pv;F(r+8,m+28,4);F(r+12,m+32,4);F(r+16,m+24,4);F(r+20,m+40,8);F(r+28,m+36,4);F(r+32,m+120,32);F(r+64,m,H);q32(r+508,cr(r,508));}
S_ I_ cv(E*t,U_ sl,A*r,D*np){A*m,d[32];D n=0;br_vm*v=t?t->vm:0;if(!v||sl>1||!v->hal||!v->hal->sr_)R_ L;if(v->hal->sr_(v->hc_,sl,r,512,&n)||n!=512||G(r,"BRC2",4)||r[4]!=BR_PERSIST_VERSION||r[5]!=BR_PERSIST_COMMITTED||r[6]!=sl||g32(r+508)!=cr(r,508))R_ K;m=r+64;if(G(r+8,m+28,4)||G(r+12,m+32,4)||G(r+16,m+24,4)||G(r+20,m+40,8)||G(r+28,m+36,4)||G(r+32,m+120,32))R_ K;if(v->hal->sr_(v->hc_,N+sl,v->O,BR_UPDATE_BYTES,&n))R_ J;br_sha256(v->O,n,d);if(G(d,r+32,32)||pre(t,v->O,n,m,H))R_ K;*np=n;R_ 0;}
I_ br_trust_install(E*t,C_ A*i,D n,C_ A*m,D z){br_vm*v;A sl,pv,r[512],d[32];D qn=0;I_ e;if(!t||!(v=t->vm)||!i||!m||z!=H||n>BR_UPDATE_BYTES||!v->hal||!v->hal->sw_||!v->hal->sc_||!v->hal->sr_||!v->hal->lock||!v->hal->unlock)R_ L;if((e=pre(t,i,n,m,z)))R_ e;if(v->hal->lock(v->hc_))R_ BR_ESTATE;pv=v->as_&1u;sl=pv^1u;if(v->hal->sw_(v->hc_,N+sl,i,n)||v->hal->sc_(v->hc_,N+sl)){e=J;goto x;}if(v->hal->sr_(v->hc_,N+sl,v->O,BR_UPDATE_BYTES,&qn)||qn!=n){e=J;goto x;}br_sha256(v->O,qn,d);if(G(d,m+120,32)){e=K;goto x;}ce(r,BR_PERSIST_PENDING,sl,pv,m);if(v->hal->sw_(v->hc_,sl,r,512)||v->hal->sc_(v->hc_,sl)){e=J;goto x;}ce(r,BR_PERSIST_COMMITTED,sl,pv,m);if(v->hal->sw_(v->hc_,sl,r,512)||v->hal->sc_(v->hc_,sl)){e=J;goto x;}v->as_=sl;e=P(t,i,n,m,z);if(!e){v->pg_=g32(m+28);v->last_txid=(B)g64(m+40);F(v->ih_,m+120,32);}x:v->hal->unlock(v->hc_);R_ e;}
I_ br_trust_recover(E*t){A a[512],b[512],*r;D na=0,nb=0,n=0;I_ va,vb,e;B ga=0,gb=0;br_vm*v=t?t->vm:0;if(!v||!v->hal||!v->hal->lock||!v->hal->unlock)R_ L;if(v->hal->lock(v->hc_))R_ BR_ESTATE;va=cv(t,0,a,&na)==0;vb=cv(t,1,b,&nb)==0;if(!va&&!vb){e=J;goto x;}if(va)ga=g32(a+8);if(vb)gb=g32(b+8);r=va&&(!vb||ga>=gb)?a:b;if((e=cv(t,r[6],r,&n)))goto x;e=P(t,v->O,n,r+64,H);if(!e){v->as_=r[6];v->pg_=g32(r+8);v->last_txid=(B)g64(r+20);F(v->ih_,r+32,32);lg(t,BR_TRUST_EVENT_RECOVERY,r[6],g32(r+8));}x:v->hal->unlock(v->hc_);R_ e;}
I_ br_secure_load(E*t,C_ A*im,D n,C_ A*m,D mn){R_ P(t,im,n,m,mn);}I_ br_secure_start(E*t,C_ A*im,D n,C_ A*m,D mn,B budget){I_ r=br_secure_load(t,im,n,m,mn);R_ r?r:br_vm_run(t->vm,budget);}D br_trust_logs(C_ E*t,br_trust_log*out,D cap){D n,i;if(!t||!out||!cap)R_ 0;n=t->ls_<M?t->ls_:M;if(n>cap)n=cap;for(i=0;i<n;i++)out[i]=t->log[(t->lh_+M-n+i)%M];R_ n;}
