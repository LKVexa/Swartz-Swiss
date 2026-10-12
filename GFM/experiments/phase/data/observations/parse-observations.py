"""Strict stdlib parser for the EHT Collaboration 2020-D03-01 data product."""
import datetime
import hashlib
import json
import math
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
STATIONS = {'AP': 'APEX', 'AZ': 'SMT', 'C1': 'CARMA1', 'C2': 'CARMA2', 'C3': 'CARMA3',
            'CS': 'CSO', 'JC': 'JCMT', 'SM': 'SMA'}


def require(ok, message):
    if not ok:
        raise ValueError(message)


def parse_file(path, expected_hash):
    data = path.read_bytes()
    require(len(data) <= 2 * 1024 * 1024, 'Source exceeded bounded file size')
    digest = hashlib.sha256(data).hexdigest()
    require(digest == expected_hash, 'Source hash differs: ' + path.name)
    text = data.decode('utf-8')
    date = re.search(r'^# DATE:\s*(\d{4}/\d{2}/\d{2})\s*$', text, re.M)
    mjd = re.search(r'^# MJD:\s*(\d+)\s*$', text, re.M)
    frequency = re.search(r'^# RF:\s*([\d.]+)\s*GHz\s*$', text, re.M)
    require(date and mjd and frequency, 'Missing observation header metadata')
    base = datetime.datetime.strptime(date.group(1), '%Y/%m/%d').replace(tzinfo=datetime.timezone.utc)
    rows = []
    for line_number, line in enumerate(text.splitlines(), 1):
        if not line.startswith('|'):
            continue
        cells = [value.strip() for value in line.strip('|').split('|')]
        if cells[0] == 'time':
            require(cells == ['time', 't1', 't2', 'u', 'v', 'amp', 'sigma'], 'Unexpected data columns')
            continue
        require(len(cells) == 7, 'Malformed data row')
        time, t1, t2, u, v, amp, sigma = cells
        values = [float(value) for value in [time, u, v, amp, sigma]]
        require(all(math.isfinite(value) for value in values), 'Nonfinite observation')
        time, u, v, amp, sigma = values
        require(0 <= time <= 1e4 and abs(u) <= 1e11 and abs(v) <= 1e11 and amp >= 0 and sigma > 0,
                'Observation outside declared numeric domain')
        require(t1 in STATIONS and t2 in STATIONS and t1 != t2, 'Unknown or identical stations')
        rows.append({'year': base.year, 'sourceFile': 'source/dat/' + path.name, 'sourceLine': line_number,
                     'timeHoursFromCampaignDate': time, 'utc': (base + datetime.timedelta(hours=time)).isoformat(),
                     'mjd': int(mjd.group(1)) + time / 24, 'station1': t1, 'station2': t2,
                     'uWavelengths': u, 'vWavelengths': v, 'baselineWavelengths': math.hypot(u, v),
                     'amplitudeJy': amp, 'sigmaJy': sigma})
    require(rows, 'No observations parsed')
    return {'path': 'source/dat/' + path.name, 'sha256': digest, 'rows': len(rows),
            'campaignDateUtc': base.isoformat(), 'campaignMjd': int(mjd.group(1)),
            'frequencyGHz': float(frequency.group(1))}, rows


def main():
    manifest = json.loads((HERE / 'source-manifest.json').read_text(encoding='utf-8'))
    datasets, rows = [], []
    for source in manifest['files']:
        if not source['path'].endswith('_amp.dat'):
            continue
        dataset, parsed = parse_file(HERE / source['path'], source['sha256'])
        datasets.append(dataset)
        rows.extend(parsed)
    output = {'schema': 'GFM-EHT-calibrated-amplitudes/1',
              'publisher': manifest['publisher'], 'release': manifest['release'], 'commit': manifest['commit'],
              'sourceManifest': 'source-manifest.json', 'license': 'ODC-PDDL for data, as preserved in source/LICENSE.txt',
              'units': {'uWavelengths': 'observing wavelengths', 'vWavelengths': 'observing wavelengths',
                        'amplitudeJy': 'Jy, debiased visibility amplitude', 'sigmaJy': 'Jy, publisher estimated RMS'},
              'measurement': 'Calibrated total-intensity visibility amplitudes, not brightness-image pixels or complex field phases',
              'stations': STATIONS, 'datasets': datasets, 'rowCount': len(rows), 'rows': rows,
              'parserSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    target = HERE / 'observations.json'
    target.write_text(json.dumps(output, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print(json.dumps({'rows': len(rows), 'datasets': datasets,
                      'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
