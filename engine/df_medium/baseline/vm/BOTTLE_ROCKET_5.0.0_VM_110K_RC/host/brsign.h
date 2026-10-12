#ifndef BOTTLE_ROCKET_BRSIGN_H
#define BOTTLE_ROCKET_BRSIGN_H
#include <stddef.h>
#include <stdint.h>
int br_host_secure_bundle(const uint8_t*,size_t,uint8_t**,size_t*,const uint8_t*,const uint8_t*,const uint8_t*,uint32_t,uint32_t,uint32_t,uint64_t,uint16_t);
int br_host_trust_control(uint8_t[128],uint8_t,uint32_t,uint32_t,uint64_t,uint32_t,const uint8_t*,int);
#endif
