import hashlib
import sys
import tempfile
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
from package_paths import contained_file, manifest_entries, package_files


class PackageManifestSecurity(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='ja21-manifest-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root/'payload.txt').write_text('payload', encoding='utf-8')

    def entry(self, path='payload.txt'):
        return {'path': path, 'bytes': 7, 'sha256': hashlib.sha256(b'payload').hexdigest()}

    def test_valid_manifest(self):
        entries = manifest_entries(self.root, {'files': [self.entry()]})
        self.assertEqual(entries[0][1], self.root/'payload.txt')

    def test_absolute_traversal_and_windows_paths_fail_closed(self):
        for path in ('../payload.txt', '/payload.txt', 'C:/payload.txt', 'C:payload.txt',
                     'a\\payload.txt', './payload.txt', 'a//payload.txt', '.git/config', 'NUL.txt'):
            with self.subTest(path=path), self.assertRaises(ValueError):
                contained_file(self.root, path)

    def test_empty_malformed_and_duplicate_entries_fail_closed(self):
        for manifest in ({}, {'files': []}, {'files': None}, {'files': [None]},
                         {'files': [self.entry(), self.entry()]},
                         {'files': [{**self.entry(), 'bytes': True}]},
                         {'files': [{**self.entry(), 'sha256': 'bad'}]}):
            with self.subTest(manifest=manifest), self.assertRaises(ValueError):
                manifest_entries(self.root, manifest)

    def test_mutable_state_and_git_metadata_are_excluded(self):
        for path in ('.git/config', 'workspace/state.json', 'runtime/adapter.dll',
                     'work/scratch.txt', 'substrate/runtime/state.json', '__pycache__/cache.pyc'):
            file = self.root/path
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text('mutable', encoding='utf-8')
        workflow = self.root/'.github/workflows/check.yml'
        workflow.parent.mkdir(parents=True)
        workflow.write_text('workflow', encoding='utf-8')
        self.assertEqual({p.relative_to(self.root).as_posix() for p in package_files(self.root)},
                         {'payload.txt', '.github/workflows/check.yml'})

    def test_symlink_is_refused_where_available(self):
        link = self.root/'linked.txt'
        try:
            link.symlink_to(self.root/'payload.txt')
        except (OSError, NotImplementedError):
            self.skipTest('Symlink creation is unavailable for this Windows account')
        with self.assertRaises(ValueError):
            contained_file(self.root, 'linked.txt')


if __name__ == '__main__':
    unittest.main()
