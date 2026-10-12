#define _GNU_SOURCE
#include "brvm.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/resource.h>
#if defined(__GLIBC__)
#include <malloc.h>
#endif
static size_t usable(void*p,size_t requested){
#if defined(__GLIBC__)
(void)requested;return p?malloc_usable_size(p):0;
#else
(void)p;return requested;
#endif
}
static long rss_kib(void){FILE*f=fopen("/proc/self/status","r");char s[160];long v=-1;if(!f)return-1;while(fgets(s,sizeof(s),f))if(sscanf(s,"VmRSS: %ld kB",&v)==1)break;fclose(f);return v;}
int main(void){
br_vm v;struct rlimit st;const size_t wb=(size_t)BR_LIMBS*sizeof(uint64_t),reg=(size_t)BR_REGS*wb,stack=(size_t)BR_STACK_WORDS*wb,tmp=2u*wb,frag=BR_UPDATE_BYTES;
long rss0=rss_kib(),rss1;size_t ur,us,ut1,ut2,uf,req,act,ov;
if(br_vm_init(&v))return 2;
ur=usable(v.regs,reg);us=usable(v.stack,stack);ut1=usable(v.tmp,wb);ut2=usable(v.tmp2,wb);uf=usable(v.fragments,frag);req=reg+stack+tmp+frag;act=ur+us+ut1+ut2+uf;ov=act>=req?act-req:0;rss1=rss_kib();
if(getrlimit(RLIMIT_STACK,&st))st.rlim_cur=0;
printf("{\"record\":\"BOTTLE_ROCKET.RuntimeMemoryMeasurement\",\"word_bits\":%u,\"word_bytes\":%zu,\"register_count\":%u,\"register_requested_bytes\":%zu,\"register_usable_bytes\":%zu,\"stack_words\":%u,\"stack_requested_bytes\":%zu,\"stack_usable_bytes\":%zu,\"scratch_words\":2,\"scratch_requested_bytes\":%zu,\"scratch_usable_bytes\":%zu,\"fragment_requested_bytes\":%zu,\"fragment_usable_bytes\":%zu,\"vm_inline_bytes\":%zu,\"heap_requested_bytes\":%zu,\"heap_usable_bytes\":%zu,\"allocator_overhead_bytes\":%zu,\"rss_before_init_kib\":%ld,\"rss_idle_kib\":%ld,\"native_stack_limit_bytes\":%llu}\n",BR_WORD_BITS,wb,BR_REGS,reg,ur,BR_STACK_WORDS,stack,us,tmp,ut1+ut2,frag,uf,sizeof(br_vm),req,act,ov,rss0,rss1,(unsigned long long)st.rlim_cur);
br_vm_free(&v);return 0;
}
