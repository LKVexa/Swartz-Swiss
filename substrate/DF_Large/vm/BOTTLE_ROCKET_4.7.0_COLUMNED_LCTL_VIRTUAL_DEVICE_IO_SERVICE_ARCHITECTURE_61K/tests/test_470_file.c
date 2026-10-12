#include "brvm.h"
#include "br_adapters.h"
#include <stdio.h>
#include <string.h>
int main(void){br_vm v;br_posix_ctx c;br_device d={BR_DEVICE_WALL_CLOCK,BR_CAP_SERVICE};br_vm_config q={64,16,32,BR_CAP_ALL,&d,1};br_insn x[]={{BR_SVC,BR_WRAP,2,0,1,1,(uint16_t)((8u<<8)|1u),BR_SVC_DEVICE_CALL},{BR_HALT,BR_WRAP,0,0,0,0,0,0}};int ok=br_posix_adapter_init(&c,"/tmp/br470_wall") == 0&&br_vm_create(&v,&br_hal_posix,&c)==0&&br_vm_initialize(&v)==0&&br_vm_configure(&v,&q)==0;v.caps[1]=BR_CAP_SERVICE;br_vm_reg(&v,0)[0]=0;br_vm_reg(&v,1)[0]=0;if(ok)ok=br_vm_load_code(&v,x,2)==0&&br_vm_run(&v,8)==0&&br_vm_reg(&v,2)[0]==8&&*(uint64_t*)v.memory>0;br_vm_destroy(&v);printf("%s posix_optional_wall_clock_extension\n{\"suite\":\"BR-470-FILE\",\"tests\":1,\"failures\":%d,\"result\":\"%s\"}\n",ok?"PASS":"FAIL",ok?0:1,ok?"PASS":"FAIL");return ok?0:1;}
