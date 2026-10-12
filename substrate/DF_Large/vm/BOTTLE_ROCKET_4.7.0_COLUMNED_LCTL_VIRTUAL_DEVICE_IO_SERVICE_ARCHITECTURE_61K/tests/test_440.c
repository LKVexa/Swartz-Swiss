#include "brtrust.h"
#include "br_adapters.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
typedef struct{uint8_t*p;size_t n;}blob;
static blob rd(const char*n){char p[256];FILE*f;long z;blob b={0};snprintf(p,sizeof(p),"tests/trust_fixtures/%s",n);f=fopen(p,"rb");if(!f)return b;fseek(f,0,SEEK_END);z=ftell(f);fseek(f,0,SEEK_SET);b.p=malloc((size_t)z);b.n=fread(b.p,1,(size_t)z,f);fclose(f);return b;}static void fr(blob*b){free(b->p);b->p=0;b->n=0;}
static int vmnew(br_vm*v,br_posix_ctx*c,const char*p){br_vm_config q={4096,64,64,BR_CAP_ALL,0,0};if(br_posix_adapter_init(c,p)||br_vm_create(v,&br_hal_posix,c)||br_vm_initialize(v)||br_vm_configure(v,&q))return-1;return 0;}static void clean(const char*p){char q[256];unsigned i;for(i=0;i<8;i++){snprintf(q,sizeof(q),"%s.%s.%u",p,i<2?"ctl":i<4?"img":"obj",i<2?i:i<4?i-2:i-4);remove(q);snprintf(q,sizeof(q),"%s.%s.%u.tmp",p,i<2?"ctl":i<4?"img":"obj",i<2?i:i<4?i-2:i-4);remove(q);}snprintf(q,sizeof(q),"%s.mono",p);remove(q);snprintf(q,sizeof(q),"%s.mono.tmp",p);remove(q);}
static int init(br_vm*v,br_posix_ctx*c,br_trust*t,const char*p){clean(p);if(vmnew(v,c,p))return-1;return br_trust_init(t,v,0,0);}static int pass(const char*n,int ok){printf("%s %s\n",ok?"PASS":"FAIL",n);return ok?0:1;}
static int hwstub(void*x,uint8_t out[32]){(void)x;(void)out;return 0;}
int main(void){int f=0,r;br_vm v;br_posix_ctx c;br_trust t;blob p1=rd("policy_v1.brtp"),p2=rd("policy_rotated.brtp"),pr=rd("policy_revoked.brtp"),pr10=rd("policy_revoke_v10.brtp"),ps=rd("policy_stale.brtp"),u=rd("../../deploy/BOTTLE_ROCKET_SIM_CORE_4.3.0.brimg"),i1=rd("image_r1.brimg"),i2=rd("image_r2.brimg"),ir=rd("image_recovery.brimg"),i9=rd("image_v9.brimg"),m1=rd("manifest_r1.brmf"),m2=rd("manifest_r2.brmf"),mo=rd("manifest_old_overlap.brmf"),mx=rd("manifest_old_expired.brmf"),mr=rd("manifest_revoked.brmf"),mrec=rd("manifest_recovery.brmf"),m9=rd("manifest_v9.brmf"),mc=rd("manifest_caps_low.brmf"),me=rd("manifest_expired.brmf"),mb=rd("manifest_bad_signature.brmf");
#define NEW(N) do{br_vm_destroy(&v);if(init(&v,&c,&t,".build/" N)){puts("init fail");return 2;}}while(0)
 memset(&v,0,sizeof(v));NEW("t440a");f+=pass("immutable_root_and_policy",memcmp(br_trust_root_public(),t.root,32)==0&&memcmp(br_trust_root_id(),t.root_id,8)==0&&br_trust_apply_policy(&t,p1.p,p1.n)==0&&t.epoch==1&&t.mx_==255);
 r=br_image_load(&v,u.p,u.n,0,0,0);if(!r)r=br_vm_run(&v,64);f+=pass("unsigned_cannot_execute",r==BR_ESIGNATURE);
 NEW("t440b");br_trust_apply_policy(&t,p1.p,p1.n);r=br_image_load(&v,i1.p,i1.n,t.rk_,32,1);if(!r)r=br_vm_run(&v,64);f+=pass("signed_without_manifest_cannot_execute",r==BR_ESIGNATURE);
 NEW("t440b2");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_trust_apply_policy(&t,p1.p,p1.n);f+=pass("policy_replay_rejected",r==BR_EREPLAY);
 NEW("t440c");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_secure_start(&t,i1.p,i1.n,m1.p,m1.n,64);f+=pass("secure_start",r==0&&v.status==BR_HALTED&&t.lt_==1);
 r=br_secure_load(&t,i1.p,i1.n,m1.p,m1.n);f+=pass("replay_rejected",r==BR_EREPLAY);
 NEW("t440c2");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,m1.p,m1.n);if(!r)r=br_image_load(&v,i1.p,i1.n,t.rk_,32,1);if(!r)r=br_vm_run(&v,64);f+=pass("authorization_not_sticky",r==BR_ESIGNATURE);
 NEW("t440d");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,m1.p,m1.n);if(!r)r=br_trust_apply_policy(&t,p2.p,p2.n);if(!r)r=br_secure_load(&t,i2.p,i2.n,m2.p,m2.n);f+=pass("key_rotation_new_release",r==0&&t.epoch==2&&t.lt_==2);
 NEW("t440e");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_trust_apply_policy(&t,p2.p,p2.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,mo.p,mo.n);f+=pass("rotation_overlap",r==0);
 NEW("t440f");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_trust_apply_policy(&t,p2.p,p2.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,mx.p,mx.n);f+=pass("old_release_deauthorized",r==BR_ESIGNATURE);
 NEW("t440g");r=br_trust_apply_policy(&t,pr.p,pr.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,mr.p,mr.n);f+=pass("revoked_issuer_rejected",r==BR_ESIGNATURE);
 NEW("t440h");r=br_trust_apply_policy(&t,pr10.p,pr10.n);if(!r)r=br_secure_load(&t,i2.p,i2.n,m2.p,m2.n);f+=pass("revoked_image_version_rejected",r==BR_EREPLAY);
 NEW("t440i");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_trust_apply_policy(&t,ps.p,ps.n);f+=pass("stale_control_record_rejected",r==BR_EREPLAY);
 NEW("t440j");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_secure_load(&t,i9.p,i9.n,m9.p,m9.n);f+=pass("rollback_version_rejected",r==BR_EREPLAY);
 NEW("t440k");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,mc.p,mc.n);f+=pass("unauthorized_capability_rejected",r==BR_ECAP);
 NEW("t440l");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,me.p,me.n);f+=pass("expired_manifest_rejected",r==BR_EREPLAY);
 NEW("t440m");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,mb.p,mb.n);f+=pass("bad_signature_rejected",r==BR_ESIGNATURE);
 NEW("t440n");r=br_trust_apply_policy(&t,pr.p,pr.n);if(!r)r=br_secure_start(&t,ir.p,ir.n,mrec.p,mrec.n,64);f+=pass("emergency_recovery",r==0);
 NEW("t440o");r=br_trust_init(&t,&v,hwstub,0);f+=pass("hardware_anchor_requires_separate_build",r==BR_EUNSUPPORTED);
 {br_insn x={BR_HALT,BR_WRAP,0,0,0,0,0,0};f+=pass("direct_opcode_injection_disabled",br_vm_load_code(&v,&x,1)==BR_EUNSUPPORTED);}
 {br_insn x={BR_HALT,BR_WRAP,0,0,0,0,0,0};uint8_t req[28]={1,BR_APDU_LOAD,0,0,1,0,0,0,0,0,16,0},out[32];memcpy(req+12,&x,16);f+=pass("raw_apdu_load_disabled",((br_apdu(&v,req,sizeof(req),out,sizeof(out))>=2)&&out[0]==0x69&&out[1]==0x82));}
 NEW("t440p");r=br_trust_apply_policy(&t,p1.p,p1.n);if(!r)r=br_secure_load(&t,i1.p,i1.n,mb.p,mb.n);{br_trust_log l[16];size_t n=br_trust_logs(&t,l,16);int seen=0;size_t j;for(j=0;j<n;j++)if(l[j].event==BR_TRUST_EVENT_SIGNATURE_REJECTED)seen=1;f+=pass("security_log_rejection_event",seen);}
 {br_trust_log l[16];size_t n=br_trust_logs(&t,l,16);f+=pass("security_log_bounded",n<=16);}
 printf("{\"suite\":\"BR-440\",\"tests\":23,\"failures\":%d,\"result\":\"%s\"}\n",f,f?"FAIL":"PASS");br_vm_destroy(&v);
 fr(&p1);fr(&p2);fr(&pr);fr(&pr10);fr(&ps);fr(&u);fr(&i1);fr(&i2);fr(&ir);fr(&i9);fr(&m1);fr(&m2);fr(&mo);fr(&mx);fr(&mr);fr(&mrec);fr(&m9);fr(&mc);fr(&me);fr(&mb);return f?1:0;}
