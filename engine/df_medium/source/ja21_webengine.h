#ifndef JA21_DFWEB_ENGINE_H
#define JA21_DFWEB_ENGINE_H
#include "brvm.h"
#ifdef _WIN32
#define DFWEB_EXPORT __declspec(dllexport)
#else
#define DFWEB_EXPORT __attribute__((visibility("default")))
#endif
#define DFWEB_ABI 0x00080000u
#define DFWEB_MAX_TEXT 1024
#define DFWEB_MAX_URL 2048

typedef struct dfweb_scene_item {
    B32 type;
    float x,y,w,h,font_size;
    B32 fg,bg,flags;
    B32 text_id,url_id;
} dfweb_scene_item;

typedef struct dfweb_resource_item {
    B32 kind;
    B32 url_id;
} dfweb_resource_item;

enum { DFWEB_SCENE_TEXT=1, DFWEB_SCENE_RECT=2, DFWEB_SCENE_IMAGE=3, DFWEB_SCENE_VIDEO=4, DFWEB_SCENE_RULE=5 };
enum { DFWEB_RES_CSS=1, DFWEB_RES_IMAGE=2, DFWEB_RES_VIDEO=3 };
enum { DFWEB_FLAG_LINK=1u, DFWEB_FLAG_BOLD=2u, DFWEB_FLAG_ITALIC=4u, DFWEB_FLAG_UNDERLINE=8u, DFWEB_FLAG_CONTROLS=16u };

DFWEB_EXPORT B32 dfweb_abi(void);
DFWEB_EXPORT B32 dfweb_vm_core_abi(void);
DFWEB_EXPORT int dfweb_init(void);
DFWEB_EXPORT int dfweb_begin(const char* base_url,B32 viewport_w,B32 viewport_h);
DFWEB_EXPORT int dfweb_feed_document(const B8* data,B32 len);
DFWEB_EXPORT int dfweb_add_stylesheet(const char* url,const B8* data,B32 len);
DFWEB_EXPORT int dfweb_commit(void);
DFWEB_EXPORT B32 dfweb_scene_count(void);
DFWEB_EXPORT int dfweb_scene_get(B32 index,dfweb_scene_item* out);
DFWEB_EXPORT B32 dfweb_resource_count(void);
DFWEB_EXPORT int dfweb_resource_get(B32 index,dfweb_resource_item* out);
DFWEB_EXPORT int dfweb_string_get(B32 id,char* out,B32 cap);
DFWEB_EXPORT int dfweb_title_get(char* out,B32 cap);
DFWEB_EXPORT int dfweb_stats_get(B32* nodes,B32* rules,B32* scripts,B32* vm_calls);
DFWEB_EXPORT int dfweb_selftest(void);
DFWEB_EXPORT int dfweb_profile_hash_get(char* out,B32 cap);
#endif
