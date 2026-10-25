"""Offline checks for the Bangkok relay; never contact GitHub or either production host."""
import hashlib
import ast
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import tarfile
import unittest
from unittest.mock import patch
import urllib.error
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def module(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), ROOT / 'scripts' / (name + '.py'))
    item = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(item)
    return item


relay = module('relay-www-artifact')
receiver = module('receive-www-relay')
setup = module('setup-www-relay')
files_receiver = module('receive-www-files')


class RelayTests(unittest.TestCase):
    def test_caddy_change_is_scoped_idempotent_and_preserves_original_routes(self):
        before = 'approval.xiaoyuanvc.com {\n    reverse_proxy 127.0.0.1:8787\n}\n'
        after = setup.updated_config(before)
        self.assertEqual(setup.updated_config(after), after)
        self.assertEqual(after.replace(setup.BLOCK, ''), before)
        self.assertIn('remote_ip 39.106.61.204/32', after)
        self.assertIn('respond "Forbidden" 403', after)
        with self.assertRaises(ValueError):
            setup.updated_config('different.example {\n}\n')

    def test_zip_is_exact_and_digest_checked(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            archive = root / 'artifact.zip'
            payload = b'prebuilt-site'
            with zipfile.ZipFile(archive, 'w') as package:
                package.writestr('release.tar.gz', payload)
            destination = root / 'release.tar.gz'
            receiver.extract_release(archive, destination, hashlib.sha256(payload).hexdigest())
            self.assertEqual(destination.read_bytes(), payload)
            with self.assertRaises(ValueError):
                receiver.extract_release(archive, destination, '0' * 64)
            with zipfile.ZipFile(archive, 'w') as package:
                package.writestr('../release.tar.gz', payload)
            with self.assertRaises(ValueError):
                receiver.extract_release(archive, destination, '0' * 64)

    def test_download_does_not_forward_github_credentials(self):
        url = 'https://productionresults.blob.core.windows.net/temp?sig=temporary'
        opener = type('Opener', (), {'open': lambda _, req, timeout:
                      (_ for _ in ()).throw(urllib.error.HTTPError(req.full_url, 302, '', {'Location': url}, io.BytesIO()))})()
        with patch.object(relay.urllib.request, 'build_opener', return_value=opener):
            result = relay.signed_artifact_url('owner/site', '123', 'private-runner-token')
        self.assertEqual(result, url)
        data = {'url': result, 'sha': 'a' * 40, 'digest': 'b' * 64, 'run': '123-1'}
        command = relay.remote_command(data)
        self.assertNotIn('private-runner-token', command)
        self.assertTrue(receiver.valid_url(result))
        for bad in ('http://productionresults.blob.core.windows.net/file',
                    'https://github.com.evil.test/file', 'https://127.0.0.1/file',
                    'https://user:secret@productionresults.blob.core.windows.net/file'):
            self.assertFalse(receiver.valid_url(bad))

    def test_cleanup_cannot_target_arbitrary_path(self):
        data = {'sha': 'a' * 40, 'digest': 'b' * 64, 'run': '../other'}
        with self.assertRaises(ValueError):
            receiver.identity(data)
        data['run'] = '123-1'
        self.assertEqual(receiver.identity(data), '123-1-' + 'b' * 64 + '.tar.gz')

    def test_remote_scripts_remain_python36_compatible(self):
        for name in ('receive-www-relay.py', 'receive-www-files.py', 'setup-www-relay.py'):
            source = (ROOT / 'scripts' / name).read_text()
            ast.parse(source, feature_version=(3, 6))
            self.assertNotIn('capture_output=', source)
            self.assertNotIn('text=True', source)
            self.assertNotIn('missing_ok=', source)

    def test_incremental_release_reuses_only_matching_bytes_and_removes_deleted_files(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            live = root / 'live'
            live.mkdir()
            (live / 'same.txt').write_bytes(b'keep')
            (live / 'changed.txt').write_bytes(b'wrong')
            (live / 'deleted.txt').write_bytes(b'delete')
            payloads = {'same.txt': b'keep', 'changed.txt': b'fixed', 'new.txt': b'new'}
            manifest = {'commit': 'a' * 40, 'files': [
                {'path': name, 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                for name, data in payloads.items()]}
            downloaded = []
            def fetch(url, destination, max_size):
                name = url.rsplit('/', 1)[1]
                downloaded.append(name)
                destination.write_bytes(payloads[name])
            destination = root / 'next'
            files_receiver.assemble(manifest, 'a' * 40, live, destination, 'https://relay.test/run', fetch)
            self.assertEqual(set(downloaded), {'changed.txt', 'new.txt'})
            self.assertFalse((destination / 'deleted.txt').exists())
            self.assertEqual((live / 'changed.txt').read_bytes(), b'wrong')
            for name, data in payloads.items():
                self.assertEqual((destination / name).read_bytes(), data)

    def test_incremental_rejects_corruption_and_unsafe_manifest(self):
        entry = {'path': 'page.html', 'size': 3, 'sha256': hashlib.sha256(b'new').hexdigest()}
        manifest = {'commit': 'a' * 40, 'files': [entry]}
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            live = root / 'live'
            live.mkdir()
            (live / 'page.html').write_bytes(b'old')
            def corrupt(url, destination, limit):
                destination.write_bytes(b'bad')
            with self.assertRaises(ValueError):
                files_receiver.assemble(manifest, 'a' * 40, live, root / 'next', 'https://relay.test/run', corrupt)
            self.assertEqual((live / 'page.html').read_bytes(), b'old')
        for path in ('../escape', '/absolute', 'a/../../escape', 'a\\b'):
            with self.subTest(path=path), self.assertRaises(ValueError):
                files_receiver.entries({'commit': 'a' * 40, 'files': [dict(entry, path=path)]}, 'a' * 40)
        with self.assertRaises(ValueError):
            files_receiver.entries(manifest, 'b' * 40)

    def test_relay_unpacks_only_safe_tar_with_pinned_manifest(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            archive = root / 'site.tar.gz'
            manifest = b'{"commit":"test","files":[]}'
            with tarfile.open(archive, 'w:gz') as output:
                for name, payload in [('index.html', b'page'), ('.xyvc-manifest.json', manifest)]:
                    info = tarfile.TarInfo(name)
                    info.size = len(payload)
                    output.addfile(info, io.BytesIO(payload))
            receiver.publish_files(archive, root / 'published', hashlib.sha256(manifest).hexdigest())
            self.assertEqual((root / 'published/manifest.json').read_bytes(), manifest)
            self.assertEqual((root / 'published/files/index.html').read_bytes(), b'page')
            self.assertFalse((root / 'published/files/.xyvc-manifest.json').exists())

    def test_workflow_uses_bangkok_and_no_paid_oss_dependency(self):
        workflow = (ROOT / '.github/workflows/deploy-www-origin.yml').read_text()
        self.assertNotIn('XYVC_OSS', workflow)
        self.assertNotIn('oss2', workflow)
        self.assertIn('actions/upload-artifact@v7', workflow)
        self.assertIn('relay-www-artifact.py --cleanup', workflow)
        self.assertIn('actions/artifacts/$ARTIFACT_ID', workflow)
        self.assertIn('verify-delivery', workflow)


if __name__ == '__main__':
    unittest.main()
