#ifndef BOTTLE_ROCKET_BR_HOST_H
#define BOTTLE_ROCKET_BR_HOST_H
#include "brvm.h"
#include <stddef.h>
#include <stdint.h>
#define BR_MEM_OBJECT_CAP N11
typedef struct{char prefix[240];uint32_t allow;int lock_fd;uint8_t state_key[32];}br_posix_adapter;
typedef struct{char prefix[240];uint32_t allow;int lock_fd;uint8_t state_key[32];}br_windows_adapter;
typedef struct{uint8_t objects[9][BR_MEM_OBJECT_CAP];size_t lengths[9];uint64_t monotonic,clock,rng;uint32_t allow,yields,locks;uint8_t state_key[32];int smartcard;uint32_t fault_after,fault_count,fault_kind;}br_memory_adapter;
int br_posix_adapter_init(br_posix_adapter*,br_hal*,const char*,uint32_t);
int br_windows_adapter_init(br_windows_adapter*,br_hal*,const char*,uint32_t);
int br_memory_adapter_init(br_memory_adapter*,br_hal*,uint32_t);
int br_deterministic_adapter_init(br_memory_adapter*,br_hal*,uint32_t,uint64_t);
int br_baremetal_adapter_init(br_memory_adapter*,br_hal*,uint32_t);
int br_smartcard_adapter_init(br_memory_adapter*,br_hal*,uint32_t);
int br_host_image_write(const char*,const br_insn*,size_t,const uint8_t*,size_t,uint32_t,uint32_t);
int br_host_image_sign(uint8_t*,size_t*,size_t,const uint8_t*,size_t);
int br_host_ed25519_public(const uint8_t*,size_t,uint8_t[32]);
#endif
