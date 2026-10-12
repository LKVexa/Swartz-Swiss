/* In-process interpreter throughput reference for BOTTLE ROCKET 5.0.0.
 * Added by the August 2026 audit remediation: qualification/br490_performance.py used a
 * process-launch wall time as "execution throughput"; this tool measures guest instructions
 * per second inside one process so the evidence states what it claims. Base-ISA opcodes only.
 * Build: Makefile target $(BUILD)/br_bench (make bench). Output: one JSON object on stdout.
 */
#define _POSIX_C_SOURCE 200809L
#include "brvm.h"
#include "br_host.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static unsigned long long ns(void)
{
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return (unsigned long long)t.tv_sec * 1000000000ull + (unsigned long long)t.tv_nsec;
}

static br_vm *V;
static br_memory_adapter *MA;
static br_hal *HAL;

/* Run the program repeatedly; grow the loop count until a sample lasts >= 0.2 s; best of 3 samples. */
static double bench(const br_insn *c, size_t n, unsigned counted)
{
    unsigned loops = 64, i, good = 0;
    double best = 0;
    for (;;) {
        unsigned long long a, b;
        double t, rate;
        br_vm_reset(V, 1);
        V->caps[0] = N46;
        a = ns();
        for (i = 0; i < loops; i++) {
            if (br_vm_load_code(V, c, n) || br_vm_run(V, (B32)n + 8u)) return 0;
        }
        b = ns();
        if (V->status != BR_HALTED) return 0;
        t = (double)(b - a) / 1e9;
        rate = (double)loops * counted / t;
        if (rate > best) best = rate;
        if (t < 0.2 && loops < (1u << 26)) { loops *= 4; continue; }
        if (++good >= 3) break;
    }
    return best;
}

int main(void)
{
    br_insn c[256];
    size_t i;
    double nop, add, ls, br, mix;
    V = calloc(1, sizeof *V);
    MA = calloc(1, sizeof *MA);
    HAL = calloc(1, sizeof *HAL);
    if (!V || !MA || !HAL) return 2;
    if (br_vm_init(V) || br_memory_adapter_init(MA, HAL, N46) || br_vm_bind_hal(V, HAL)) return 2;
    V->caps[0] = N46;

    /* NOP stream: dispatch cost */
    memset(c, 0, sizeof c);
    for (i = 0; i < 255; i++) c[i].op = N25;
    c[255].op = BR_HALT;
    nop = bench(c, 256, 256);

    /* small-operand ADD stream */
    memset(c, 0, sizeof c);
    c[0].op = BR_MOVI; c[0].rd = 0; c[0].imm = 1;
    c[1].op = BR_MOVI; c[1].rd = 1; c[1].imm = 2;
    for (i = 2; i < 255; i++) { c[i].op = BR_ADD; c[i].rd = 2; c[i].ra = 0; c[i].rb = 1; c[i].mode = BR_WRAP; }
    c[255].op = BR_HALT;
    add = bench(c, 256, 253);

    /* STORE/LOAD through the 64-bit memory port */
    memset(c, 0, sizeof c);
    c[0].op = BR_MOVI; c[0].rd = 0; c[0].imm = 7;
    for (i = 1; i < 254; i += 2) { c[i].op = BR_STORE; c[i].ra = 0; c[i].imm = 0; c[i + 1].op = BR_LOAD; c[i + 1].rd = 1; c[i + 1].imm = 0; }
    c[254].op = N25; c[255].op = BR_HALT;
    ls = bench(c, 256, 253);

    /* JMP chain */
    memset(c, 0, sizeof c);
    for (i = 0; i < 254; i += 2) { c[i].op = BR_JMP; c[i].imm = i + 2; c[i + 1].op = N25; }
    c[254].op = N25; c[255].op = BR_HALT;
    br = bench(c, 256, 127);

    /* mixed ALU / memory / stack / compare */
    memset(c, 0, sizeof c);
    c[0].op = BR_MOVI; c[0].rd = 0; c[0].imm = 40;
    c[1].op = BR_MOVI; c[1].rd = 1; c[1].imm = 2;
    for (i = 2; i < 250; i += 8) {
        c[i].op = BR_ADD; c[i].rd = 2; c[i].ra = 0; c[i].rb = 1;
        c[i + 1].op = BR_SUB; c[i + 1].rd = 3; c[i + 1].ra = 2; c[i + 1].rb = 1;
        c[i + 2].op = BR_MUL; c[i + 2].rd = 4; c[i + 2].ra = 3; c[i + 2].rb = 1;
        c[i + 3].op = BR_STORE; c[i + 3].ra = 4; c[i + 3].imm = 8;
        c[i + 4].op = BR_LOAD; c[i + 4].rd = 5; c[i + 4].imm = 8;
        c[i + 5].op = BR_PUSH; c[i + 5].ra = 5;
        c[i + 6].op = BR_POP; c[i + 6].rd = 6;
        c[i + 7].op = BR_CMP; c[i + 7].ra = 6; c[i + 7].rb = 4;
    }
    for (; i < 255; i++) c[i].op = N25;
    c[255].op = BR_HALT;
    mix = bench(c, 256, 256);

    printf("{\"record\":\"BOTTLE_ROCKET.InProcessThroughput/5.0.0\","
           "\"nop_instructions_per_second\":%.1f,\"small_add_ops_per_second\":%.1f,"
           "\"load_store_ops_per_second\":%.1f,\"branch_ops_per_second\":%.1f,"
           "\"mixed_instructions_per_second\":%.1f,"
           "\"method\":\"single process; br_vm_load_code+br_vm_run loop over 256-instruction base-ISA programs; best of 3 calibrated samples (>=0.2 s each)\"}\n",
           nop, add, ls, br, mix);
    br_vm_free(V);
    free(V); free(MA); free(HAL);
    return (nop && add && ls && br && mix) ? 0 : 3;
}
