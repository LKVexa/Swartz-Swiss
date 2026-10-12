#define _POSIX_C_SOURCE 200809L
#include "brvm.h"
#include "brlctlc.h"
#include "br_host.h"
#include "brtrust.h"
#include "brsign.h"
#include <errno.h>
#include <fcntl.h>
#include <openssl/crypto.h>
#include <openssl/rand.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
static int load_file(const char*path,uint8_t**data,size_t*length){
FILE*fp=fopen(path,"rb");
long size;
if(fp==NULL||fseek(fp,0,SEEK_END)!=0||(size=ftell(fp))<=0||
fseek(fp,0,SEEK_SET)!=0){
if(fp!=NULL)fclose(fp);
return-1;
}
*data=malloc((size_t)size);
if(*data==NULL){fclose(fp);return-1;}
*length=fread(*data,1,(size_t)size,fp);
if(fclose(fp)!=0||*length!=(size_t)size){
free(*data);*data=NULL;return-1;
}
return 0;
}
static int save_file(const char*path,const uint8_t*data,size_t length,
unsigned mode){
int fd;
ssize_t written;
if(path==NULL||data==NULL||length==0)return-1;
fd=open(path,O_WRONLY|O_CREAT|O_TRUNC,(mode_t)mode);
if(fd<0)return-1;
written=write(fd,data,length);
if(written!=(ssize_t)length||fsync(fd)!=0){
(void)close(fd);return-1;
}
return close(fd)==0?0:-1;
}
static int run_image(const char*image_path,const char*public_key_path,
int execute){
br_vm vm;br_memory_adapter adapter;br_hal hal;
uint8_t*image=NULL,*public_key=NULL;
size_t image_length=0,key_length=0;
int rc;
if(load_file(image_path,&image,&image_length)!=0||
(public_key_path!=NULL&&
load_file(public_key_path,&public_key,&key_length)!=0)||
br_vm_init(&vm)!=0||
br_deterministic_adapter_init(&adapter,&hal,N46,1)!=K0||
br_vm_bind_hal(&vm,&hal)!=K0){
fputs("Unable to initialize runtime or read input.\n",stderr);
free(image);free(public_key);return 1;
}
rc=br_image_load(&vm,image,image_length,public_key,key_length,
public_key_path!=NULL);
if(rc==0&&execute)rc=br_vm_run(&vm,4096);
printf("status=%u trap=%u ip=%u image_version=%u%s\n",
vm.status,vm.trap,vm.ip,vm.image_version,
rc==0?" result=PASS":" result=FAIL");
if(execute&&rc==0)
printf("R2.low64=%llu\n",(unsigned long long)br_vm_reg_u64(&vm,2));
br_vm_free(&vm);free(image);free(public_key);
return rc==0?0:1;
}
static int keygen(const char*private_path,const char*public_path){
uint8_t private_key[32],public_key[32];
int rc=1;
if(RAND_bytes(private_key,sizeof(private_key))==1&&
br_host_ed25519_public(private_key,sizeof(private_key),public_key)==K0&&
save_file(private_path,private_key,sizeof(private_key),0600)==0&&
save_file(public_path,public_key,sizeof(public_key),0644)==0)rc=0;
if(rc!=0)(void)unlink(private_path);
OPENSSL_cleanse(private_key,sizeof(private_key));
OPENSSL_cleanse(public_key,sizeof(public_key));
printf("Ed25519 host-evaluation key generation: %s\n",rc?"FAIL":"PASS");
return rc;
}
static int sign_image(const char*input_path,const char*output_path,
const char*private_path){
uint8_t*image=NULL,*private_key=NULL,*grown;
size_t image_length=0,key_length=0;
int rc=1;
if(load_file(input_path,&image,&image_length)!=0||
load_file(private_path,&private_key,&key_length)!=0)goto done;
grown=realloc(image,image_length+64u);
if(grown==NULL)goto done;
image=grown;
if(br_host_image_sign(image,&image_length,image_length+64u,
private_key,key_length)==K0&&
save_file(output_path,image,image_length,0644)==0)rc=0;
done:
if(private_key!=NULL)OPENSSL_cleanse(private_key,key_length);
free(private_key);free(image);
printf("BOTTLE ROCKET signed image: %s\n",rc?"FAIL":"PASS");
return rc;
}
static int secure_sign(const char*input,const char*output,const char*rp,const char*ip,const char*lp,uint32_t epoch,uint32_t gen,uint32_t tx,uint64_t expiry,uint16_t flags){uint8_t*im=NULL,*r=NULL,*i=NULL,*l=NULL,*b=NULL;size_t n=0,rn=0,in=0,ln=0,bn=0;int rc=1;if(load_file(input,&im,&n)||load_file(rp,&r,&rn)||load_file(ip,&i,&in)||load_file(lp,&l,&ln)||rn!=32||in!=32||ln!=32)goto done;if(br_host_secure_bundle(im,n,&b,&bn,r,i,l,epoch,gen,tx,expiry,flags)==K0&&save_file(output,b,bn,0644)==0)rc=0;done:if(r)OPENSSL_cleanse(r,rn);if(i)OPENSSL_cleanse(i,in);if(l)OPENSSL_cleanse(l,ln);free(im);free(r);free(i);free(l);free(b);printf("BOTTLE ROCKET secure trust bundle: %s\n",rc?"FAIL":"PASS");return rc;}
static int control_sign(const char*outp,const char*action_s,uint32_t tx,uint32_t epoch,uint64_t issuer,uint32_t iv,const char*kp){uint8_t*k=NULL,c[128];size_t n=0;uint8_t a=0;int recovery=0,rc=1;if(!strcmp(action_s,"rotate"))a=N62;else if(!strcmp(action_s,"revoke-issuer"))a=N33;else if(!strcmp(action_s,"revoke-image"))a=N38;else if(!strcmp(action_s,"recovery")){a=N24;recovery=1;}else return 2;if(load_file(kp,&k,&n)||n!=32)goto done;if(br_host_trust_control(c,a,tx,epoch,issuer,iv,k,recovery)==K0&&save_file(outp,c,sizeof(c),0644)==0)rc=0;done:if(k)OPENSSL_cleanse(k,n);free(k);printf("BOTTLE ROCKET trust control: %s\n",rc?"FAIL":"PASS");return rc;}
static int update_image(const char*image_path,const char*public_path,
const char*state){
br_vm vm;br_posix_adapter adapter;br_hal hal;
uint8_t*image=NULL,*public_key=NULL,*request=NULL;
uint8_t response[16];
size_t image_length=0,key_length=0,response_length,off=0,chunk;
uint16_t seq=0;
int rc=1;
if(load_file(image_path,&image,&image_length)!=0||
load_file(public_path,&public_key,&key_length)!=0||
image_length>N20||br_vm_init(&vm)!=0)goto done;
request=calloc(12u+N48,1);
if(request==NULL||br_posix_adapter_init(&adapter,&hal,state,N46)!=K0||
br_vm_bind_hal(&vm,&hal)!=K0||
br_vm_set_issuer_key(&vm,public_key,key_length)!=0)
goto free_vm;
if(hal.storage_erase(hal.ctx,BR_STORE_ISSUER)!=K0||hal.storage_write(hal.ctx,BR_STORE_ISSUER,0,public_key,key_length)!=K0||hal.storage_flush(hal.ctx,BR_STORE_ISSUER)!=K0)goto free_vm;
if(br_vm_recover(&vm)!=K0)br_vm_reset(&vm,1);
while(off<image_length){
chunk=image_length-off;
if(chunk>N48-(seq==0?4u:0u))chunk=N48-(seq==0?4u:0u);
memset(request,0,12);request[0]=1;request[1]=BR_APDU_UPDATE;
request[2]=(off+chunk<image_length)?1:0;
request[4]=(uint8_t)(vm.last_txid+1u);request[5]=(uint8_t)((vm.last_txid+1u)>>8);
request[6]=(uint8_t)((vm.last_txid+1u)>>16);request[7]=(uint8_t)((vm.last_txid+1u)>>24);
request[8]=(uint8_t)seq;request[9]=(uint8_t)(seq>>8);
request[10]=(uint8_t)(chunk+(seq==0?4u:0u));request[11]=(uint8_t)((chunk+(seq==0?4u:0u))>>8);
if(seq==0){request[12]=(uint8_t)image_length;request[13]=(uint8_t)(image_length>>8);
request[14]=(uint8_t)(image_length>>16);request[15]=(uint8_t)(image_length>>24);}
memcpy(request+12+(seq==0?4u:0u),image+off,chunk);
response_length=br_apdu(&vm,request,12u+chunk+(seq==0?4u:0u),response,sizeof(response));
if(response_length!=8||response[0]!=(off+chunk<image_length?0x61:0x90)||response[1]!=0)goto free_vm;
off+=chunk;++seq;
}
if(br_vm_run(&vm,4096)==0)rc=0;
free_vm:
br_vm_free(&vm);
done:
free(request);free(public_key);free(image);
printf("BOTTLE ROCKET authorized APDU update: %s\n",rc?"FAIL":"PASS");
return rc;
}
static int inspect_image(const char*path){
uint8_t*p=NULL;size_t n=0,i;uint32_t v,caps;uint16_t code,data;int sig,rc=1;
if(load_file(path,&p,&n)==0&&br_image_inspect(p,n,&v,&code,&data,&caps,&sig)==0){
printf("{\"version\":%u,\"flags\":%u,\"code\":%u,\"data\":%u,\"caps\":%u,\"signed\":%s,\"bytes\":%zu,\"digest\":\"",
v,p[7],code,data,caps,sig?"true":"false",n);
for(i=32;i<64;++i)printf("%02x",p[i]);
puts("\"}");rc=0;
}free(p);return rc;
}
static int state_command(const char*prefix,const char*public_path,int recover){
br_vm vm;br_posix_adapter adapter;br_hal hal;uint8_t*key=NULL;size_t n=0;int rc=1;
if(br_vm_init(&vm)!=K0||br_posix_adapter_init(&adapter,&hal,prefix,N46)!=K0||
br_vm_bind_hal(&vm,&hal)!=K0)return 1;
if(public_path&&(load_file(public_path,&key,&n)!=0||br_vm_set_issuer_key(&vm,key,n)!=0))goto done;
if((recover?br_vm_recover(&vm):br_vm_save(&vm))==K0){
printf("status=%u trap=%u image_version=%u generation=%u last_txid=%u slot=%u\n",
vm.status,vm.trap,vm.image_version,vm.persistent_generation,
vm.last_txid,vm.active_slot);rc=0;
}
done:free(key);br_vm_free(&vm);return rc;
}
static int hexval(int c){return c>='0'&&c<='9'?c-'0':c>='a'&&c<='f'?c-'a'+10:
c>='A'&&c<='F'?c-'A'+10:-1;}
static int parse32(const char*s,uint32_t*v){char*e;unsigned long long x;
errno=0;x=strtoull(s,&e,0);if(errno||!*s||*e||x>UINT32_MAX||x==0)return-1;
*v=(uint32_t)x;return 0;}
static int serve(const char*prefix,const char*public_path){
br_vm vm;br_posix_adapter adapter;br_hal hal;uint8_t*key=NULL,req[12+N48],rsp[8+N48];
size_t kn=0,cap=0,n,i,rn;char*line=NULL;ssize_t z;int a,b,rc=1;
if(br_vm_init(&vm)!=K0||br_posix_adapter_init(&adapter,&hal,prefix,N46)!=K0||br_vm_bind_hal(&vm,&hal)!=K0)return 1;
if(public_path&&(load_file(public_path,&key,&kn)||br_vm_set_issuer_key(&vm,key,kn)))goto done;
if(br_vm_recover(&vm)!=0)br_vm_reset(&vm,1);
puts("READY hex-APDU per line; EOF stops");fflush(stdout);
while((z=getline(&line,&cap,stdin))>=0){while(z&&strchr(" \t\r\n",line[z-1]))--z;
if((z&1)||z>(ssize_t)(sizeof(req)*2u)){puts("ERROR");fflush(stdout);continue;}n=(size_t)z/2u;
for(i=0;i<n;++i){a=hexval(line[2*i]);b=hexval(line[2*i+1]);if(a<0||b<0)break;req[i]=(uint8_t)((a<<4)|b);}
if(i!=n){puts("ERROR");fflush(stdout);continue;}rn=br_apdu(&vm,req,n,rsp,sizeof(rsp));
for(i=0;i<rn;++i)printf("%02x",rsp[i]);
putchar('\n');fflush(stdout);
if(rn>=2&&rsp[0]==0x90&&rsp[1]==0x00&&n>=2&&req[1]!=BR_APDU_STATUS&&
req[1]!=BR_APDU_STATE&&req[1]!=BR_APDU_DIAG&&req[1]!=BR_APDU_CAPS&&req[1]!=BR_APDU_HELLO)
(void)br_vm_save(&vm);
}rc=0;
done:free(line);free(key);br_vm_free(&vm);return rc;
}
int main(int argc,char**argv){
int rc;
if(argc==3&&strcmp(argv[1],"verify-lctlc")==0){
char diag[192]={0};rc=br_lctlc_verify_file(argv[2],diag,sizeof(diag));
printf("Columned LCTL semantic verify: %s%s%s\n",rc?"FAIL":"PASS",rc?" — ":"",rc?diag:"");return rc?1:0;
}
if(argc==4&&strcmp(argv[1],"lctl-to-brir")==0){
rc=br_lctlc_to_brir_file(argv[2],argv[3]);printf("LCTL -> BRIR: %s\n",rc?"FAIL":"PASS");return rc?1:0;
}
if((argc==4||argc==5||argc==6)&&strcmp(argv[1],"compile-lctlc")==0){
uint32_t v=0;
if((argc==5&&parse32(argv[4],&v))||(argc==6&&
(strcmp(argv[4],"--image-version")||parse32(argv[5],&v))))return 2;
rc=br_lctlc_compile_file(argv[2],argv[3],v);printf("Columned LCTL compile: %s\n",rc?"FAIL":"PASS");return rc?1:0;
}
if(argc==3&&(!strcmp(argv[1],"inspect")||!strcmp(argv[1],"inspect-image")))return inspect_image(argv[2]);
if(argc==3&&strcmp(argv[1],"run")==0){
return run_image(argv[2],NULL,1);
}
if(argc==4&&strcmp(argv[1],"keygen")==0)
return keygen(argv[2],argv[3]);
if(argc==5&&strcmp(argv[1],"sign-image")==0)
return sign_image(argv[2],argv[3],argv[4]);
if(argc==4&&strcmp(argv[1],"verify-image")==0)
return run_image(argv[2],argv[3],0);
if(argc==4&&strcmp(argv[1],"run-signed")==0)
return run_image(argv[2],argv[3],1);
if((argc==10||argc==11)&&strcmp(argv[1],"secure-sign")==0){uint32_t e,g,t;uint64_t x=0;uint16_t f=0;if(parse32(argv[7],&e)||parse32(argv[8],&g)||parse32(argv[9],&t))return 2;if(argc==11){char*z;unsigned long long q=strtoull(argv[10],&z,0);if(!z||*z)return 2;x=(uint64_t)q;}return secure_sign(argv[2],argv[3],argv[4],argv[5],argv[6],e,g,t,x,f);}
if(argc==9&&strcmp(argv[1],"trust-control")==0){uint32_t tx,e,iv;char*z;unsigned long long id;if(parse32(argv[4],&tx)||parse32(argv[5],&e)||parse32(argv[7],&iv))return 2;id=strtoull(argv[6],&z,0);if(!z||*z)return 2;return control_sign(argv[2],argv[3],tx,e,(uint64_t)id,iv,argv[8]);}
if(argc==5&&strcmp(argv[1],"update")==0)
return update_image(argv[2],argv[3],argv[4]);
if(argc==6&&!strcmp(argv[1],"update")&&!strcmp(argv[4],"--state"))
return update_image(argv[2],argv[3],argv[5]);
if(argc==3&&strcmp(argv[1],"save-state")==0)return state_command(argv[2],NULL,0);
if((argc==3||argc==4)&&strcmp(argv[1],"recover-state")==0)
return state_command(argv[2],argc==4?argv[3]:NULL,1);
if((argc==3||argc==4)&&strcmp(argv[1],"serve")==0)
return argc==4&&!strcmp(argv[2],"--state")?serve(argv[3],NULL):
serve(argv[2],argc==4?argv[3]:NULL);
if(argc==4&&!strcmp(argv[1],"status")&&!strcmp(argv[2],"--state"))
return state_command(argv[3],NULL,1);
if(argc==6&&!strcmp(argv[1],"serve")&&!strcmp(argv[2],"--state")&&
!strcmp(argv[4],"--issuer-public-key"))return serve(argv[3],argv[5]);
fprintf(stderr,
"Usage: %s verify-lctlc SRC | lctl-to-brir SRC BRIR | compile-lctlc SRC IMAGE [--image-version N] |\n"
"       inspect-image IMAGE | run IMAGE |\n"
"       keygen PRIVATE PUBLIC | sign-image INPUT OUTPUT PRIVATE |\n"
"       secure-sign INPUT OUTPUT ROOT_PRIV ISSUER_PRIV RELEASE_PRIV EPOCH GENERATION TXSEQ [EXPIRY] |\n"
"       trust-control OUTPUT rotate|revoke-issuer|revoke-image|recovery TX EPOCH ISSUER_ID IMAGE_VERSION PRIVATE |\n"
"       verify-image FILE PUBLIC | run-signed FILE PUBLIC |\n"
"       update SIGNED PUBLIC --state STATE | save-state STATE | recover-state STATE [PUBLIC] |\n"
"       status --state STATE | serve --state STATE [--issuer-public-key PUBLIC]\n",argv[0]);
return 2;
}
