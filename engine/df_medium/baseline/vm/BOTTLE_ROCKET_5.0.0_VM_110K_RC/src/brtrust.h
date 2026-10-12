#ifndef BOTTLE_ROCKET_BRTRUST_H
#define BOTTLE_ROCKET_BRTRUST_H
#include "brvm.h"
enum{N61=1,N65=416,BR_TRUST_BODY_BYTES=224,N66=128,BR_TRUST_CONTROL_BODY=64,N53=1,N62=1,N33=2,N38=4,N24=8,N03=4};enum{BR_SECURITY_SIG_ACCEPT=0x4401,BR_SECURITY_SIG_REJECT,N85,N08,N86,N76,N73};
#define BR_ROOT_KEY_ID 0x47ea4fefae481cc1ull
int br_secure_load(br_vm*,const B8*,BZ);int br_secure_startup(br_vm*);int br_trust_apply_control(br_vm*,const B8*,BZ);int br_trust_root(const br_vm*,B8[32],B64*,B32*);int br_trust_is_revoked_issuer(const br_vm*,B64);int br_trust_is_revoked_image(const br_vm*,B32);
#endif
