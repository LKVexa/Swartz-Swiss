#ifndef BOTTLE_ROCKET_BR_PROD_HOST_H
#define BOTTLE_ROCKET_BR_PROD_HOST_H
#include "brvm.h"
#include <stddef.h>
#include <stdint.h>
#define N42 N11
typedef struct{B8 objects[9][N42];BZ lengths[9];B64 monotonic,clock,rng;B32 locks;B8 state_key[32];}br_prod_memory_adapter;int br_prod_deterministic_adapter_init(br_prod_memory_adapter*,br_hal*,B32,B64);int br_host_image_write(const char*,const br_insn*,BZ,const B8*,BZ,B32,B32);
#endif
