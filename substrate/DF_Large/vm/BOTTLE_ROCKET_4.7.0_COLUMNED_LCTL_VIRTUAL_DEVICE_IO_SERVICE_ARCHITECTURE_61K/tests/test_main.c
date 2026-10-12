#include "brvm.h"
#include <stdio.h>
int main(void){int r=br_core_selftest();printf("{\"suite\":\"brvm-core\",\"failures\":%d,\"result\":\"%s\"}\n",r?1:0,r?"FAIL":"PASS");return r?1:0;}
