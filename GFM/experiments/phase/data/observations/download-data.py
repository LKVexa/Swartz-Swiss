"""Fetch immutable, small public EHT data and preserve byte-level provenance."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

HERE = Path(__file__).resolve().parent
REPOSITORY = 'eventhorizontelescope/2020-D03-01'
FILES = ['README.md', 'LICENSE.txt', 'INVENTORY.txt',
         'dat/M87_EHT_2011_amp.dat', 'dat/M87_EHT_2012_amp.dat', 'dat/M87_EHT_2013_amp.dat']
LIMIT = 2 * 1024 * 1024


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'GFM-observation-research/1', 'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read(LIMIT + 1)
        if len(data) > LIMIT:
            raise ValueError('Small dataset download exceeded 2 MiB')
        return data, response.geturl(), dict(response.headers.items())


def main():
    api = 'https://api.github.com/repos/' + REPOSITORY + '/commits/master'
    commit_data, _, _ = fetch(api)
    commit = json.loads(commit_data)['sha']
    if len(commit) != 40 or any(c not in '0123456789abcdef' for c in commit):
        raise ValueError('Invalid repository commit')
    evidence = []
    for relative in FILES:
        url = 'https://raw.githubusercontent.com/' + REPOSITORY + '/' + commit + '/' + relative
        data, final_url, headers = fetch(url)
        target = HERE / 'source' / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and target.read_bytes() != data:
            raise ValueError('Preserved source file differs; refusing replacement: ' + relative)
        target.write_bytes(data)
        evidence.append({'path': 'source/' + relative, 'url': url, 'finalUrl': final_url,
                         'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                         'etag': headers.get('ETag')})
    manifest = {'schema': 'GFM-EHT-observation-source/1',
                'downloadedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'publisher': 'Event Horizon Telescope Collaboration', 'repository': REPOSITORY,
                'commit': commit, 'release': '2020-D03-01', 'doi': '10.25739/daft-jz11',
                'officialPortal': 'https://eventhorizontelescope.org/for-astronomers/data',
                'primaryPaper': 'https://doi.org/10.3847/1538-4357/abac0d', 'files': evidence}
    (HERE / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'files': len(evidence), 'bytes': sum(item['bytes'] for item in evidence), 'commit': commit}))


if __name__ == '__main__':
    main()
