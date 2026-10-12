"""Execute the shipped Windows DLL (or freshly built POSIX library) through its ABI."""
import ctypes
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class SceneItem(ctypes.Structure):
    _fields_ = [('type', ctypes.c_uint32)] + [
        (name, ctypes.c_float) for name in ('x', 'y', 'w', 'h', 'font_size')
    ] + [(name, ctypes.c_uint32) for name in ('fg', 'bg', 'flags', 'text_id', 'url_id')]


class NativeEngineRuntime(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.build_dir = None
        requested = os.environ.get('JA21_NATIVE_TEST_DLL')
        if requested:
            library = Path(requested)
        elif os.name == 'nt':
            library = ROOT / 'engine/df_medium/native/win-x64/dfmedium-ja21-web.dll'
        else:
            compiler = shutil.which('cc') or shutil.which('gcc')
            if not compiler:
                raise unittest.SkipTest('A C compiler is required to test native source on POSIX')
            cls.build_dir = tempfile.TemporaryDirectory(prefix='ja21-engine-')
            library = Path(cls.build_dir.name) / 'engine.so'
            source = ROOT / 'engine/df_medium/source'
            subprocess.run([compiler, '-std=c11', '-O2', '-shared', '-fPIC', '-o', str(library),
                            str(source/'ja21_webengine.c'), str(source/'brvm.c'), str(source/'brtrust.c'),
                            '-I', str(source)], check=True, timeout=120)
        cls.lib = ctypes.CDLL(str(library))
        cls.lib.dfweb_begin.argtypes = [ctypes.c_char_p, ctypes.c_uint32, ctypes.c_uint32]
        cls.lib.dfweb_feed_document.argtypes = [ctypes.c_char_p, ctypes.c_uint32]
        cls.lib.dfweb_add_stylesheet.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_uint32]
        cls.lib.dfweb_scene_count.restype = ctypes.c_uint32
        cls.lib.dfweb_resource_count.restype = ctypes.c_uint32
        cls.lib.dfweb_scene_get.argtypes = [ctypes.c_uint32, ctypes.POINTER(SceneItem)]
        cls.lib.dfweb_string_get.argtypes = [ctypes.c_uint32, ctypes.c_void_p, ctypes.c_uint32]
        cls.lib.dfweb_title_get.argtypes = [ctypes.c_void_p, ctypes.c_uint32]

    @classmethod
    def tearDownClass(cls):
        if cls.build_dir:
            cls.build_dir.cleanup()

    def setUp(self):
        self.assertEqual(self.lib.dfweb_init(), 0)
        self.begin()

    def begin(self, base=b'https://example.com/dir/index.html'):
        self.assertEqual(self.lib.dfweb_begin(base, 800, 600), 0)

    def render(self, html):
        data = html.encode('utf-8') if isinstance(html, str) else html
        self.assertEqual(self.lib.dfweb_feed_document(data, len(data)), 0)
        self.assertEqual(self.lib.dfweb_commit(), 0)
        return self.scene()

    def string(self, string_id):
        buf = ctypes.create_string_buffer(16384)
        self.assertGreaterEqual(self.lib.dfweb_string_get(string_id, buf, len(buf)), 0)
        return buf.value.decode('utf-8')

    def scene(self):
        items = []
        for i in range(self.lib.dfweb_scene_count()):
            item = SceneItem()
            self.assertEqual(self.lib.dfweb_scene_get(i, ctypes.byref(item)), 0)
            items.append((item, self.string(item.text_id), self.string(item.url_id)))
        return items

    def test_native_selftest_and_abi(self):
        self.assertEqual(self.lib.dfweb_selftest(), 0)
        self.assertEqual(ctypes.sizeof(SceneItem), 44)
        self.assertEqual(self.lib.dfweb_abi(), 0x00080000)

    def test_character_references_and_title_metadata(self):
        items = self.render('<html><head><title>A &amp; B</title></head><body>'
                            '<a href="/p?a=1&amp;b=2">Link &#8212; &#x41; &amp;</a></body></html>')
        text = [(t, u) for _, t, u in items if t]
        self.assertEqual(text, [('Link — A &', 'https://example.com/p?a=1&b=2')])
        buf = ctypes.create_string_buffer(1024)
        self.lib.dfweb_title_get(buf, len(buf))
        self.assertEqual(buf.value.decode(), 'A & B')

    def test_external_css_survives_recommit_without_accumulating(self):
        self.render('<style>p{font-size:20px}</style><p>Visible</p>')
        css = b'p{color:#123456}'
        self.assertEqual(self.lib.dfweb_add_stylesheet(b'/style.css', css, len(css)), 0)
        for _ in range(3):
            self.assertEqual(self.lib.dfweb_commit(), 0)
            item = [q for q, t, _ in self.scene() if t == 'Visible'][0]
            self.assertEqual(item.fg, 0xff123456)
            self.assertEqual(item.font_size, 20)

    def test_raw_text_and_hidden_subtrees_do_not_render(self):
        items = self.render('<head><title>Title</title><style>p{color:red}</style></head>'
                            '<script>private_code()</script><div style="display:none">hidden'
                            '<span>hidden child</span><div>nested hidden</div>still hidden</div>'
                            '<template>hidden template</template>'
                            '<p>Visible</p>')
        self.assertEqual([t for _, t, _ in items if t], ['Visible'])

    def test_truncated_entities_and_comments_are_bounded(self):
        for suffix in ('&', '&a', '&amp', '&lt', '&quot', '&#', '&#x', '<!--unfinished'):
            self.begin()
            self.render('<p>Visible</p>' + suffix)
            for item, _, _ in self.scene():
                self.assertTrue(all(math.isfinite(getattr(item, n)) for n in ('x', 'y', 'w', 'h')))

    def test_relative_urls_host_only_dot_segments_and_queries(self):
        for base, target, expected in (
            (b'https://example.com', 'image.png', 'https://example.com/image.png'),
            (b'https://example.com/a/b/index.html?q=1', '../image.png', 'https://example.com/a/image.png'),
            (b'https://example.com/a/index.html?q=1#x', '?q=2', 'https://example.com/a/index.html?q=2'),
            (b'https://example.com/a/index.html?q=1#x', '#y', 'https://example.com/a/index.html?q=1#y'),
            (b'https://example.com/a/index.html', '//cdn.example.com/x', 'https://cdn.example.com/x'),
        ):
            self.begin(base)
            items = self.render('<a href="' + target + '">Link</a>')
            self.assertEqual([u for _, t, u in items if t == 'Link'], [expected])

    def test_unsupported_and_overlong_urls_do_not_leak_buffer_contents(self):
        for target in ('javascript:alert(1)', 'file:///secret', '/' + 'x' * 2045):
            self.begin(b'https://example.com/dir/index.html')
            items = self.render('<a href="' + target + '">Link</a>')
            self.assertEqual([u for _, t, u in items if t == 'Link'], [''])

    def test_over_budget_ingress_is_atomic(self):
        for fn, data in ((self.lib.dfweb_feed_document, b'x' * (1024 * 1024 + 1)),):
            self.assertNotEqual(fn(data, len(data)), 0)
        css = b'x' * (512 * 1024 + 1)
        self.assertNotEqual(self.lib.dfweb_add_stylesheet(b'/huge.css', css, len(css)), 0)
        self.assertEqual([t for _, t, _ in self.render('<p>Visible</p>') if t], ['Visible'])

    def test_hostile_css_dimensions_remain_finite(self):
        items = self.render('<div style="padding:99999999px;width:1px"><p>Text</p></div>')
        for q, _, _ in items:
            self.assertTrue(all(math.isfinite(getattr(q, n)) for n in ('x', 'y', 'w', 'h')))
            self.assertGreaterEqual(q.w, 0)
            self.assertGreaterEqual(q.h, 0)

    def test_css_can_clear_inherited_style_flags(self):
        items = self.render('<em><span style="font-style:normal;text-decoration:none">Plain</span></em>')
        item = [q for q, t, _ in items if t == 'Plain'][0]
        self.assertEqual(item.flags & (4 | 8), 0)

    def test_select_fallback_does_not_expose_option_contents(self):
        items = self.render('<select><optgroup><option>Private choice</option></optgroup></select><p>Visible</p>')
        self.assertEqual([t for _, t, _ in items if t], ['Choice control', 'Visible'])


if __name__ == '__main__':
    unittest.main()
