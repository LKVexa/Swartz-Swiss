"""8.0.3 regression: HTML character references in href values (DuckDuckGo result links -> HTTP 400)."""
import ctypes,html,os,shutil,subprocess,tempfile,unittest
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
R=Path(__file__).resolve().parents[1]
DDG='https://duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.google.com%2F&amp;rut=4a90d085a290375d5b1db46a9641fb6de7'

def resolve(raw):
    """Reference model of host JaLinkTarget.Resolve."""
    url=raw.strip()
    if '&' in url: url=html.unescape(url) if ';' in url else url
    u=urlsplit(url); h=(u.hostname or '').lower()
    if (h=='duckduckgo.com' or h.endswith('.duckduckgo.com')) and u.path=='/l/':
        t=parse_qs(u.query).get('uddg',[''])[0]; tu=urlsplit(t)
        if tu.scheme in('http','https') and not tu.username: return t
    return url

class HostRepair(unittest.TestCase):
    def setUp(self): self.c=(R/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
    def test_model(self):
        self.assertEqual(resolve(DDG),'https://www.google.com/')
        self.assertEqual(resolve('https://html.duckduckgo.com/q?a=1&#38;b=2'),'https://html.duckduckgo.com/q?a=1&b=2')
        self.assertEqual(resolve('https://duckduckgo.com/l/?uddg=javascript%3Aalert(1)'),'https://duckduckgo.com/l/?uddg=javascript%3Aalert(1)')
    def test_host_wiring(self):
        for x in ['internal static class JaLinkTarget','WebUtility.HtmlDecode(url)','Navigate(t,JaLinkTarget.Resolve(link),true)','url=JaLinkTarget.Resolve(JaAddressText.Sanitize(url));','JaLinkTarget.SelfTest();','catch (WebException wex)','ec.ToString(CultureInfo.InvariantCulture)']:
            self.assertIn(x,self.c)
        self.assertIn(DDG.replace('4a90d085a290375d5b1db46a9641fb6de7','4a90d085'),self.c)

@unittest.skipUnless(shutil.which('gcc') and os.name=='posix','needs gcc on POSIX')
class NativePatch(unittest.TestCase):
    class It(ctypes.Structure): _fields_=[('type',ctypes.c_uint32)]+[(n,ctypes.c_float) for n in 'x y w h fs'.split()]+[(n,ctypes.c_uint32) for n in 'fg bg flags text_id url_id'.split()]
    def scene(self,src):
        d=tempfile.mkdtemp(); so=os.path.join(d,'e.so'); s=R/'engine/df_medium/source'
        subprocess.check_call(['gcc','-w','-shared','-fPIC','-O1','-o',so,str(src),str(s/'brvm.c'),str(s/'brtrust.c'),'-I',str(s)])
        L=ctypes.CDLL(so); self.assertEqual(L.dfweb_init(),0)
        doc=('<html><head><title>A &amp; B</title></head><body><a href="%s">Google &amp; co &#8212; &#x41;</a></body></html>'%DDG).encode()
        L.dfweb_begin(b'https://html.duckduckgo.com/html/?q=google.com',800,600);L.dfweb_feed_document(doc,len(doc));L.dfweb_commit()
        b=ctypes.create_string_buffer(4096);out=[]
        for i in range(L.dfweb_scene_count()):
            q=self.It();L.dfweb_scene_get(i,ctypes.byref(q))
            L.dfweb_string_get(q.text_id,b,4096);t=b.value.decode();L.dfweb_string_get(q.url_id,b,4096);out.append((t,b.value.decode()))
        L.dfweb_title_get(b,4096);self.assertEqual(L.dfweb_selftest(),0);return out,b.value.decode()
    def test_shipped_source_fixes_defect(self):
        out,title=self.scene(R/'engine/df_medium/source/ja21_webengine.c')
        self.assertFalse(any('&amp;rut=' in u for _,u in out))
        self.assertEqual(title,'A & B')
    def test_staged_patch_fixes_defect(self):
        out,title=self.scene(R/'engine/df_medium/patches/ja21_webengine.8.0.3.c')
        self.assertNotIn('A & B',[x for x,_ in out]); self.assertEqual([o for o in out if o[1]][0],('Google & co — A',DDG.replace('&amp;','&'))); self.assertEqual(title,'A & B')

if __name__=='__main__': unittest.main()
