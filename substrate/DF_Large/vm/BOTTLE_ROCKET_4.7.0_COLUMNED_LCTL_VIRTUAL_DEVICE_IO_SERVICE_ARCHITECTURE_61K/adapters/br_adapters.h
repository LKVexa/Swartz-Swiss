#ifndef BR_ADAPTERS_H
#define BR_ADAPTERS_H
#include "brvm.h"
#include <stddef.h>
#include <stdint.h>
typedef struct{char prefix[192];int panic_code,locked,durable,lockfd;uint32_t dc_s;}br_file_ctx;typedef br_file_ctx br_posix_ctx;typedef br_file_ctx br_windows_ctx;
enum br_memory_adapter_kind{BR_ADAPTER_MEMORY,BR_ADAPTER_DETERMINISTIC,BR_ADAPTER_BARE_METAL,BR_ADAPTER_SMARTCARD};
typedef struct{uint8_t control[2][512],image[2][BR_UPDATE_BYTES],object[6][BR_STORAGE_OBJECT_BYTES],console_in[256],console_out[256];size_t length[BR_STORAGE_OBJECTS],console_in_n,console_in_pos,console_out_n;uint64_t monotonic,rng,clock;uint32_t dc_s;int panic_code,locked;enum br_memory_adapter_kind kind;}br_memory_ctx;
extern const br_hal br_hal_posix,br_hal_windows,br_hal_memory,br_hal_deterministic,br_hal_baremetal,br_hal_smartcard;
int br_posix_adapter_init(br_posix_ctx*,const char*);int br_windows_adapter_init(br_windows_ctx*,const char*);void br_memory_adapter_init(br_memory_ctx*,enum br_memory_adapter_kind,uint64_t);void br_memory_adapter_console(br_memory_ctx*,const uint8_t*,size_t);
#endif
