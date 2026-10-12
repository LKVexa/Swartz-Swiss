#!/usr/bin/env python3
"""Build the source-bound native web device and run its ABI regression suite."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'engine/df_medium/source'
WINDOWS_DLL = ROOT/'engine/df_medium/native/win-x64/dfmedium-ja21-web.dll'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def compiler_path(requested):
    candidates = [requested] if requested else []
    if not requested:
        if os.name == 'nt':
            candidates += [r'C:\msys64\ucrt64\bin\gcc.exe', r'C:\msys64\mingw64\bin\gcc.exe']
        candidates += ['gcc', 'cc']
    for candidate in candidates:
        found = shutil.which(candidate)
        if found:
            return found
    raise RuntimeError('No C compiler found; pass --compiler with a MinGW x64 GCC path on Windows.')


def atomic_json(path, value):
    fd, name = tempfile.mkstemp(prefix=path.name+'.', suffix='.tmp', dir=path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as stream:
            json.dump(value, stream, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--compiler', help='GCC-compatible native C compiler')
    parser.add_argument('--output', type=Path, help='Optional alternate library output (does not change release provenance)')
    args = parser.parse_args()
    compiler = compiler_path(args.compiler)
    machine = subprocess.check_output([compiler, '-dumpmachine'], text=True).strip()
    if os.name == 'nt' and not machine.startswith('x86_64-w64-mingw32'):
        raise RuntimeError('The Windows runtime requires a MinGW x64 compiler, found: '+machine)
    if os.name != 'nt' and args.output is None:
        raise RuntimeError('On POSIX, pass --output for a local shared-library test build.')
    output = (args.output or WINDOWS_DLL).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='ja21-build-', dir=output.parent) as temporary:
        library = Path(temporary)/output.name
        command = [compiler, '-std=c11', '-O2', '-shared', '-static-libgcc']
        if os.name == 'nt':
            command += ['-Wl,--no-insert-timestamp,--dynamicbase,--nxcompat,--high-entropy-va,--image-base,0x180000000']
        else:
            command += ['-fPIC']
        command += ['-o', str(library), str(SOURCE/'ja21_webengine.c'), str(SOURCE/'brvm.c'),
                    str(SOURCE/'brtrust.c'), '-I', str(SOURCE)]
        subprocess.run(command, check=True, timeout=180)
        environment = dict(os.environ, PYTHONDONTWRITEBYTECODE='1', JA21_NATIVE_TEST_DLL=str(library))
        # Test in a child process so Windows releases the DLL before it is moved.
        subprocess.run([os.sys.executable, '-B', '-m', 'unittest', 'discover', '-s', 'tests',
                        '-p', 'test_native_engine_runtime.py', '-v'], cwd=ROOT, env=environment,
                       check=True, timeout=120)
        os.replace(library, output)
    if output == WINDOWS_DLL:
        path = ROOT/'engine/df_medium/ENGINE_PROVENANCE.json'
        provenance = json.loads(path.read_text(encoding='utf-8'))
        provenance['version'] = '8.1.0'
        provenance['windows_dll_sha256'] = sha(output)
        provenance['package_version'] = (ROOT/'VERSION').read_text(encoding='utf-8').strip()
        provenance['native_engine_change'] = (
            'Native Windows rebuild: character-reference repair applied; external CSS retained across '
            'commits; bounded URL resolution and ingress; hidden/raw-text subtree suppression; '
            'malformed document and layout bounds hardening.'
        )
        provenance['native_selftest'] = 'PASS: dfweb_selftest + native ABI behavioral regression suite on Windows x64'
        provenance['staged_engine_patch']['status'] = 'Applied to active source and rebuilt Windows DLL; historical patch retained for provenance'
        provenance['native_build'] = {
            'compiler': subprocess.check_output([compiler, '--version'], text=True).splitlines()[0],
            'target': machine,
            'flags': ['-std=c11', '-O2', '-shared', '-static-libgcc',
                      '-Wl,--no-insert-timestamp,--dynamicbase,--nxcompat,--high-entropy-va,--image-base,0x180000000'],
            'sources': {name: sha(SOURCE/name) for name in
                        ('ja21_webengine.c', 'ja21_webengine.h', 'brvm.c', 'brvm.h', 'brtrust.c', 'brtrust.h')},
            'rebuild_command': 'python -B tools/build_native_engine.py',
            'reproducibility': 'PE timestamp omitted and preferred image base fixed; source hashes and compiler version recorded',
        }
        atomic_json(path, provenance)
    print('Native engine build and regression suite PASS:', output)
    print('SHA-256:', sha(output))


if __name__ == '__main__':
    main()
