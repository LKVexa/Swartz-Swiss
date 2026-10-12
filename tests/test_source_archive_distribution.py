"""The public source capsules keep byte-bound provenance without shipping logs."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def is_log(path):
    parts = PurePosixPath(path.replace('\\', '/')).parts
    return any(p.lower() in {'log', 'logs'} or p.lower().endswith('_logs') or
               p.lower().endswith('.log') or '.log.' in p.lower() for p in parts)


class SourceArchiveDistributionTests(unittest.TestCase):
    def setUp(self):
        self.receipt = json.loads((ROOT / 'provenance/source-archive-filtering.json').read_text(encoding='utf-8'))

    def test_archive_hashes_counts_and_log_absence(self):
        for record in self.receipt['archives']:
            with self.subTest(path=record['path']):
                path = ROOT / record['path']
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), record['source_archive_sha256'])
                self.assertNotEqual(record['source_archive_sha256'], record['original_source_archive_sha256'])
                self.assertEqual(record['original_member_count'], record['distributed_member_count'] + record['omitted_log_member_count'])
                self.assertEqual(len(record['omitted_log_members']), record['omitted_log_member_count'])
                self.assertTrue(all(is_log(item['path']) for item in record['omitted_log_members']))
                with zipfile.ZipFile(path) as archive:
                    self.assertIsNone(archive.testzip())
                    self.assertEqual(len(archive.infolist()), record['distributed_member_count'])
                    self.assertEqual(sum(item.file_size for item in archive.infolist()), record['distributed_member_bytes'])
                    self.assertFalse(any(is_log(item.filename) for item in archive.infolist()))

    def test_retained_archive_members_match_extracted_source(self):
        extracted = {
            'engine/df_medium/DF_Medium.source.zip': ROOT / 'engine/df_medium/baseline',
            'helper/source/DF_Small-source.zip': ROOT / 'helper/DF_Small',
        }
        for record in self.receipt['archives']:
            with zipfile.ZipFile(ROOT / record['path']) as archive:
                for member in archive.infolist():
                    with self.subTest(archive=record['path'], member=member.filename):
                        if member.is_dir():
                            continue
                        relative = PurePosixPath(member.filename).parts[1:]
                        self.assertEqual(archive.read(member), extracted[record['path']].joinpath(*relative).read_bytes())

    def test_active_metadata_pins_distributed_archives(self):
        metadata = {
            'engine/df_medium/DF_Medium.source.zip': ROOT / 'engine/df_medium/ENGINE_PROVENANCE.json',
            'helper/source/DF_Small-source.zip': ROOT / 'engine/ja21/dfsmall.lock.json',
        }
        for record in self.receipt['archives']:
            with self.subTest(path=record['path']):
                value = json.loads(metadata[record['path']].read_text(encoding='utf-8'))
                self.assertEqual(value['source_archive_sha256'], record['source_archive_sha256'])
                self.assertEqual(value['original_source_archive_sha256'], record['original_source_archive_sha256'])
                self.assertEqual(value['source_archive_distribution']['distributed_member_count'], record['distributed_member_count'])

    def test_dfsmall_lock_covers_filtered_members(self):
        lock = json.loads((ROOT / 'engine/ja21/dfsmall.lock.json').read_text(encoding='utf-8'))
        entries = {entry['path']: entry for entry in lock['files']}
        self.assertEqual(lock['embedded_files'], len(entries))
        self.assertEqual(lock['embedded_bytes'], sum(entry['bytes'] for entry in entries.values()))
        self.assertFalse(any(is_log(path) for path in entries))
        with zipfile.ZipFile(ROOT / lock['bundled_source_archive']) as archive:
            members = {'/'.join(PurePosixPath(item.filename).parts[1:]): item for item in archive.infolist() if not item.is_dir()}
            self.assertEqual(set(entries), set(members))
            for relative, member in members.items():
                with self.subTest(member=relative):
                    data = archive.read(member)
                    self.assertEqual(len(data), entries[relative]['bytes'])
                    self.assertEqual(hashlib.sha256(data).hexdigest(), entries[relative]['sha256'])


if __name__ == '__main__':
    unittest.main()
