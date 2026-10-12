#ifndef BRTRUST_H
#define BRTRUST_H
#include "brvm.h"
enum{BR_TRUST_POLICY_VERSION=1u,BR_TRUST_POLICY_BYTES=352u,BR_TRUST_MANIFEST_BYTES=216u,BR_TRUST_REVOKED=4u,BR_TRUST_LOGS=16u,BR_TRUST_FLAG_RECOVERY=1u,BR_TRUST_EVENT_SIGNATURE_ACCEPTED=1u,BR_TRUST_EVENT_SIGNATURE_REJECTED=2u,BR_TRUST_EVENT_ROLLBACK_REJECTED=3u,BR_TRUST_EVENT_REVOKED_ISSUER=4u,BR_TRUST_EVENT_MALFORMED_IMAGE=5u,BR_TRUST_EVENT_UNAUTHORIZED_CAPABILITY=6u,BR_TRUST_EVENT_RECOVERY=7u,BR_PERSIST_VERSION=2u,BR_PERSIST_PENDING=0u,BR_PERSIST_COMMITTED=1u};
typedef int(*br_trust_anchor_read)(void*,uint8_t[32]);
typedef struct{uint32_t seq,event,detail;uint64_t value;}br_trust_log;
typedef struct{br_vm*vm;uint8_t root[32],root_id[8],issuer_id[8],ri_[8],yi_[8],oi_[8],or_[8],ik_[32],rk_[32],yk_[32],old_rk_[32],revoked[BR_TRUST_REVOKED][8];uint32_t rv_[BR_TRUST_REVOKED],epoch,mv_,mg_,og_,mx_,lg_;uint64_t mt_,lt_,ps_;uint8_t rn_,pl_;uint32_t ls_,lh_;br_trust_log log[BR_TRUST_LOGS];}br_trust;
const uint8_t*br_trust_root_public(void);const uint8_t*br_trust_root_id(void);int br_trust_init(br_trust*,br_vm*,br_trust_anchor_read,void*);int br_trust_apply_policy(br_trust*,const uint8_t*,size_t);int br_trust_verify_manifest(br_trust*,const uint8_t*,size_t,const uint8_t*,size_t);int br_trust_install(br_trust*,const uint8_t*,size_t,const uint8_t*,size_t);int br_trust_recover(br_trust*);int br_secure_load(br_trust*,const uint8_t*,size_t,const uint8_t*,size_t);int br_secure_start(br_trust*,const uint8_t*,size_t,const uint8_t*,size_t,uint32_t);size_t br_trust_logs(const br_trust*,br_trust_log*,size_t);
#endif
