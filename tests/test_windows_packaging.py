import tempfile
import unittest
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from windows_archive_preflight import scan_relative_paths, scan_tree

class WindowsPackagingTests(unittest.TestCase):
    def test_current_tree_is_windows_compatible(self):
        self.assertEqual(scan_tree(ROOT), [])

    def test_case_collision_is_rejected(self):
        failures=scan_relative_paths(['a/INPUT_PROVENANCE.json','a/input_provenance.json'])
        self.assertTrue(any(x['kind']=='case-or-unicode-collision' for x in failures))

    def test_reserved_device_name_is_rejected(self):
        failures=scan_relative_paths(['evidence/CON.json'])
        self.assertTrue(any(x['kind']=='reserved-windows-device-name' for x in failures))

    def test_trailing_dot_is_rejected(self):
        failures=scan_relative_paths(['evidence/name.'])
        self.assertTrue(any(x['kind']=='trailing-dot-or-space' for x in failures))

if __name__=='__main__':
    unittest.main()
