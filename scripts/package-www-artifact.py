"""Package only dist with a verified commit and SHA-256 for relay delivery."""
import hashlib
import os
from pathlib import Path
import re
import tarfile
import tempfile


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
    with tarfile.open(archive, 'w:gz') as output:
        # Dereference no links; store every regular file independently, even hardlinks.
        output.dereference = True
        output.add(dist, arcname='.')
    with archive.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    return digest


def main():
    destination = Path(os.environ['RUNNER_TEMP']) / 'xyvc-artifact'
    destination.mkdir(parents=True, exist_ok=True)
    archive = destination / 'release.tar.gz'
    digest = package_release(Path('dist'), archive, os.environ['GITHUB_SHA'])
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        output.write(f'path={archive}\nsha256={digest}\n')
    print(f'Packaged exact production SHA={os.environ["GITHUB_SHA"]}; SHA256={digest}')


if __name__ == '__main__':
    main()
