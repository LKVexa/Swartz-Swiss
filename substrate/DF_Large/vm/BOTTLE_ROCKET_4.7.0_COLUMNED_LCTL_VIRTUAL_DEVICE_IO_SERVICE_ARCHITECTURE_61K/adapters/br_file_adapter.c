#define _POSIX_C_SOURCE 200809L
#include "br_adapters.h"
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <stdio.h>
#include <string.h>
#include <time.h>
#ifndef _WIN32
#include <fcntl.h>
#include <unistd.h>
#endif
#define U_ unsigned
#define S_ static
#define C_ const
#define V_ void
#define I_ int
#define R_ return
#define A uint8_t
#define B size_t
#define C uint32_t
#define D uint64_t
#define E br_file_ctx
#define F BR_EINVAL
#define G BR_ESTORAGE
#define H BR_EIO
#define I snprintf
#define J fclose
#define K durable
#define L prefix
S_ I_ pa(E*c,C id,char*o,B n,I_ t){C_ char*s=id<2?"ctl":id<4?"img":"obj";U_ k=id<2?id:id<4?id-2:id-BR_STORAGE_OBJECT0;if(!c||!c->L[0]||id>=BR_STORAGE_OBJECTS)R_ F;R_ I(o,n,"%s.%s.%u%s",c->L,s,k,t?".tmp":"")>=(I_)n?BR_EBOUNDS:0;}
S_ FILE*fo(C_ char*p,C_ char*m,I_ w){
#ifndef _WIN32
I_ d=open(p,w?O_WRONLY|O_CREAT|O_TRUNC|O_NOFOLLOW:O_RDONLY,0600);R_ d<0?0:fdopen(d,m);
#else
R_ fopen(p,m);
#endif
}
S_ I_ sr(V_*x,C id,A*o,B c,B*n){E*q=x;char p[256];FILE*f;long z;if(pa(q,id,p,256,0)||!o||!n)R_ F;f=fo(p,"rb",0);if(!f)R_ G;if(fseek(f,0,2)||(z=ftell(f))<0||(B)z>c||fseek(f,0,0)){J(f);R_ BR_EBOUNDS;}*n=fread(o,1,z,f);R_ J(f)||*n!=(B)z?H:0;}
#ifndef _WIN32
S_ I_ ds(C_ char*p){char d[256],*s;I_ f;if(strlen(p)>=256)R_ BR_EBOUNDS;strcpy(d,p);s=strrchr(d,'/');if(s)*s=0;else strcpy(d,".");f=open(d,O_RDONLY);if(f<0)R_ G;if(fsync(f)){close(f);R_ H;}R_ close(f)?H:0;}
S_ I_ sy(FILE*f){R_ fsync(fileno(f));}
#else
S_ I_ ds(C_ char*p){(V_)p;R_ 0;}S_ I_ sy(FILE*f){(V_)f;R_ 0;}
#endif
S_ I_ sw(V_*x,C id,C_ A*i,B n){E*c=x;char p[256];FILE*f;if(pa(c,id,p,256,1)||(!i&&n))R_ F;f=fo(p,"wb",1);if(!f)R_ G;if(fwrite(i,1,n,f)!=n||fflush(f)||(c->K&&sy(f))){J(f);remove(p);R_ H;}R_ J(f)?H:0;}
S_ I_ sc(V_*x,C id){E*c=x;char a[256],b[256];if(pa(c,id,a,256,1)||pa(c,id,b,256,0))R_ F;if(!c->K)(V_)remove(b);if(rename(a,b))R_ G;R_ c->K?ds(b):0;}
S_ I_ se(V_*x,C id){E*c=x;char p[256];R_ pa(c,id,p,256,0)?F:remove(p)?G:0;}
S_ I_ mr(V_*x,D*v){E*c=x;char p[256];FILE*f;if(!c||!v||I(p,256,"%s.mono",c->L)>=256)R_ F;f=fo(p,"rb",0);if(!f){*v=0;R_ 0;}R_ fread(v,1,8,f)!=8||J(f)?H:0;}
S_ I_ mc(V_*x,D v){E*c=x;char p[256],t[260];FILE*f;if(!c||I(p,256,"%s.mono",c->L)>=256||I(t,260,"%s.tmp",p)>=260)R_ F;f=fo(c->K?t:p,"wb",1);if(!f)R_ G;if(fwrite(&v,1,8,f)!=8||fflush(f)||(c->K&&sy(f))){J(f);R_ H;}if(J(f))R_ H;if(c->K&&(rename(t,p)||ds(p)))R_ G;R_ 0;}
S_ I_ vs(V_*x,C_ A*k,B kn,C_ A*m,B mn,C_ A*s,B sn){EVP_PKEY*p;EVP_MD_CTX*c;I_ r=0;(V_)x;if(!k||kn!=32||!m||!s||sn!=64)R_ F;p=EVP_PKEY_new_raw_public_key(EVP_PKEY_ED25519,0,k,kn);c=EVP_MD_CTX_new();if(p&&c&&EVP_DigestVerifyInit(c,0,0,0,p)==1)r=EVP_DigestVerify(c,s,sn,m,mn)==1;EVP_MD_CTX_free(c);EVP_PKEY_free(p);R_ r?0:BR_ESIGNATURE;}
S_ I_ rb(V_*x,A*o,B n){(V_)x;R_(!o&&n)?F:RAND_bytes(o,(I_)n)==1?0:H;}S_ I_ cr(V_*x,D*v){struct timespec t;(V_)x;if(!v)R_ H;
#ifndef _WIN32
if(clock_gettime(CLOCK_MONOTONIC,&t))R_ H;
#else
if(timespec_get(&t,TIME_UTC)!=TIME_UTC)R_ H;
#endif
*v=(D)t.tv_sec*1000000000ull+t.tv_nsec;R_ 0;}S_ I_ ci(V_*x,A*o,B c,B*n){(V_)x;if(!o||!n)R_ F;*n=fread(o,1,c,stdin);R_ ferror(stdin)?H:0;}S_ I_ co(V_*x,C_ A*i,B n){(V_)x;R_(!i&&n)||fwrite(i,1,n,stdout)!=n||fflush(stdout)?H:0;}S_ I_ dc(V_*x,C id,C_ A*i,B n,A*o,B c,B*u){E*q=x;B z=n;if(!q||!o||!u)R_ F;if(id==BR_DEVICE_WALL_CLOCK&&i&&n&&i[0]==1&&c>=8){D t=(D)time(0);memcpy(o,&t,8);*u=8;q->dc_s++;R_ 0;}if(c<4)R_ F;if(z+4>c)z=c-4;memcpy(o,&id,4);if(z&&i)memcpy(o+4,i,z);*u=z+4;q->dc_s++;R_ 0;}S_ V_ pn(V_*x,I_ e){E*c=x;if(c)c->panic_code=e;}S_ I_ yi(V_*x){R_ x?0:F;}S_ I_ lk(V_*x){E*c=x;if(!c||c->locked)R_ BR_ESTATE;
#ifndef _WIN32
{char p[224];if(I(p,sizeof p,"%s.lock",c->L)>=(I_)sizeof p||(c->lockfd=open(p,O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW,0600))<0)R_ BR_ESTATE;}
#endif
c->locked=1;R_ 0;}S_ I_ ul(V_*x){E*c=x;if(!c||!c->locked)R_ BR_ESTATE;
#ifndef _WIN32
{char p[224];I(p,sizeof p,"%s.lock",c->L);close(c->lockfd);if(unlink(p))R_ H;}
#endif
c->locked=0;R_ 0;}
#define _H {sr,sw,sc,se,mr,mc,vs,rb,cr,ci,co,dc,pn,yi,lk,ul}
C_ br_hal br_hal_posix=_H,br_hal_windows=_H;S_ I_ fi(E*c,C_ char*p,I_ d){if(!c||!p||strlen(p)>=sizeof(c->L)||strstr(p,".."))R_ F;memset(c,0,sizeof(*c));strcpy(c->L,p);c->K=d;R_ 0;}I_ br_posix_adapter_init(br_posix_ctx*c,C_ char*p){R_ fi(c,p,1);}I_ br_windows_adapter_init(br_windows_ctx*c,C_ char*p){R_ fi(c,p,0);}
