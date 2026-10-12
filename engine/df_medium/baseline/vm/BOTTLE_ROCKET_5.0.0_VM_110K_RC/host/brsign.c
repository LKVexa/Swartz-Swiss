#include "brsign.h"
#include "brtrust.h"
#include "br_host.h"
#include <stdlib.h>
#include <string.h>
#include <openssl/evp.h>
static uint16_t g16(const uint8_t*p){return(uint16_t)(p[0]|((uint16_t)p[1]<<8));}
static uint32_t g32(const uint8_t*p){return(uint32_t)p[0]|((uint32_t)p[1]<<8)|((uint32_t)p[2]<<16)|((uint32_t)p[3]<<24);}
static uint64_t g64(const uint8_t*p){uint64_t v=0;unsigned i;for(i=0;i<8;i++)v|=(uint64_t)p[i]<<(8u*i);return v;}
static void p16(uint8_t*p,uint16_t v){p[0]=(uint8_t)v;p[1]=(uint8_t)(v>>8);}
static void p32(uint8_t*p,uint32_t v){p[0]=(uint8_t)v;p[1]=(uint8_t)(v>>8);p[2]=(uint8_t)(v>>16);p[3]=(uint8_t)(v>>24);}
static void p64(uint8_t*p,uint64_t v){unsigned i;for(i=0;i<8;i++)p[i]=(uint8_t)(v>>(8u*i));}
static int h256(const void*d,size_t n,uint8_t h[32]){EVP_MD_CTX*c=EVP_MD_CTX_new();unsigned z=0;int ok=c&&EVP_DigestInit_ex(c,EVP_sha256(),NULL)==1&&EVP_DigestUpdate(c,d,n)==1&&EVP_DigestFinal_ex(c,h,&z)==1&&z==32;EVP_MD_CTX_free(c);return ok?0:-1;}
static uint64_t kid(const uint8_t k[32]){uint8_t h[32];return h256(k,32,h)?0:g64(h);}
static int esign(const uint8_t priv[32],const uint8_t*m,size_t n,uint8_t s[64]){EVP_PKEY*k=EVP_PKEY_new_raw_private_key(EVP_PKEY_ED25519,NULL,priv,32);EVP_MD_CTX*c=EVP_MD_CTX_new();size_t z=64;int ok=k&&c&&EVP_DigestSignInit(c,NULL,NULL,NULL,k)==1&&EVP_DigestSign(c,s,&z,m,n)==1&&z==64;EVP_MD_CTX_free(c);EVP_PKEY_free(k);return ok?0:-1;}
static void imsg(uint8_t m[80],const uint8_t*t){memset(m,0,80);memcpy(m,"BR440:ISSUER:v1",15);p32(m+16,t[5]);memcpy(m+20,t+36,8);memcpy(m+28,t+44,8);memcpy(m+36,t+8,4);memcpy(m+40,t+156,32);}
static void rmsg(uint8_t m[80],const uint8_t*t){memset(m,0,80);memcpy(m,"BR440:RELEASE:v1",16);p32(m+16,t[5]);memcpy(m+20,t+44,8);memcpy(m+28,t+52,8);memcpy(m+36,t+8,4);memcpy(m+40,t+188,32);}
static void xmsg(uint8_t m[240],const uint8_t*t){memset(m,0,240);memcpy(m,"BR440:IMAGE:v1",14);memcpy(m+16,t,BR_TRUST_BODY_BYTES);}
static void cmsg(uint8_t m[80],const uint8_t*c){memset(m,0,80);memcpy(m,"BR440:CONTROL:v1",16);memcpy(m+16,c,BR_TRUST_CONTROL_BODY);}
int br_host_secure_bundle(const uint8_t*im,size_t n,uint8_t**out,size_t*on,const uint8_t*root_priv,const uint8_t*issuer_priv,const uint8_t*release_priv,uint32_t epoch,uint32_t gen,uint32_t tx,uint64_t expiry,uint16_t flags){uint8_t *b,*t,root[32],issuer[32],release[32],h[32],m1[80],m2[80],m3[240];uint16_t cc,dl;uint32_t ext;size_t poff;if(!im||!out||!on||!root_priv||!issuer_priv||!release_priv||n<K11||n>N20||!epoch||!gen||!tx||(flags&~N53)||memcmp(im,"BRIM",4)||(im[7]&N49))return K20;cc=g16(im+28);dl=g16(im+30);ext=g32(im+24);if(K11+(size_t)cc*K22+dl+ext!=n||ext!=N36)return K1;poff=K11+(size_t)cc*K22+dl;if(memcmp(im+poff,"BRPV",4))return K1;if(br_host_ed25519_public(root_priv,32,root)!=K0||br_host_ed25519_public(issuer_priv,32,issuer)!=K0||br_host_ed25519_public(release_priv,32,release)!=K0)return K23;b=calloc(n+N65,1);if(!b)return N14;memcpy(b,im,n);t=b+n;memcpy(t,"BRTM",4);t[4]=1;t[5]=N61;p16(t+6,flags);p32(t+8,epoch);p32(t+12,gen);p32(t+16,tx);p32(t+20,g32(im+16));p32(t+24,g32(im+20));p64(t+28,expiry);p64(t+36,kid(root));p64(t+44,kid(issuer));p64(t+52,kid(release));memcpy(t+60,im+poff+24,32);memcpy(t+92,im+poff+56,32);if(h256(im,n,h)){free(b);return K5;}memcpy(t+124,h,32);memcpy(t+156,issuer,32);memcpy(t+188,release,32);imsg(m1,t);rmsg(m2,t);xmsg(m3,t);if(esign(root_priv,m1,sizeof(m1),t+224)||esign(issuer_priv,m2,sizeof(m2),t+288)||esign(release_priv,m3,sizeof(m3),t+352)){free(b);return K23;}*out=b;*on=n+N65;return K0;}
int br_host_trust_control(uint8_t out[128],uint8_t action,uint32_t tx,uint32_t epoch,uint64_t issuer_id,uint32_t image_version,const uint8_t*priv,int recovery){uint8_t m[80];if(!out||!priv||!tx)return K20;if(action!=N62&&action!=N33&&action!=N38&&action!=N24)return K20;if(recovery!=(action==N24))return K20;memset(out,0,128);memcpy(out,"BRCT",4);out[4]=1;out[5]=action;p32(out+8,tx);p32(out+12,epoch);p64(out+16,issuer_id);p32(out+24,image_version);p32(out+28,N61);cmsg(m,out);return esign(priv,m,sizeof(m),out+64)?K23:K0;}
