import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
from ja21_core import Diagnostic, VM, analyze_url, compile_core


class CoreRuntime(unittest.TestCase):
    def unit(self, expression):
        return compile_core('ja source 0.3 module test.core use Core policy no_network '
                            'function value() -> Count effects { pure } { return '+expression+' }')

    def test_integer_division_rejects_fraction_at_max_safe_count(self):
        # Count division requires an exact integer result at the maximum supported magnitude.
        with self.assertRaises(Diagnostic):
            VM(self.unit('9007199254740991 / 2')).run('value')
        self.assertEqual(VM(self.unit('9007199254740990 / 2')).run('value'), 4503599627370495)

    def test_generated_left_associative_tree_is_bounded(self):
        with self.assertRaises(Diagnostic):
            self.unit(' + '.join(['1'] * 300))

    def test_nested_runtime_input_stops_before_python_recursion_limit(self):
        unit=self.unit('1')
        node={'op':'literal','value':1}
        for _ in range(400):
            node={'op':'binary','kind':'+','left':node,'right':{'op':'literal','value':1}}
        unit['functions']['value']['body'][0]['value']=node
        with self.assertRaises(Diagnostic):
            VM(unit).run('value')

    def test_url_analysis_rejects_invalid_ports_and_control_characters(self):
        for url in ('https://example.com:99999/', 'http://example.com:bad/',
                    'https://example.com:0/', 'https://exa\nmple.com/'):
            self.assertFalse(analyze_url(url)['valid'])
        self.assertTrue(analyze_url('http://localhost:8788/')['valid'])

    def test_shipped_profiles_compile_and_browser_policy_executes(self):
        for name in ('browser', 'renderer', 'web_engine'):
            unit=compile_core((ROOT/f'source/{name}.ja').read_text(encoding='utf-8'))
            self.assertEqual(unit['profile'], 'vb-ja21-core/2')
        browser=VM(compile_core((ROOT/'source/browser.ja').read_text(encoding='utf-8')))
        self.assertEqual(browser.run('normalize',['about:blank']), 'about:blank')
        self.assertEqual(browser.run('normalize',['http://127.0.0.1:8788']), 'http://127.0.0.1:8788')
        self.assertEqual(browser.run('normalize',['javascript:alert(1)']), '')


if __name__ == '__main__':
    unittest.main()
