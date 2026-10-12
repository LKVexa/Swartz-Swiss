#include "ja21_webengine.h"
#include <string.h>
#include <stdlib.h>

#define DOC_MAX (1024u*1024u)
#define CSS_MAX (512u*1024u)
#define SCENE_MAX 4096u
#define RESOURCE_MAX 1024u
#define STRING_POOL_MAX (4u*1024u*1024u)
#define RULE_MAX 512u
#define STACK_MAX 96u
#define BR_DWEB_TRANSPORT BR_DNET
static const char DFWEB_JA21_SOURCE_SHA256[]="d53a401457966113af9ce93e64b13d4a6f552e6a40a2e735fddc7956a8456614";

typedef struct Style {
    B32 fg,bg,flags;
    float font,mt,mb,ml,mr,pt,pb,pl,pr,width,height,radius;
    B8 display; /* 0 inline, 1 block, 2 flex, 3 none */
    B8 align;
} Style;

typedef struct Rule {
    char selector[96];
    Style style;
    B32 mask;
} Rule;

typedef struct Frame {
    char tag[24],id[64],classes[192];
    Style style;
    B32 href_id;
    float x,width,row_top,cursor_x,max_h;
    B8 flex;
} Frame;

typedef struct Engine {
    char base[DFWEB_MAX_URL];
    char title[DFWEB_MAX_TEXT];
    B32 viewport_w,viewport_h;
    B8 doc[DOC_MAX+1]; B32 doc_len;
    B8 css[CSS_MAX+1]; B32 css_len;
    B8 external_css[CSS_MAX+1]; B32 external_css_len;
    dfweb_scene_item scene[SCENE_MAX]; B32 scene_n;
    dfweb_resource_item resources[RESOURCE_MAX]; B32 resource_n;
    char strings[STRING_POOL_MAX]; B32 string_n;
    Rule rules[RULE_MAX]; B32 rule_n;
    B32 nodes,scripts,vm_calls;
} Engine;

static Engine E;
static br_vm V;
static br_hal H;
static B64 fake_clock=1;

static BZ c_len(const char*s){BZ n=0;if(!s)return 0;while(s[n])n++;return n;}
static int c_eq(const char*a,const char*b){BZ i=0;if(!a||!b)return 0;while(a[i]&&b[i]&&a[i]==b[i])i++;return a[i]==0&&b[i]==0;}
static int c_ieq(const char*a,const char*b){BZ i=0;char x,y;if(!a||!b)return 0;while(a[i]&&b[i]){x=a[i];y=b[i];if(x>='A'&&x<='Z')x=(char)(x+32);if(y>='A'&&y<='Z')y=(char)(y+32);if(x!=y)return 0;i++;}return a[i]==0&&b[i]==0;}
static int c_starts(const char*s,const char*p){BZ i=0;if(!s||!p)return 0;while(p[i]){if(s[i]!=p[i])return 0;i++;}return 1;}
static void c_copy(char*d,BZ cap,const char*s){BZ i=0;if(!d||!cap)return;if(s)while(s[i]&&i+1<cap){d[i]=s[i];i++;}d[i]=0;}
static void c_ncopy(char*d,BZ cap,const char*s,BZ n){BZ i=0;if(!d||!cap)return;while(i<n&&s&&s[i]&&i+1<cap){d[i]=s[i];i++;}d[i]=0;}
static char lowerc(char c){return c>='A'&&c<='Z'?(char)(c+32):c;}
static int isspacec(char c){return c==' '||c=='\n'||c=='\r'||c=='\t'||c=='\f';}
static int isname(char c){return (c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')||c=='-'||c=='_'||c==':'||c=='.';}
static B32 parse_uint(const char*s){B32 v=0;while(s&&*s>='0'&&*s<='9'){if(v>10000000u)return v;v=v*10u+(B32)(*s-'0');s++;}return v;}
static float parse_float_px(const char*s,float def){B32 v=parse_uint(s);if(v>4096u)v=4096u;return v?((float)v):def;}

static B32 pool_add_n(const char*s,BZ n){B32 id;if(!s||!n)return 0;if(n>DFWEB_MAX_URL*4u)n=DFWEB_MAX_URL*4u;if(E.string_n+n+1>=STRING_POOL_MAX)return 0;id=E.string_n+1;memcpy(E.strings+E.string_n,s,n);E.string_n+=(B32)n;E.strings[E.string_n++]=0;return id;}
static B32 pool_add(const char*s){return s?pool_add_n(s,c_len(s)):0;}
static const char* pool_ptr(B32 id){if(!id||id-1>=E.string_n)return "";return E.strings+id-1;}

static B32 hexv(char c){if(c>='0'&&c<='9')return(B32)(c-'0');c=lowerc(c);if(c>='a'&&c<='f')return(B32)(10+c-'a');return 16u;}
/* 8.0.3: HTML character-reference decoding (WHATWG subset). Attribute values and text were previously used raw, so href="...&amp;rut=..." reached the network literally (HTTP 400). */
static BZ utf8_put(char*o,BZ cap,BZ j,B32 cp){if(cp==0||cp>0x10FFFFu||(cp>=0xD800u&&cp<=0xDFFFu))cp=0xFFFDu;if(cp<0x80u){if(j+1<cap)o[j++]=(char)cp;}else if(cp<0x800u){if(j+2<cap){o[j++]=(char)(0xC0u|(cp>>6));o[j++]=(char)(0x80u|(cp&0x3Fu));}}else if(cp<0x10000u){if(j+3<cap){o[j++]=(char)(0xE0u|(cp>>12));o[j++]=(char)(0x80u|((cp>>6)&0x3Fu));o[j++]=(char)(0x80u|(cp&0x3Fu));}}else{if(j+4<cap){o[j++]=(char)(0xF0u|(cp>>18));o[j++]=(char)(0x80u|((cp>>12)&0x3Fu));o[j++]=(char)(0x80u|((cp>>6)&0x3Fu));o[j++]=(char)(0x80u|(cp&0x3Fu));}}return j;}
static BZ html_decode(char*o,BZ cap,const char*r,BZ n){static const struct{const char*k;B32 cp;}N[]={{"amp",'&'},{"lt",'<'},{"gt",'>'},{"quot",'"'},{"apos",'\''},{"nbsp",0xA0u},{"copy",0xA9u},{"reg",0xAEu},{"middot",0xB7u},{"ndash",0x2013u},{"mdash",0x2014u},{"hellip",0x2026u},{"rsquo",0x2019u},{"lsquo",0x2018u},{"rdquo",0x201Du},{"ldquo",0x201Cu},{"bull",0x2022u},{"trade",0x2122u},{"raquo",0xBBu},{"laquo",0xABu}};BZ i=0,j=0;if(!o||!cap)return 0;while(i<n&&r[i]&&j+1<cap){if(r[i]=='&'&&i+1<n){BZ k=i+1;B32 cp=0;int ok=0;if(r[k]=='#'){int hex=(k+1<n&&(r[k+1]=='x'||r[k+1]=='X'));BZ d=k+1+(BZ)hex,st=d;while(d<n&&d-st<8){B32 v=hex?hexv(r[d]):((r[d]>='0'&&r[d]<='9')?(B32)(r[d]-'0'):16u);if(v>=(hex?16u:10u))break;cp=cp*(hex?16u:10u)+v;d++;}if(d>st){ok=1;i=(d<n&&r[d]==';')?d+1:d;}}else{BZ t;for(t=0;t<sizeof(N)/sizeof(N[0]);t++){BZ ln=c_len(N[t].k);if(k+ln<=n&&!memcmp(r+k,N[t].k,ln)){int semi=(k+ln<n&&r[k+ln]==';');/* legacy no-semicolon form only for amp/lt/gt/quot, and not before '=' or alnum (attribute rule) */if(semi||(t<4&&!(k+ln<n&&(isname(r[k+ln])||r[k+ln]=='=')))){cp=N[t].cp;ok=1;i=k+ln+(BZ)semi;break;}}}}if(ok){j=utf8_put(o,cap,j,cp);continue;}}o[j++]=r[i++];}o[j]=0;return j;}
static B32 color_named(const char*s,B32 def){if(!s||!*s)return def;if(s[0]=='#'){BZ n=c_len(s);B32 r,g,b,a=255;if(n==4){r=hexv(s[1]);g=hexv(s[2]);b=hexv(s[3]);if(r<16&&g<16&&b<16)return 0xff000000u|(r*17u<<16)|(g*17u<<8)|(b*17u);}if(n==7||n==9){r=hexv(s[1])*16u+hexv(s[2]);g=hexv(s[3])*16u+hexv(s[4]);b=hexv(s[5])*16u+hexv(s[6]);if(n==9)a=hexv(s[7])*16u+hexv(s[8]);if(r<256&&g<256&&b<256&&a<256)return(a<<24)|(r<<16)|(g<<8)|b;}}
 if(c_ieq(s,"black"))return 0xff111827u;if(c_ieq(s,"white"))return 0xffffffffu;if(c_ieq(s,"red"))return 0xffd94a4au;if(c_ieq(s,"blue"))return 0xff376fbeu;if(c_ieq(s,"green"))return 0xff2f8d61u;if(c_ieq(s,"gray")||c_ieq(s,"grey"))return 0xff667085u;if(c_ieq(s,"transparent"))return 0u;return def;}

static Style style_default(void){Style s;memset(&s,0,sizeof(s));s.fg=0xff24364au;s.bg=0;s.font=15.0f;s.mb=8.0f;s.display=0;return s;}
#define M_FG 1u
#define M_BG 2u
#define M_FONT 4u
#define M_WEIGHT 8u
#define M_DISPLAY 16u
#define M_MARGIN 32u
#define M_PADDING 64u
#define M_WIDTH 128u
#define M_HEIGHT 256u
#define M_ALIGN 512u
#define M_RADIUS 1024u
#define M_ITALIC 2048u
#define M_DECOR 4096u

static void trim_copy(char*out,BZ cap,const char*a,const char*b){while(a<b&&isspacec(*a))a++;while(b>a&&isspacec(b[-1]))b--;c_ncopy(out,cap,a,(BZ)(b-a));}
static void style_apply_decl(Style*s,B32*mask,const char*k,const char*v){if(c_ieq(k,"color")){s->fg=color_named(v,s->fg);*mask|=M_FG;}else if(c_ieq(k,"background")||c_ieq(k,"background-color")){s->bg=color_named(v,s->bg);*mask|=M_BG;}else if(c_ieq(k,"font-size")){s->font=parse_float_px(v,s->font);*mask|=M_FONT;}else if(c_ieq(k,"font-weight")){if(c_ieq(v,"bold")||parse_uint(v)>=600)s->flags|=DFWEB_FLAG_BOLD;else s->flags&=~DFWEB_FLAG_BOLD;*mask|=M_WEIGHT;}else if(c_ieq(k,"font-style")){if(c_ieq(v,"italic"))s->flags|=DFWEB_FLAG_ITALIC;else s->flags&=~DFWEB_FLAG_ITALIC;*mask|=M_ITALIC;}else if(c_ieq(k,"text-decoration")){if(c_starts(v,"underline"))s->flags|=DFWEB_FLAG_UNDERLINE;else s->flags&=~DFWEB_FLAG_UNDERLINE;*mask|=M_DECOR;}else if(c_ieq(k,"display")){s->display=c_ieq(v,"none")?3:c_ieq(v,"flex")?2:c_ieq(v,"block")?1:0;*mask|=M_DISPLAY;}else if(c_ieq(k,"width")){s->width=parse_float_px(v,0);*mask|=M_WIDTH;}else if(c_ieq(k,"height")){s->height=parse_float_px(v,0);*mask|=M_HEIGHT;}else if(c_ieq(k,"border-radius")){s->radius=parse_float_px(v,0);*mask|=M_RADIUS;}else if(c_ieq(k,"text-align")){s->align=c_ieq(v,"center")?1:c_ieq(v,"right")?2:0;*mask|=M_ALIGN;}else if(c_ieq(k,"margin")||c_ieq(k,"margin-top")||c_ieq(k,"margin-bottom")||c_ieq(k,"margin-left")||c_ieq(k,"margin-right")){float q=parse_float_px(v,0);if(c_ieq(k,"margin")||c_ieq(k,"margin-top"))s->mt=q;if(c_ieq(k,"margin")||c_ieq(k,"margin-bottom"))s->mb=q;if(c_ieq(k,"margin")||c_ieq(k,"margin-left"))s->ml=q;if(c_ieq(k,"margin")||c_ieq(k,"margin-right"))s->mr=q;*mask|=M_MARGIN;}else if(c_ieq(k,"padding")||c_ieq(k,"padding-top")||c_ieq(k,"padding-bottom")||c_ieq(k,"padding-left")||c_ieq(k,"padding-right")){float q=parse_float_px(v,0);if(c_ieq(k,"padding")||c_ieq(k,"padding-top"))s->pt=q;if(c_ieq(k,"padding")||c_ieq(k,"padding-bottom"))s->pb=q;if(c_ieq(k,"padding")||c_ieq(k,"padding-left"))s->pl=q;if(c_ieq(k,"padding")||c_ieq(k,"padding-right"))s->pr=q;*mask|=M_PADDING;}}
static void parse_decls(const char*s,BZ n,Style*out,B32*mask){const char*p=s,*e=s+n,*c,*semi;char k[64],v[160];while(p<e){while(p<e&&(isspacec(*p)||*p==';'))p++;if(p>=e)break;c=p;while(p<e&&*p!=':'&&*p!=';')p++;if(p>=e||*p!=':'){while(p<e&&*p!=';')p++;continue;}trim_copy(k,sizeof(k),c,p);p++;c=p;semi=p;while(semi<e&&*semi!=';')semi++;trim_copy(v,sizeof(v),c,semi);style_apply_decl(out,mask,k,v);p=semi<e?semi+1:semi;}}
static int class_has(const char*classes,const char*q){BZ qn=c_len(q);const char*p=classes;while(p&&*p){while(*p&&isspacec(*p))p++;const char*a=p;while(*p&&!isspacec(*p))p++;if((BZ)(p-a)==qn&&!memcmp(a,q,qn))return 1;}return 0;}
static int selector_match(const char*sel,const char*tag,const char*id,const char*classes){if(!sel||!*sel)return 0;if(sel[0]=='#')return c_eq(sel+1,id);if(sel[0]=='.')return class_has(classes,sel+1);return c_ieq(sel,tag);}
static void style_merge(Style*d,const Style*s,B32 m){if(m&M_FG)d->fg=s->fg;if(m&M_BG)d->bg=s->bg;if(m&M_FONT)d->font=s->font;if(m&M_WEIGHT){d->flags=(d->flags&~DFWEB_FLAG_BOLD)|(s->flags&DFWEB_FLAG_BOLD);}if(m&M_ITALIC)d->flags=(d->flags&~DFWEB_FLAG_ITALIC)|(s->flags&DFWEB_FLAG_ITALIC);if(m&M_DECOR)d->flags=(d->flags&~DFWEB_FLAG_UNDERLINE)|(s->flags&DFWEB_FLAG_UNDERLINE);if(m&M_DISPLAY)d->display=s->display;if(m&M_MARGIN){d->mt=s->mt;d->mb=s->mb;d->ml=s->ml;d->mr=s->mr;}if(m&M_PADDING){d->pt=s->pt;d->pb=s->pb;d->pl=s->pl;d->pr=s->pr;}if(m&M_WIDTH)d->width=s->width;if(m&M_HEIGHT)d->height=s->height;if(m&M_ALIGN)d->align=s->align;if(m&M_RADIUS)d->radius=s->radius;}

static void css_parse_all(void){const char*p=(const char*)E.css,*e=p+E.css_len;E.rule_n=0;while(p<e&&E.rule_n<RULE_MAX){while(p<e&&(isspacec(*p)||*p==';'))p++;if(p+1<e&&p[0]=='/'&&p[1]=='*'){p+=2;while(p+1<e&&!(p[0]=='*'&&p[1]=='/'))p++;if(p+1<e)p+=2;continue;}const char*sb=p;while(p<e&&*p!='{')p++;if(p>=e)break;char selector[96];trim_copy(selector,sizeof(selector),sb,p);p++;const char*db=p;while(p<e&&*p!='}')p++;if(*selector&&p<=e){Rule*r=&E.rules[E.rule_n];memset(r,0,sizeof(*r));c_copy(r->selector,sizeof(r->selector),selector);r->style=style_default();r->mask=0;parse_decls(db,(BZ)(p-db),&r->style,&r->mask);E.rule_n++;}if(p<e)p++;}}

/* Bounded HTTP relative-reference resolution. Failure always returns an empty URL. */
static void resolve_url(const char*rel,char*out,BZ cap){
    const char*b=E.base; BZ rn,bn,i,scheme=0,origin=0,path_end=0,prefix=0;
    char merged[DFWEB_MAX_URL];
    if(!out||!cap)return;
    out[0]=0;
    if(!rel||!*rel)return;
    rn=c_len(rel); bn=c_len(b);
    if(rn>=cap||rn>=sizeof(merged))return;
    for(i=0;i<rn;i++)if((unsigned char)rel[i]<32u||rel[i]=='\\'||(unsigned char)rel[i]==127u)return;
    /* A colon before a path/query/fragment marks an absolute scheme. */
    for(i=0;i<rn&&rel[i]!='/'&&rel[i]!='?'&&rel[i]!='#';i++){
        if(rel[i]==':'){
            if((i==4&&lowerc(rel[0])=='h'&&lowerc(rel[1])=='t'&&lowerc(rel[2])=='t'&&lowerc(rel[3])=='p')||
               (i==5&&lowerc(rel[0])=='h'&&lowerc(rel[1])=='t'&&lowerc(rel[2])=='t'&&lowerc(rel[3])=='p'&&lowerc(rel[4])=='s'))
                c_copy(out,cap,rel);
            return;
        }
    }
    for(i=0;i+2<bn;i++)if(b[i]==':'&&b[i+1]=='/'&&b[i+2]=='/'){scheme=i+1;break;}
    if(!scheme)return;
    origin=scheme+2;
    while(origin<bn&&b[origin]!='/'&&b[origin]!='?'&&b[origin]!='#')origin++;
    if(rn>=2&&rel[0]=='/'&&rel[1]=='/'){
        if(scheme+rn>=cap)return;
        memcpy(out,b,scheme);c_copy(out+scheme,cap-scheme,rel);return;
    }
    path_end=origin;
    while(path_end<bn&&b[path_end]!='?'&&b[path_end]!='#')path_end++;
    if(rel[0]=='#'){
        prefix=bn;for(i=0;i<bn;i++)if(b[i]=='#'){prefix=i;break;}
    }else if(rel[0]=='?')prefix=path_end;
    else if(rel[0]=='/')prefix=origin;
    else{
        prefix=origin;
        for(i=origin;i<path_end;i++)if(b[i]=='/')prefix=i+1;
    }
    if(prefix+rn+2>=sizeof(merged))return;
    memcpy(merged,b,prefix);i=prefix;
    if(rel[0]!='/'&&rel[0]!='?'&&rel[0]!='#'&&prefix==origin)merged[i++]='/';
    memcpy(merged+i,rel,rn+1);
    /* Remove literal dot segments without interpreting encoded URL bytes. */
    if(rel[0]!='?'&&rel[0]!='#'){
        BZ read=origin,write=origin,segment_start[DFWEB_MAX_URL/2],depth=0,end=c_len(merged);
        memcpy(out,merged,origin);
        while(read<end&&merged[read]!='?'&&merged[read]!='#'){
            BZ a,z; if(merged[read]=='/'){read++;if(write==origin)out[write++]='/';}
            a=read;while(read<end&&merged[read]!='/'&&merged[read]!='?'&&merged[read]!='#')read++;z=read-a;
            if(z==1&&merged[a]=='.')continue;
            if(z==2&&merged[a]=='.'&&merged[a+1]=='.'){
                if(depth)write=segment_start[--depth];continue;
            }
            if(!z)continue;
            if(depth&&write>origin&&out[write-1]!='/')out[write++]='/';
            segment_start[depth++]=write>origin+1?write-1:write;
            memcpy(out+write,merged+a,z);write+=z;
        }
        if(read&&merged[read-1]=='/'&&write&&out[write-1]!='/')out[write++]='/';
        if(write+end-read>=cap){out[0]=0;return;}
        memcpy(out+write,merged+read,end-read+1);
    }else c_copy(out,cap,merged);
}
static void resource_add(B32 kind,const char*url){char abs[DFWEB_MAX_URL];B32 id,i;resolve_url(url,abs,sizeof(abs));if(!*abs)return;for(i=0;i<E.resource_n;i++)if(E.resources[i].kind==kind&&c_eq(pool_ptr(E.resources[i].url_id),abs))return;if(E.resource_n>=RESOURCE_MAX)return;id=pool_add(abs);if(!id)return;E.resources[E.resource_n].kind=kind;E.resources[E.resource_n].url_id=id;E.resource_n++;}

static void attr_get(const char*s,const char*e,const char*name,char*out,BZ cap){BZ nn=c_len(name);const char*p=s;out[0]=0;while(p<e){while(p<e&&isspacec(*p))p++;const char*k=p;while(p<e&&isname(*p))p++;if(k==p){p++;continue;}const char*q=p;while(q<e&&isspacec(*q))q++;if(q>=e||*q!='='){p=q;continue;}q++;while(q<e&&isspacec(*q))q++;char quote=0;if(q<e&&(*q=='\''||*q=='\"'))quote=*q++;const char*v=q;if(quote){while(q<e&&*q!=quote)q++;}else while(q<e&&!isspacec(*q)&&*q!='>')q++;if((BZ)(p-k)==nn){BZ i;int eq=1;for(i=0;i<nn;i++)if(lowerc(k[i])!=lowerc(name[i])){eq=0;break;}if(eq){html_decode(out,cap,v,(BZ)(q-v));return;}}if(quote&&q<e)q++;p=q;}}
static void tag_name(const char*s,const char*e,char*out,BZ cap){BZ i=0;while(s<e&&isspacec(*s))s++;if(s<e&&*s=='/')s++;while(s<e&&isname(*s)&&i+1<cap)out[i++]=lowerc(*s++);out[i]=0;}
static int is_block_tag(const char*t){return c_ieq(t,"html")||c_ieq(t,"body")||c_ieq(t,"main")||c_ieq(t,"section")||c_ieq(t,"article")||c_ieq(t,"header")||c_ieq(t,"footer")||c_ieq(t,"nav")||c_ieq(t,"aside")||c_ieq(t,"div")||c_ieq(t,"p")||c_ieq(t,"h1")||c_ieq(t,"h2")||c_ieq(t,"h3")||c_ieq(t,"h4")||c_ieq(t,"h5")||c_ieq(t,"h6")||c_ieq(t,"ul")||c_ieq(t,"ol")||c_ieq(t,"li")||c_ieq(t,"pre")||c_ieq(t,"blockquote")||c_ieq(t,"form")||c_ieq(t,"table");}
static int is_void_tag(const char*t){return c_ieq(t,"img")||c_ieq(t,"br")||c_ieq(t,"hr")||c_ieq(t,"meta")||c_ieq(t,"link")||c_ieq(t,"input")||c_ieq(t,"source");}
static Style compute_style(const char*tag,const char*id,const char*classes,const char*inline_style,const Style*parent){Style s=parent?*parent:style_default();B32 i,m=0;if(!parent)s=style_default();s.bg=0;s.mt=s.mb=s.ml=s.mr=s.pt=s.pb=s.pl=s.pr=0;s.width=s.height=s.radius=0;s.display=is_block_tag(tag)?1:0;if(c_ieq(tag,"h1")){s.font=34;s.flags|=DFWEB_FLAG_BOLD;s.mt=16;s.mb=12;}else if(c_ieq(tag,"h2")){s.font=28;s.flags|=DFWEB_FLAG_BOLD;s.mt=14;s.mb=10;}else if(c_ieq(tag,"h3")){s.font=23;s.flags|=DFWEB_FLAG_BOLD;s.mt=12;s.mb=9;}else if(c_ieq(tag,"h4")){s.font=19;s.flags|=DFWEB_FLAG_BOLD;s.mt=10;s.mb=8;}else if(c_ieq(tag,"p")){s.mt=5;s.mb=11;}else if(c_ieq(tag,"li")){s.display=1;s.ml=18;s.mb=5;}else if(c_ieq(tag,"pre")||c_ieq(tag,"code")){s.font=13;s.bg=0xfff3f6f9u;}else if(c_ieq(tag,"strong")||c_ieq(tag,"b"))s.flags|=DFWEB_FLAG_BOLD;else if(c_ieq(tag,"em")||c_ieq(tag,"i"))s.flags|=DFWEB_FLAG_ITALIC;else if(c_ieq(tag,"a")){s.fg=0xff286f9bu;s.flags|=DFWEB_FLAG_LINK|DFWEB_FLAG_UNDERLINE;}for(i=0;i<E.rule_n;i++)if(selector_match(E.rules[i].selector,tag,id,classes))style_merge(&s,&E.rules[i].style,E.rules[i].mask);if(inline_style&&*inline_style){Style q=s;parse_decls(inline_style,c_len(inline_style),&q,&m);style_merge(&s,&q,m);}return s;}

static void scene_add(B32 type,float x,float y,float w,float h,const Style*s,B32 text_id,B32 url_id,B32 extra_flags){dfweb_scene_item*q;if(E.scene_n>=SCENE_MAX)return;q=&E.scene[E.scene_n++];memset(q,0,sizeof(*q));q->type=type;q->x=x;q->y=y;q->w=w;q->h=h;q->font_size=s?s->font:0;q->fg=s?s->fg:0xff24364au;q->bg=s?s->bg:0;q->flags=(s?s->flags:0)|extra_flags;q->text_id=text_id;q->url_id=url_id;}
static Frame* nearest_flex(Frame*st,int sp){int i;for(i=sp-1;i>=0;i--)if(st[i].flex)return &st[i];return 0;}
static void place_box(Frame*st,int sp,float*gy,float w,float h,float*ox,float*oy){Frame*f=nearest_flex(st,sp);if(f){if(f->cursor_x+w>f->x+f->width&&f->cursor_x>f->x){f->row_top+=f->max_h+10;f->cursor_x=f->x;f->max_h=0;}*ox=f->cursor_x;*oy=f->row_top;f->cursor_x+=w+12;if(h>f->max_h)f->max_h=h;if(f->row_top+f->max_h>*gy)*gy=f->row_top+f->max_h;}else{*ox=32;*oy=*gy;*gy+=h;}}
static void emit_text(Frame*st,int sp,float*gy,const char*raw0,BZ n0){char dtmp[4096];char tmp[4096];BZ n=html_decode(dtmp,sizeof(dtmp),raw0,n0);const char*raw=dtmp;BZ i=0,j=0;int prev_space=1;while(i<n&&j+1<sizeof(tmp)){char c=raw[i++];if((unsigned char)c==0xC2&&i<n&&(unsigned char)raw[i]==0xA0){c=' ';i++;}if(isspacec(c)){if(prev_space)continue;c=' ';prev_space=1;}else prev_space=0;tmp[j++]=c;}while(j&&tmp[j-1]==' ')j--;tmp[j]=0;if(!j)return;Frame*f=sp?&st[sp-1]:0;Style s=f?f->style:style_default();if(s.display==3)return;float avail=f&&f->width>0?f->width:(float)(E.viewport_w>80?E.viewport_w-64:800);float est=(float)j*s.font*0.54f;float w=est<avail?est:avail;if(w<40)w=40;B32 lines=(B32)(est/avail)+1;float h=(float)lines*s.font*1.52f;float x,y;place_box(st,sp,gy,w,h,&x,&y);if(f&&!nearest_flex(st,sp)){x=f->x+f->style.pl;w=f->width-f->style.pl-f->style.pr;if(w<1)w=1;}scene_add(DFWEB_SCENE_TEXT,x,y,w,h,&s,pool_add(tmp),f?f->href_id:0,0);E.nodes++;}


static const char* tag_end(const char*p,const char*e){
    char quote=0;
    while(p<e){if(quote){if(*p==quote)quote=0;}else if(*p=='\''||*p=='"')quote=*p;else if(*p=='>')break;p++;}
    return p;
}
static const char* close_tag(const char*p,const char*e,const char*tag){
    BZ n=c_len(tag);
    while(p<e){
        if((BZ)(e-p)>=n+3&&p[0]=='<'&&p[1]=='/'){
            BZ i;for(i=0;i<n&&lowerc(p[i+2])==lowerc(tag[i]);i++);
            if(i==n&&(p[n+2]=='>'||isspacec(p[n+2])))return p;
        }
        p++;
    }
    return e;
}
static const char* after_close_tag(const char*p,const char*e,const char*tag){
    p=close_tag(p,e,tag);if(p==e)return e;p=tag_end(p,e);return p<e?p+1:e;
}
static const char* after_comment(const char*p,const char*e){
    while((BZ)(e-p)>=3){if(p[0]=='-'&&p[1]=='-'&&p[2]=='>')return p+3;p++;}
    return e;
}


/* Skip an element subtree even when descendants reuse its tag name. */
static const char* after_element(const char*p,const char*e,const char*tag){
    B32 depth=1;
    while(p<e){
        const char*lt=p;const char*gt;char name[24];int closing,self_closing;
        while(lt<e&&*lt!='<')lt++;if(lt>=e)return e;
        if((BZ)(e-lt)>=4&&!memcmp(lt,"<!--",4)){p=after_comment(lt+4,e);continue;}
        gt=tag_end(lt+1,e);if(gt>=e)return e;
        tag_name(lt+1,gt,name,sizeof(name));closing=lt+1<gt&&lt[1]=='/';self_closing=gt>lt+1&&gt[-1]=='/';
        if(c_ieq(name,tag)){
            if(closing){if(--depth==0)return gt+1;}else if(!self_closing)depth++;
        }else if(!closing&&(c_ieq(name,"script")||c_ieq(name,"style")||c_ieq(name,"textarea")||c_ieq(name,"title"))){
            p=after_close_tag(gt+1,e,name);continue;
        }
        p=gt+1;
    }
    return e;
}
static int first_pass(void){
    const char*s=(const char*)E.doc,*e=s+E.doc_len,*p=s;
    E.css_len=0;E.resource_n=0;E.string_n=0;E.title[0]=0;E.scripts=0;
    while(p<e){
        const char*lt=p;const char*gt;char tag[24];int closing;
        while(lt<e&&*lt!='<')lt++;if(lt>=e)break;
        if((BZ)(e-lt)>=4&&!memcmp(lt,"<!--",4)){p=after_comment(lt+4,e);continue;}
        gt=tag_end(lt+1,e);if(gt>=e)break;
        tag_name(lt+1,gt,tag,sizeof(tag));closing=(lt+1<gt&&lt[1]=='/');
        if(!closing&&(c_ieq(tag,"style")||c_ieq(tag,"script")||c_ieq(tag,"title"))){
            const char*end=close_tag(gt+1,e,tag);BZ n=(BZ)(end-(gt+1));
            if(c_ieq(tag,"style")){
                if(n+1>CSS_MAX-E.css_len)return K9;
                memcpy(E.css+E.css_len,gt+1,n);E.css_len+=(B32)n;E.css[E.css_len++]='\n';
            }else if(c_ieq(tag,"script"))E.scripts++;
            else html_decode(E.title,sizeof(E.title),gt+1,n);
            p=end==e?e:after_close_tag(end,e,tag);continue;
        }
        if(!closing&&(c_ieq(tag,"template")||c_ieq(tag,"textarea")||c_ieq(tag,"noscript")||c_ieq(tag,"svg"))){p=after_close_tag(gt+1,e,tag);continue;}
        if(!closing&&c_ieq(tag,"link")){
            char rel[64],href[DFWEB_MAX_URL];
            attr_get(lt+1,gt,"rel",rel,sizeof(rel));attr_get(lt+1,gt,"href",href,sizeof(href));
            if(c_ieq(rel,"stylesheet")&&*href)resource_add(DFWEB_RES_CSS,href);
        }
        p=gt+1;
    }
    if(E.external_css_len>CSS_MAX-E.css_len)return K9;
    memcpy(E.css+E.css_len,E.external_css,E.external_css_len);E.css_len+=E.external_css_len;
    E.css[E.css_len]=0;
    if(!*E.title)c_copy(E.title,sizeof(E.title),E.base);
    return K0;
}
static void render_pass(void){Frame st[STACK_MAX];int sp=0;float gy=32;const char*s=(const char*)E.doc,*e=s+E.doc_len,*p=s;E.scene_n=0;E.nodes=0;while(p<e){const char*lt=p;while(lt<e&&*lt!='<')lt++;if(lt>p)emit_text(st,sp,&gy,p,(BZ)(lt-p));if(lt>=e)break;if(lt+3<e&&lt[1]=='!'&&lt[2]=='-'&&lt[3]=='-'){const char*q=lt+4;p=after_comment(q,e);continue;}const char*gt=lt+1;int quote=0;char qc=0;while(gt<e){if(!quote&&(*gt=='\''||*gt=='\"')){quote=1;qc=*gt;}else if(quote&&*gt==qc)quote=0;else if(!quote&&*gt=='>')break;gt++;}if(gt>=e)break;char tag[24];tag_name(lt+1,gt,tag,sizeof(tag));int closing=(lt+1<gt&&lt[1]=='/');if(!*tag){p=gt+1;continue;}if(closing){if((c_ieq(tag,"script")||c_ieq(tag,"style"))){p=gt+1;continue;}if(sp>0&&c_ieq(st[sp-1].tag,tag)){Frame*f=&st[sp-1];if(f->flex){if(f->row_top+f->max_h>gy)gy=f->row_top+f->max_h;gy+=f->style.pb+f->style.mb+8;}else if(f->style.display==1)gy+=f->style.pb+f->style.mb;sp--;}p=gt+1;continue;}if(c_ieq(tag,"select")||c_ieq(tag,"optgroup")||c_ieq(tag,"option")||c_ieq(tag,"noscript")||c_ieq(tag,"svg")||c_ieq(tag,"template")||c_ieq(tag,"textarea")){
    if(c_ieq(tag,"select")){Style chip=style_default();chip.font=14;chip.bg=0xffe8f1f6u;float x,y;place_box(st,sp,&gy,280,36,&x,&y);scene_add(DFWEB_SCENE_RECT,x,y,280,34,&chip,0,0,0);scene_add(DFWEB_SCENE_TEXT,x+12,y+6,250,22,&chip,pool_add("Choice control"),0,0);}
    p=after_element(gt+1,e,tag);continue;
}if(c_ieq(tag,"script")||c_ieq(tag,"style")||c_ieq(tag,"title")||c_ieq(tag,"head")){p=after_close_tag(gt+1,e,tag);continue;}if(c_ieq(tag,"meta")){p=gt+1;continue;}char id[64],classes[192],inline_style[512],href[DFWEB_MAX_URL],src[DFWEB_MAX_URL],rel[64],widths[32],heights[32],controls[16];attr_get(lt+1,gt,"id",id,sizeof(id));attr_get(lt+1,gt,"class",classes,sizeof(classes));attr_get(lt+1,gt,"style",inline_style,sizeof(inline_style));attr_get(lt+1,gt,"href",href,sizeof(href));attr_get(lt+1,gt,"src",src,sizeof(src));attr_get(lt+1,gt,"rel",rel,sizeof(rel));attr_get(lt+1,gt,"width",widths,sizeof(widths));attr_get(lt+1,gt,"height",heights,sizeof(heights));attr_get(lt+1,gt,"controls",controls,sizeof(controls));char abs_href[DFWEB_MAX_URL];resolve_url(href,abs_href,sizeof(abs_href));Style parent=sp?st[sp-1].style:style_default();Style q=compute_style(tag,id,classes,inline_style,&parent);E.nodes++;if(q.display==3){p=is_void_tag(tag)?gt+1:after_element(gt+1,e,tag);continue;}if(sp>=STACK_MAX&&!is_void_tag(tag)){p=after_element(gt+1,e,tag);continue;}if(c_ieq(tag,"br")){gy+=q.font*1.45f;p=gt+1;continue;}if(c_ieq(tag,"hr")){float x,y;place_box(st,sp,&gy,(float)E.viewport_w-96,10,&x,&y);scene_add(DFWEB_SCENE_RULE,x,y+4,(float)E.viewport_w-96,1,&q,0,0,0);p=gt+1;continue;}if(c_ieq(tag,"img")){char abs[DFWEB_MAX_URL];resolve_url(src,abs,sizeof(abs));float w=q.width?q.width:(widths[0]?parse_float_px(widths,360):360);float h=q.height?q.height:(heights[0]?parse_float_px(heights,220):220);float x,y;place_box(st,sp,&gy,w,h+10,&x,&y);B32 uid=pool_add(abs);scene_add(DFWEB_SCENE_IMAGE,x,y,w,h,&q,0,uid,0);if(*abs)resource_add(DFWEB_RES_IMAGE,abs);p=gt+1;continue;}if(c_ieq(tag,"video")){char abs[DFWEB_MAX_URL];resolve_url(src,abs,sizeof(abs));float w=q.width?q.width:(widths[0]?parse_float_px(widths,640):640);if(w>(float)E.viewport_w-96)w=(float)E.viewport_w-96;float h=q.height?q.height:(heights[0]?parse_float_px(heights,w*0.5625f):w*0.5625f);float x,y;place_box(st,sp,&gy,w,h+14,&x,&y);B32 uid=pool_add(abs);scene_add(DFWEB_SCENE_VIDEO,x,y,w,h,&q,0,uid,DFWEB_FLAG_CONTROLS);if(*abs)resource_add(DFWEB_RES_VIDEO,abs);if(sp<STACK_MAX){Frame*f=&st[sp++];memset(f,0,sizeof(*f));c_copy(f->tag,sizeof(f->tag),tag);f->style=q;f->x=x;f->width=w;f->href_id=0;}p=gt+1;continue;}if(c_ieq(tag,"source")){if(*src&&sp>0&&c_ieq(st[sp-1].tag,"video")){char abs[DFWEB_MAX_URL];resolve_url(src,abs,sizeof(abs));resource_add(DFWEB_RES_VIDEO,abs);if(E.scene_n&&E.scene[E.scene_n-1].type==DFWEB_SCENE_VIDEO&&!E.scene[E.scene_n-1].url_id)E.scene[E.scene_n-1].url_id=pool_add(abs);}p=gt+1;continue;}if(c_ieq(tag,"link")){if(c_ieq(rel,"stylesheet")&&*href)resource_add(DFWEB_RES_CSS,abs_href);p=gt+1;continue;}if(q.display==1||q.display==2){gy+=q.mt;float x=32+q.ml;float w=q.width?q.width:(float)E.viewport_w-64-q.ml-q.mr;if(w<80)w=80;if(q.bg){Style bg=q;scene_add(DFWEB_SCENE_RECT,x,gy,w,q.height?q.height:36,&bg,0,0,0);}if(sp<STACK_MAX){Frame*f=&st[sp++];memset(f,0,sizeof(*f));c_copy(f->tag,sizeof(f->tag),tag);c_copy(f->id,sizeof(f->id),id);c_copy(f->classes,sizeof(f->classes),classes);f->style=q;f->href_id=*href?pool_add(abs_href):0;f->x=x+q.pl;f->width=w-q.pl-q.pr;if(f->width<1)f->width=1;f->flex=q.display==2;f->row_top=gy+q.pt;f->cursor_x=f->x;f->max_h=0;}gy+=q.pt;}else{if(sp<STACK_MAX&&!is_void_tag(tag)){Frame*f=&st[sp++];memset(f,0,sizeof(*f));c_copy(f->tag,sizeof(f->tag),tag);f->style=q;f->href_id=*href?pool_add(abs_href):(sp>1?st[sp-2].href_id:0);f->x=sp>1?st[sp-2].x:32;f->width=sp>1?st[sp-2].width:(float)E.viewport_w-64;}}p=gt+1;}if(gy<200)gy=200;}

static int parse_and_layout(void){int r=first_pass();if(r!=K0){E.scene_n=E.resource_n=E.string_n=0;return r;}css_parse_all();render_pass();return K0;}

/* DF_Medium HAL: all browser meaning stays in the VM+web device; host primitives are bounded. */
static int h_storage_read(void*c,B32 o,BZ off,B8*out,BZ cap,BZ*n){(void)c;(void)o;(void)off;(void)out;(void)cap;if(!n)return K20;*n=0;return K0;}
static int h_storage_write(void*c,B32 o,BZ off,const B8*d,BZ n){(void)c;(void)o;(void)off;(void)d;(void)n;return K0;}
static int h_storage_erase(void*c,B32 o){(void)c;(void)o;return K0;}static int h_storage_flush(void*c,B32 o){(void)c;(void)o;return K0;}static int h_storage_sync(void*c,B32 o){(void)c;(void)o;return K0;}static int h_storage_replace(void*c,B32 a,B32 b){(void)c;(void)a;(void)b;return K0;}static int h_storage_status(void*c,B32 o,br_storage_status*s){(void)c;(void)o;if(!s)return K20;s->size=0;s->capacity=65536;s->flags=0;s->reserved=0;return K0;}
static int h_state_auth(void*c,const B8*d,BZ n,B8 out[32]){BZ i;(void)c;if(!out)return K20;for(i=0;i<32;i++)out[i]=(B8)(0x5au+(B8)i);for(i=0;i<n;i++)out[i&31]^=d?d[i]:0;return K0;}
static int h_mread(void*c,B64*v){(void)c;if(!v)return K20;*v=fake_clock;return K0;}static int h_mcommit(void*c,B64 v){(void)c;fake_clock=v;return K0;}static int h_vsig(void*c,const B8*k,BZ kn,const B8*m,BZ mn,const B8*s,BZ sn){(void)c;(void)k;(void)kn;(void)m;(void)mn;(void)s;(void)sn;return K23;}static int h_rand(void*c,B8*out,BZ n){BZ i;(void)c;for(i=0;i<n;i++)out[i]=(B8)(i*33u+17u);return K0;}static int h_clock(void*c,B64*v){(void)c;if(!v)return K20;*v=++fake_clock;return K0;}static int h_console_read(void*c,B8*out,BZ cap,BZ*n){(void)c;(void)out;(void)cap;if(!n)return K20;*n=0;return K0;}static int h_console_write(void*c,const B8*d,BZ n){(void)c;(void)d;(void)n;return K0;}static int h_console_flush(void*c){(void)c;return K0;}static void h_panic(void*c,int x){(void)c;(void)x;}static int h_yield(void*c){(void)c;return K0;}static int h_lock(void*c,B32 id){(void)c;(void)id;return K0;}static int h_unlock(void*c,B32 id){(void)c;(void)id;return K0;}static int h_hash(void*c,const B8*d,BZ n,B8 out[32]){BZ i;(void)c;for(i=0;i<32;i++)out[i]=(B8)i;for(i=0;i<n;i++)out[i&31]=(B8)((out[i&31]*33u)^(d?d[i]:0));return K0;}
static int h_device(void*c,B32 id,B32 op,const B8*in,BZ n,B8*out,BZ cap,BZ*on){(void)c;if(!on)return K20;*on=0;if(id!=BR_DWEB_TRANSPORT)return K5;if(op==1){if(!in||n<1)return K20;B8 cmd=in[0];if(cmd==1){BZ q=n-1;if(E.doc_len+q>DOC_MAX)return K9;memcpy(E.doc+E.doc_len,in+1,q);E.doc_len+=(B32)q;E.doc[E.doc_len]=0;return K0;}if(cmd==2){BZ q=n-1;if(q>CSS_MAX-E.external_css_len)return K9;memcpy(E.external_css+E.external_css_len,in+1,q);E.external_css_len+=(B32)q;E.external_css[E.external_css_len]=0;return K0;}return K20;}if(op==2){int r=parse_and_layout();if(r!=K0)return r;if(out&&cap>=8){out[0]=(B8)E.scene_n;out[1]=(B8)(E.scene_n>>8);out[2]=(B8)(E.scene_n>>16);out[3]=(B8)(E.scene_n>>24);out[4]=(B8)E.resource_n;out[5]=(B8)(E.resource_n>>8);out[6]=(B8)(E.resource_n>>16);out[7]=(B8)(E.resource_n>>24);*on=8;}return K0;}return K20;}

B32 dfweb_abi(void){return DFWEB_ABI;}B32 dfweb_vm_core_abi(void){return BR_CORE_ABI;}
int dfweb_init(void){int r;memset(&E,0,sizeof(E));memset(&H,0,sizeof(H));H.storage_read=h_storage_read;H.storage_write=h_storage_write;H.storage_erase=h_storage_erase;H.storage_flush=h_storage_flush;H.storage_sync=h_storage_sync;H.storage_replace=h_storage_replace;H.storage_status=h_storage_status;H.state_auth=h_state_auth;H.monotonic_read=h_mread;H.monotonic_commit=h_mcommit;H.verify_signature=h_vsig;H.random_bytes=h_rand;H.clock_read=h_clock;H.monotonic_time=h_clock;H.console_read=h_console_read;H.console_write=h_console_write;H.console_flush=h_console_flush;H.device_call=h_device;H.panic=h_panic;H.yield=h_yield;H.lock=h_lock;H.unlock=h_unlock;H.hash256=h_hash;r=br_vm_init(&V);if(r!=K0)return r;{br_config q={BR_CORE_ABI,N46,200000,4096,8192,4194304u,134217728u,4194304u,1048576u,262144u,32768u};r=br_core_configure(&V,&H,&q);if(r!=K0)return r;}r=br_core_set_device(&V,7,BR_DWEB_TRANSPORT,N00|N60);if(r!=K0)return r;V.devices[7].mi=32768;V.devices[7].mo=32768;E.vm_calls=0;return K0;}
int dfweb_begin(const char*base,B32 vw,B32 vh){E.doc_len=0;E.css_len=0;E.external_css_len=0;E.scene_n=0;E.resource_n=0;E.string_n=0;E.rule_n=0;E.nodes=E.scripts=E.vm_calls=0;c_copy(E.base,sizeof(E.base),base?base:"");E.viewport_w=vw<320?320:(vw>4096?4096:vw);E.viewport_h=vh<240?240:(vh>4096?4096:vh);V.dc=V.db=V.dw=V.de=V.io_used=V.host_calls_used=V.services_used=0;return 0;}
static int vm_feed(B8 cmd,const B8*d,B32 n){B32 pos=0;while(pos<n){B32 q=n-pos;if(q>32767u)q=32767u;V.memory[0]=cmd;memcpy(V.memory+1,d+pos,q);BZ got=0;int r=br_device_invoke(&V,7,1,0,q+1,0,0,&got);E.vm_calls++;if(r!=K0)return r;pos+=q;}return 0;}
int dfweb_feed_document(const B8*d,B32 n){if(!d&&n)return K20;if(n>DOC_MAX-E.doc_len)return K9;return vm_feed(1,d,n);}int dfweb_add_stylesheet(const char*url,const B8*d,B32 n){(void)url;if(!d&&n)return K20;if(n+1u<n||n+1u>CSS_MAX-E.external_css_len)return K9;int r=vm_feed(2,d,n);if(r==K0&&n){static const B8 newline='\n';r=vm_feed(2,&newline,1);}return r;}int dfweb_commit(void){BZ got=0;int r=br_device_invoke(&V,7,2,0,0,0,16,&got);E.vm_calls++;return r;}
B32 dfweb_scene_count(void){return E.scene_n;}int dfweb_scene_get(B32 i,dfweb_scene_item*out){if(!out||i>=E.scene_n)return K20;*out=E.scene[i];return 0;}B32 dfweb_resource_count(void){return E.resource_n;}int dfweb_resource_get(B32 i,dfweb_resource_item*out){if(!out||i>=E.resource_n)return K20;*out=E.resources[i];return 0;}int dfweb_string_get(B32 id,char*out,B32 cap){const char*s=pool_ptr(id);B32 n=(B32)c_len(s);if(!out||!cap)return (int)n;if(n>=cap)n=cap-1;memcpy(out,s,n);out[n]=0;return (int)n;}int dfweb_title_get(char*out,B32 cap){B32 n=(B32)c_len(E.title);if(!out||!cap)return(int)n;if(n>=cap)n=cap-1;memcpy(out,E.title,n);out[n]=0;return(int)n;}int dfweb_stats_get(B32*n,B32*r,B32*s,B32*v){if(n)*n=E.nodes;if(r)*r=E.rule_n;if(s)*s=E.scripts;if(v)*v=E.vm_calls;return 0;}
int dfweb_selftest(void){static const char h[]="<html><head><style>h1{color:#336699}.card{display:flex}</style></head><body><h1>Hello</h1><div class='card'><img src='https://example.com/a.png' width='120' height='80'><p>World</p></div><video controls src='https://example.com/v.mp4'></video></body></html>";if(dfweb_init()!=0)return 1;if(dfweb_begin("https://example.com/index.html",1024,768)!=0)return 2;if(dfweb_feed_document((const B8*)h,(B32)(sizeof(h)-1))!=0)return 3;if(dfweb_commit()!=0)return 4;{B32 i,im=0,vi=0,tx=0;for(i=0;i<E.scene_n;i++){if(E.scene[i].type==DFWEB_SCENE_IMAGE)im++;if(E.scene[i].type==DFWEB_SCENE_VIDEO)vi++;if(E.scene[i].type==DFWEB_SCENE_TEXT)tx++;}if(!im||!vi||!tx||E.rule_n==0)return 5;}return 0;}

int dfweb_profile_hash_get(char*out,B32 cap){B32 i=0;if(!out||cap<65)return K20;while(DFWEB_JA21_SOURCE_SHA256[i]&&i+1<cap){out[i]=DFWEB_JA21_SOURCE_SHA256[i];i++;}out[i]=0;return K0;}
