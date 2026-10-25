"""Runs on Bangkok via Command Assistant; receives a temporary signed artifact URL."""
import base64
import fcntl
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlsplit
import zipfile

ROOT = Path('/var/lib/xyvc-daily-caddy/config/xyvc-releases')
LIMIT = 512 * 1024 * 1024


def identity(data):
    if not re.fullmatch(r'[0-9a-f]{40}', data['sha']):
        raise ValueError('Invalid commit')
    if not re.fullmatch(r'[0-9a-f]{64}', data['digest']):
        raise ValueError('Invalid digest')
    if not re.fullmatch(r'[0-9]+-[0-9]+', data['run']):
        raise ValueError('Invalid run identity')
    return data['run'] + '-' + data['digest'] + '.tar.gz'


def valid_url(url):
    parsed = urlsplit(url)
    host = parsed.hostname or ''
    return (parsed.scheme == 'https' and not parsed.username and not parsed.password
            and parsed.port in (None, 443) and not parsed.fragment
            and (host.endswith('.blob.core.windows.net')
                 or host.endswith('.actions.githubusercontent.com')))


def extract_release(archive, destination, digest):
    with zipfile.ZipFile(archive) as package:
        if package.namelist() != ['release.tar.gz']:
            raise ValueError('Artifact ZIP must contain only release.tar.gz')
        info = package.getinfo('release.tar.gz')
        if info.file_size > LIMIT:
            raise ValueError('Artifact exceeds size limit')
        total = 0
        result = hashlib.sha256()
        with package.open(info) as source, destination.open('wb') as output:
            while True:
                block = source.read(1024 * 1024)
                if not block:
                    break
                total += len(block)
                if total > LIMIT:
                    raise ValueError('Artifact exceeds size limit')
                result.update(block)
                output.write(block)
        if result.hexdigest() != digest:
            raise ValueError('Artifact SHA-256 mismatch')


def main():
    data = json.loads(base64.b64decode(sys.argv[1]))
    filename = identity(data)
    if not ROOT.is_dir():
        raise ValueError('Run setup-www-relay.py before deploying')
    with (ROOT / '.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        destination = ROOT / filename
        if data.get('cleanup'):
            if destination.exists():
                destination.unlink()
            print('RELAY-CLEANED')
            return
        if not valid_url(data['url']):
            raise ValueError('Expected a signed GitHub artifact storage HTTPS URL')
        # Remove only our recognized, expired temporary release files.
        for old in ROOT.iterdir():
            if re.fullmatch(r'[0-9]+-[0-9]+-[0-9a-f]{64}\.tar\.gz', old.name):
                if old.stat().st_mtime < time.time() - 86400:
                    old.unlink()
        if destination.is_file():
            with destination.open('rb') as source:
                result = hashlib.sha256()
                for block in iter(lambda: source.read(1024 * 1024), b''):
                    result.update(block)
                if result.hexdigest() == data['digest']:
                    print('RELAY-READY SHA=' + data['sha'])
                    return
        if shutil.disk_usage(ROOT).free < 1024 ** 3:
            raise ValueError('Relay needs at least 1 GiB free space')
        with tempfile.TemporaryDirectory(prefix='.incoming-', dir=ROOT) as folder:
            archive = Path(folder) / 'github.zip'
            result = subprocess.run(['curl', '-q', '--fail', '--silent', '--show-error',
                                     '--location', '--proto', '=https', '--proto-redir', '=https',
                                     '--connect-timeout', '15', '--max-time', '480',
                                     '--max-filesize', str(LIMIT + 1024 * 1024),
                                     '--output', str(archive), data['url']],
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=490)
            if result.returncode:
                # Do not log curl's stderr: it can contain the signed URL.
                raise RuntimeError('Artifact download failed, curl status=' + str(result.returncode))
            staged = Path(folder) / 'verified.tar.gz'
            extract_release(archive, staged, data['digest'])
            staged.chmod(0o644)
            staged.replace(destination)
        print('RELAY-READY SHA=' + data['sha'])


if __name__ == '__main__':
    main()
