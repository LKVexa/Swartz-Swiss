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
static int pa(E*c,C id,char*o,B n,int t){const char*s=id<2?"ctl":id<4?"img":"obj";unsigned k=id<2?id:id<4?id-2:id-BR_STORAGE_OBJECT0;if(!c||!c->L[0]||id>=BR_STORAGE_OBJECTS)return F;return I(o,n,"%s.%s.%u%s",c->L,s,k,t?".tmp":"")>=(int)n?BR_EBOUNDS:0;}
static FILE*fo(const char*p,const char*m,int w){
#ifndef _WIN32
int d=open(p,w?O_WRONLY|O_CREAT|O_TRUNC|O_NOFOLLOW:O_RDONLY,0600);return d<0?0:fdopen(d,m);
#else
return fopen(p,m);
#endif
}
static int sr(void*x,C id,A*o,B c,B*n){E*q=x;char p[256];FILE*f;long z;if(pa(q,id,p,256,0)||!o||!n)return F;f=fo(p,"rb",0);if(!f)return G;if(fseek(f,0,2)||(z=ftell(f))<0||(B)z>c||fseek(f,0,0)){J(f);return BR_EBOUNDS;}*n=fread(o,1,z,f);return J(f)||*n!=(B)z?H:0;}
#ifndef _WIN32
static int ds(const char*p){char d[256],*s;int f;if(strlen(p)>=256)return BR_EBOUNDS;strcpy(d,p);s=strrchr(d,'/');if(s)*s=0;else strcpy(d,".");f=open(d,O_RDONLY);if(f<0)return G;if(fsync(f)){close(f);return H;}return close(f)?H:0;}
static int sy(FILE*f){return fsync(fileno(f));}
#else
static int ds(const char*p){(void)p;return 0;}static int sy(FILE*f){(void)f;return 0;}
#endif
static int sw(void*x,C id,const A*i,B n){E*c=x;char p[256];FILE*f;if(pa(c,id,p,256,1)||(!i&&n))return F;f=fo(p,"wb",1);if(!f)return G;if(fwrite(i,1,n,f)!=n||fflush(f)||(c->K&&sy(f))){J(f);remove(p);return H;}return J(f)?H:0;}
static int sc(void*x,C id){E*c=x;char a[256],b[256];if(pa(c,id,a,256,1)||pa(c,id,b,256,0))return F;if(!c->K)(void)remove(b);if(rename(a,b))return G;return c->K?ds(b):0;}
static int se(void*x,C id){E*c=x;char p[256];return pa(c,id,p,256,0)?F:remove(p)?G:0;}
static int mr(void*x,D*v){E*c=x;char p[256];FILE*f;if(!c||!v||I(p,256,"%s.mono",c->L)>=256)return F;f=fo(p,"rb",0);if(!f){*v=0;return 0;}return fread(v,1,8,f)!=8||J(f)?H:0;}
static int mc(void*x,D v){E*c=x;char p[256],t[260];FILE*f;if(!c||I(p,256,"%s.mono",c->L)>=256||I(t,260,"%s.tmp",p)>=260)return F;f=fo(c->K?t:p,"wb",1);if(!f)return G;if(fwrite(&v,1,8,f)!=8||fflush(f)||(c->K&&sy(f))){J(f);return H;}if(J(f))return H;if(c->K&&(rename(t,p)||ds(p)))return G;return 0;}
static int vs(void*x,const A*k,B kn,const A*m,B mn,const A*s,B sn){EVP_PKEY*p;EVP_MD_CTX*c;int r=0;(void)x;if(!k||kn!=32||!m||!s||sn!=64)return F;p=EVP_PKEY_new_raw_public_key(EVP_PKEY_ED25519,0,k,kn);c=EVP_MD_CTX_new();if(p&&c&&EVP_DigestVerifyInit(c,0,0,0,p)==1)r=EVP_DigestVerify(c,s,sn,m,mn)==1;EVP_MD_CTX_free(c);EVP_PKEY_free(p);return r?0:BR_ESIGNATURE;}
static int rb(void*x,A*o,B n){(void)x;return(!o&&n)?F:RAND_bytes(o,(int)n)==1?0:H;}static int cr(void*x,D*v){struct timespec t;(void)x;if(!v||timespec_get(&t,TIME_UTC)!=TIME_UTC)return H;*v=(D)t.tv_sec*1000000000ull+t.tv_nsec;return 0;}static int ci(void*x,A*o,B c,B*n){(void)x;if(!o||!n)return F;*n=fread(o,1,c,stdin);return ferror(stdin)?H:0;}static int co(void*x,const A*i,B n){(void)x;return(!i&&n)||fwrite(i,1,n,stdout)!=n||fflush(stdout)?H:0;}static int dc(void*x,C id,const A*i,B n,A*o,B c,B*u){E*q=x;B z=n;if(!q||!o||!u||c<4)return F;if(z+4>c)z=c-4;memcpy(o,&id,4);if(z&&i)memcpy(o+4,i,z);*u=z+4;q->dc_s++;return 0;}static void pn(void*x,int e){E*c=x;if(c)c->panic_code=e;}static int yi(void*x){return x?0:F;}static int lk(void*x){E*c=x;if(!c||c->locked)return BR_ESTATE;
#ifndef _WIN32
{char p[224];if(I(p,sizeof p,"%s.lock",c->L)>=(int)sizeof p||(c->lockfd=open(p,O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW,0600))<0)return BR_ESTATE;}
#endif
c->locked=1;return 0;}static int ul(void*x){E*c=x;if(!c||!c->locked)return BR_ESTATE;
#ifndef _WIN32
{char p[224];I(p,sizeof p,"%s.lock",c->L);close(c->lockfd);if(unlink(p))return H;}
#endif
c->locked=0;return 0;}
#define _H {sr,sw,sc,se,mr,mc,vs,rb,cr,ci,co,dc,pn,yi,lk,ul}
const br_hal br_hal_posix=_H,br_hal_windows=_H;static int fi(E*c,const char*p,int d){if(!c||!p||strlen(p)>=sizeof(c->L)||strstr(p,".."))return F;memset(c,0,sizeof(*c));strcpy(c->L,p);c->K=d;return 0;}int br_posix_adapter_init(br_posix_ctx*c,const char*p){return fi(c,p,1);}int br_windows_adapter_init(br_windows_ctx*c,const char*p){return fi(c,p,0);}
