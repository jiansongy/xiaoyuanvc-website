"""Package dist only, upload to private OSS, and pass a short-lived URL to Actions."""
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
    import oss2
    sha = os.environ['GITHUB_SHA']
    region = os.environ['XYVC_OSS_REGION']
    bucket_name = os.environ['XYVC_OSS_BUCKET']
    run_id = os.environ['GITHUB_RUN_ID']
    attempt = os.environ['GITHUB_RUN_ATTEMPT']
    if not re.fullmatch(r'cn-[a-z0-9-]+', region):
        raise ValueError('Use a mainland China OSS region, for example cn-beijing')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,61}[a-z0-9]', bucket_name):
        raise ValueError('Invalid OSS bucket name')
    if not run_id.isdigit() or not attempt.isdigit():
        raise ValueError('Invalid workflow run identity')
    auth = oss2.AuthV4(os.environ['XYVC_OSS_ACCESS_KEY_ID'],
                       os.environ['XYVC_OSS_ACCESS_KEY_SECRET'])
    bucket = oss2.Bucket(auth, f'https://oss-{region}.aliyuncs.com', bucket_name,
                         region=region, connect_timeout=30)
    with tempfile.TemporaryDirectory() as folder:
        archive = Path(folder) / 'release.tar.gz'
        digest = package_release(Path('dist'), archive, sha)
        key = f'www-releases/{sha}/{run_id}-{attempt}.tar.gz'
        # Bucket must be private. Use a dedicated principal restricted to this prefix.
        bucket.put_object_from_file(key, str(archive), headers={
            'Content-Type': 'application/gzip', 'x-oss-forbid-overwrite': 'true'})
        url = bucket.sign_url('GET', key, 3600)
        print(f'::add-mask::{url}', flush=True)
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write(f'url={url}\nsha256={digest}\n')
        print(f'Uploaded prebuilt release SHA={sha}; SHA256={digest}')


if __name__ == '__main__':
    main()
