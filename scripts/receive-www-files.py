"""Assemble an exact release from verified local files plus changed relay files. Python 3.6+."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
from urllib.parse import quote, urlsplit

LIMIT = 512 * 1024 * 1024


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def entries(manifest, sha):
    if manifest.get('commit') != sha:
        raise ValueError('Manifest commit does not match requested release')
    files = manifest.get('files')
    if not isinstance(files, list) or len(files) > 10000:
        raise ValueError('Invalid manifest file list')
    seen = set()
    total = 0
    for entry in files:
        path = entry['path']
        parts = PurePosixPath(path).parts
        if (not parts or path.startswith('/') or '..' in parts or '\\' in path
                or '\n' in path or '\r' in path or '\x00' in path
                or path != PurePosixPath(path).as_posix() or path in seen):
            raise ValueError('Unsafe or duplicate manifest path')
        seen.add(path)
        size = entry['size']
        if not isinstance(size, int) or size < 0 or size > LIMIT:
            raise ValueError('Invalid file size')
        if not re.fullmatch(r'[0-9a-f]{64}', entry['sha256']):
            raise ValueError('Invalid file digest')
        total += size
    if total > LIMIT:
        raise ValueError('Release exceeds size limit')
    for path in seen:
        if any(str(parent) in seen for parent in PurePosixPath(path).parents if str(parent) != '.'):
            raise ValueError('File/directory path conflict')
    return files


def download(url, destination, max_size):
    result = subprocess.run(['curl', '-q', '--noproxy', '*', '--fail', '--silent', '--show-error',
                             '--proto', '=https', '--connect-timeout', '15', '--max-time', '150',
                             '--retry', '1', '--retry-delay', '3', '--retry-max-time', '310',
                             '--max-filesize', str(max(1, max_size)),
                             '--output', str(destination), url],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=320)
    if result.returncode:
        raise RuntimeError('Relay file download failed: curl status=' + str(result.returncode))
    if destination.stat().st_size > max_size:
        raise ValueError('File exceeds expected size')


def assemble(manifest, sha, live, destination, base_url, fetch=download):
    files = entries(manifest, sha)
    destination.mkdir(parents=True, exist_ok=False)
    changed = []
    reused = 0
    for entry in files:
        old = live / entry['path']
        new = destination / entry['path']
        new.parent.mkdir(parents=True, exist_ok=True)
        # Never follow a symlink out of the live tree when reusing a cached file.
        safe = os.path.commonpath([str(live.resolve()), str(old.resolve())]) == str(live.resolve())
        if safe and old.is_file() and not old.is_symlink() and old.stat().st_size == entry['size'] and digest(old) == entry['sha256']:
            shutil.copyfile(str(old), str(new))
            new.chmod(0o644)
            reused += 1
        else:
            changed.append(entry)

    def receive(entry):
        path = destination / entry['path']
        fetch(base_url.rstrip('/') + '/files/' + quote(entry['path'], safe='/'), path, entry['size'])
        if path.stat().st_size != entry['size'] or digest(path) != entry['sha256']:
            raise ValueError('Downloaded file digest mismatch: ' + entry['path'])
        path.chmod(0o644)

    with ThreadPoolExecutor(max_workers=12) as pool:
        list(pool.map(receive, changed))
    print('VERIFIED-FILES reused={} downloaded={} bytes={}'.format(
        reused, len(changed), sum(item['size'] for item in changed)))


def main():
    url, expected_digest, sha, live, destination = sys.argv[1:]
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError('Expected a plain HTTPS relay manifest URL')
    if not re.fullmatch(r'[0-9a-f]{64}', expected_digest):
        raise ValueError('Invalid manifest digest')
    path = Path(destination).parent / 'manifest.json'
    download(url, path, 4 * 1024 * 1024)
    if digest(path) != expected_digest:
        raise ValueError('Manifest SHA-256 mismatch')
    assemble(json.loads(path.read_text()), sha, Path(live), Path(destination), url.rsplit('/', 1)[0])


if __name__ == '__main__':
    main()
