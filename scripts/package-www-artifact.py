"""Package only dist with a verified commit and SHA-256 for relay delivery."""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import tarfile
import tempfile


def manifest_bytes(dist, sha):
    files = []
    for path in sorted(dist.rglob('*')):
        if path.is_file():
            with path.open('rb') as source:
                digest = hashlib.file_digest(source, 'sha256').hexdigest()
            files.append({'path': path.relative_to(dist).as_posix(),
                          'size': path.stat().st_size, 'sha256': digest})
    return json.dumps({'commit': sha, 'files': files}, ensure_ascii=False,
                      separators=(',', ':')).encode()


def package_release(dist, archive, sha):
    if not re.fullmatch(r'[0-9a-f]{40}', sha):
        raise ValueError('Expected a full commit SHA')
    if (dist / '.well-known/deploy-sha.txt').read_text().strip() != sha:
        raise ValueError('Build commit does not match GITHUB_SHA')
    for path in dist.rglob('*'):
        if path.is_symlink() or not (path.is_file() or path.is_dir()):
            raise ValueError('Release must contain only regular files and directories')
    for relative in ('index.html', 'learn/crypto-vc/index.html', 'learn/digital-startup/index.html'):
        if not (dist / relative).is_file() or (dist / relative).stat().st_size == 0:
            raise ValueError('Missing required production page: ' + relative)
    if (dist / '.xyvc-manifest.json').exists():
        raise ValueError('Reserved relay manifest filename already exists')
    with tarfile.open(archive, 'w:gz') as output:
        # Dereference no links; store every regular file independently, even hardlinks.
        output.dereference = True
        output.add(dist, arcname='.')
        manifest = manifest_bytes(dist, sha)
        info = tarfile.TarInfo('.xyvc-manifest.json')
        info.size = len(manifest)
        info.mode = 0o644
        output.addfile(info, io.BytesIO(manifest))
    with archive.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    return digest


def main():
    destination = Path(os.environ['RUNNER_TEMP']) / 'xyvc-artifact'
    destination.mkdir(parents=True, exist_ok=True)
    archive = destination / 'release.tar.gz'
    digest = package_release(Path('dist'), archive, os.environ['GITHUB_SHA'])
    manifest_digest = hashlib.sha256(manifest_bytes(Path('dist'), os.environ['GITHUB_SHA'])).hexdigest()
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        output.write(f'path={archive}\nsha256={digest}\nmanifest_sha256={manifest_digest}\n')
    print(f'Packaged exact production SHA={os.environ["GITHUB_SHA"]}; SHA256={digest}')


if __name__ == '__main__':
    main()
