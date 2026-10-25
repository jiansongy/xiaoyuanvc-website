"""Offline tests: no cloud credentials, production writes, or external network calls."""
import hashlib
import importlib.util
import io
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('upload', ROOT / 'scripts/package-www-artifact.py')
upload = importlib.util.module_from_spec(spec)
spec.loader.exec_module(upload)
SHA = 'a' * 40


class ArtifactTests(unittest.TestCase):
    def make_dist(self, root, sha=SHA):
        dist = root / 'dist'
        for name, body in {
            '.well-known/deploy-sha.txt': sha + '\n',
            'index.html': '京ICP备2021017602号-1 京公网安备11010802035175号',
            'learn/crypto-vc/index.html': '加密创投教程',
            'learn/digital-startup/index.html': '数字创业教程',
        }.items():
            path = dist / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(body)
        return dist

    def receive(self, root, archive, digest, sha=SHA):
        # Exercise the real receiver with curl replaced by a local file copy.
        source = (ROOT / 'scripts/xyvc-sync.sh').read_text()
        helper = source[source.index('prepare_release_artifact() {'):source.index('WORK_DIR=')]
        env = dict(os.environ, WORK_DIR=str(root), FIXTURE=str(archive))
        shell = '''set -euo pipefail
curl() { cp "$FIXTURE" "$WORK_DIR/release.tar.gz"; }
''' + helper + '\nprepare_release_artifact https://example.test/release "$1" "$2" "$3"'
        return subprocess.run(['bash', '-c', shell, '_', digest, sha, str(root / 'received')],
                              env=env, text=True, capture_output=True)

    def test_complete_release_and_wrong_digest_or_commit(self):
        for failure in ('none', 'digest', 'commit'):
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                archive = root / 'fixture.tar.gz'
                digest = upload.package_release(self.make_dist(root), archive, SHA)
                result = self.receive(root, archive, '0' * 64 if failure == 'digest' else digest,
                                      'b' * 40 if failure == 'commit' else SHA)
                self.assertEqual(result.returncode == 0, failure == 'none', result.stderr)
                if failure == 'none':
                    self.assertEqual((root / 'received/.well-known/deploy-sha.txt').read_text().strip(), SHA)
                if failure == 'digest':
                    self.assertFalse((root / 'received').exists())

    def test_unsafe_archives_rejected_before_extraction(self):
        for kind in ('parent', 'absolute', 'symlink', 'hardlink'):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                archive = root / 'fixture.tar.gz'
                with tarfile.open(archive, 'w:gz') as output:
                    item = tarfile.TarInfo('../escaped' if kind == 'parent' else
                                           '/tmp/xyvc-escaped' if kind == 'absolute' else 'link')
                    if kind in ('symlink', 'hardlink'):
                        item.type = tarfile.SYMTYPE if kind == 'symlink' else tarfile.LNKTYPE
                        item.linkname = '/etc/passwd'
                        output.addfile(item)
                    else:
                        item.size = 1
                        output.addfile(item, io.BytesIO(b'x'))
                digest = hashlib.sha256(archive.read_bytes()).hexdigest()
                result = self.receive(root, archive, digest)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse((root / 'received').exists())

    def test_packer_rejects_links_and_wrong_commit(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            dist = self.make_dist(root)
            with self.assertRaises(ValueError):
                upload.package_release(dist, root / 'out.tar.gz', 'b' * 40)
            (dist / 'link').symlink_to('/etc/passwd')
            with self.assertRaises(ValueError):
                upload.package_release(dist, root / 'out.tar.gz', SHA)

    def test_receiver_failure_preserves_live_tree(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            live = root / 'www/xiaoyuanvc'
            live.mkdir(parents=True)
            (live / 'index.html').write_text('previous release')
            source = (ROOT / 'scripts/xyvc-sync.sh').read_text()
            source = source.replace('/var/www', str(root / 'www')).replace('/tmp/xyvc-sync.', str(root / 'xyvc-sync.'))
            source = source.replace('MIN_FREE_KB=1048576', 'MIN_FREE_KB=0')
            bin_dir = root / 'bin'
            bin_dir.mkdir()
            curl = bin_dir / 'curl'
            curl.write_text('#!/bin/sh\nexit 28\n')
            curl.chmod(0o755)
            env = dict(os.environ, PATH=str(bin_dir) + ':' + os.environ['PATH'],
                       XYVC_GITHUB_SHA=SHA, XYVC_ARTIFACT_URL='https://example.test/release',
                       XYVC_ARTIFACT_SHA256='0' * 64)
            result = subprocess.run(['bash', '-c', source], env=env, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual((live / 'index.html').read_text(), 'previous release')
            self.assertEqual(list((root / 'www').glob('.xyvc-*')), [])

    def test_successful_swap_and_smoke_failure_rollback(self):
        for smoke_failure in (False, True):
            with self.subTest(smoke_failure=smoke_failure), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                live = root / 'www/xiaoyuanvc'
                live.mkdir(parents=True)
                (live / 'index.html').write_text('previous release')
                archive = root / 'fixture.tar.gz'
                digest = upload.package_release(self.make_dist(root), archive, SHA)
                source = (ROOT / 'scripts/xyvc-sync.sh').read_text()
                source = source.replace('/var/www', str(root / 'www')).replace('/tmp/xyvc-sync.', str(root / 'xyvc-sync.'))
                source = source.replace('MIN_FREE_KB=1048576', 'MIN_FREE_KB=0')
                source = source.replace('\napply_www_redirects\n', '\n: # no production nginx in offline tests\n')
                bin_dir = root / 'bin'
                bin_dir.mkdir()
                curl = bin_dir / 'curl'
                curl.write_text('''#!/usr/bin/env bash
set -eu
output=''
for ((i=1; i<=$#; i++)); do
  if [[ "${!i}" == --output ]]; then j=$((i+1)); output="${!j}"; fi
done
if [[ " $* " == *example.test/release* ]]; then cp "$FIXTURE" "$output"; exit 0; fi
if [[ "$SMOKE_FAILURE" == true ]]; then printf 500; exit 0; fi
if [[ " $* " == *deployment-smoke-missing* ]]; then printf 404; exit 0; fi
if [[ " $* " == *resources/* ]]; then printf 301; exit 0; fi
printf '京ICP备2021017602号-1 加密创投教程 数字创业教程' > "$output"
printf 200
''')
                curl.chmod(0o755)
                env = dict(os.environ, PATH=str(bin_dir) + ':' + os.environ['PATH'], FIXTURE=str(archive),
                           SMOKE_FAILURE=str(smoke_failure).lower(), XYVC_GITHUB_SHA=SHA,
                           XYVC_ARTIFACT_URL='https://example.test/release', XYVC_ARTIFACT_SHA256=digest)
                result = subprocess.run(['bash', '-c', source], env=env, text=True, capture_output=True)
                self.assertEqual(result.returncode == 0, not smoke_failure, result.stderr)
                if smoke_failure:
                    self.assertEqual((live / 'index.html').read_text(), 'previous release')
                    self.assertIn('Previous release restored', result.stderr)
                else:
                    self.assertIn('DONE-SYNC', result.stdout)
                    self.assertEqual((live / '.well-known/deploy-sha.txt').read_text().strip(), SHA)


if __name__ == '__main__':
    unittest.main()
