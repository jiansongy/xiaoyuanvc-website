"""Runs on Bangkok via Command Assistant; receives a temporary signed artifact URL."""
import base64
import fcntl
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tempfile
import tarfile
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
    if 'manifest_digest' in data and not re.fullmatch(r'[0-9a-f]{64}', data['manifest_digest']):
        raise ValueError('Invalid manifest digest')
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


def publish_files(archive, candidate, manifest_digest):
    candidate.mkdir(mode=0o755)
    files = candidate / 'files'
    files.mkdir(mode=0o755)
    total = 0
    with tarfile.open(str(archive), 'r:gz') as source:
        members = source.getmembers()
        for member in members:
            path = PurePosixPath(member.name)
            if member.name.startswith('/') or '..' in path.parts or not (member.isfile() or member.isdir()):
                raise ValueError('Unsafe release tar member')
            total += member.size
        if total > LIMIT:
            raise ValueError('Expanded release too large')
        for member in members:
            if member.isdir():
                continue
            target = files / member.name
            target.parent.mkdir(parents=True, exist_ok=True)
            with source.extractfile(member) as incoming, target.open('wb') as output:
                shutil.copyfileobj(incoming, output, 1024 * 1024)
            target.chmod(0o644)
    manifest = files / '.xyvc-manifest.json'
    if hashlib.sha256(manifest.read_bytes()).hexdigest() != manifest_digest:
        raise ValueError('Relay manifest SHA-256 mismatch')
    manifest.replace(candidate / 'manifest.json')


def main():
    data = json.loads(base64.b64decode(sys.argv[1]))
    filename = identity(data)
    if not ROOT.is_dir():
        raise ValueError('Run setup-www-relay.py before deploying')
    with (ROOT / '.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        destination = ROOT / filename[:-7]
        if data.get('cleanup'):
            if destination.is_dir():
                shutil.rmtree(str(destination))
            print('RELAY-CLEANED')
            return
        if not valid_url(data['url']):
            raise ValueError('Expected a signed GitHub artifact storage HTTPS URL')
        # Remove only recognized, expired relay trees, never app or certificate data.
        for old in ROOT.iterdir():
            if re.fullmatch(r'[0-9]+-[0-9]+-[0-9a-f]{64}', old.name) and old.is_dir():
                if old.stat().st_mtime < time.time() - 86400:
                    shutil.rmtree(str(old))
        cached = destination / 'manifest.json'
        if cached.is_file() and hashlib.sha256(cached.read_bytes()).hexdigest() == data['manifest_digest']:
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
            candidate = Path(folder) / 'published'
            publish_files(staged, candidate, data['manifest_digest'])
            candidate.replace(destination)
        print('RELAY-READY SHA=' + data['sha'])


if __name__ == '__main__':
    main()
