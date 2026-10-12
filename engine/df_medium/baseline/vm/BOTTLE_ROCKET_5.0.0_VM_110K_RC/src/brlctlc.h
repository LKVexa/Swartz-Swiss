#ifndef BOTTLE_ROCKET_BRLCTLC_H
#define BOTTLE_ROCKET_BRLCTLC_H
#include <stddef.h>
#include <stdint.h>
#define BR_LCTLC_VERSION "LCTLC/1.1"
#define BR_BIR_VERSION "BRIR/1.1"
#define BR_LCTL_COMPILER_VERSION 0x00040700u
#define BR_LCTL_VERIFIER_VERSION 0x00040700u
int br_lctlc_verify_file(const char*source,char*diag,size_t diag_cap);int br_lctlc_to_brir_file(const char*source,const char*brir);int br_lctlc_compile_file(const char*source,const char*image,uint32_t version_override);
#endif
