#include "brlctlc.h"
#include <stdio.h>
int main(void){char d[192];int f=br_lctlc_verify_file("examples/boot.lctlc",d,sizeof d)!=0;printf("{\"suite\":\"BOTTLE_ROCKET_4.7.0_DEVICE_IO_AUTHORITY\",\"failures\":%d,\"result\":\"%s\"}\n",f,f?"FAIL":"PASS");if(f)puts(d);return f?1:0;}
