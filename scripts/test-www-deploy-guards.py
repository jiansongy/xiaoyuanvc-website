"""Test download failure boundaries and the real workflow's commit selection."""
import os
import shutil
from pathlib import Path
import subprocess
import tempfile
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DeployGuardTests(unittest.TestCase):
    def test_download_bounds_and_failure(self):
        source = (ROOT / 'scripts/xyvc-sync.sh').read_text()
        helper = source[source.index('download_release_file() {'):source.index('WORK_DIR=')]
        for status in (0, 28):
            with self.subTest(status=status), tempfile.TemporaryDirectory() as folder:
                directory = Path(folder)
                curl = directory / 'curl'
                curl.write_text('#!/bin/bash\nprintf "%s\\n" "$@" > "$TEST_DIR/args"\nexit "$CURL_STATUS"\n')
                curl.chmod(0o755)
                env = dict(os.environ, PATH=folder + ':' + os.environ['PATH'],
                           TEST_DIR=folder, CURL_STATUS=str(status))
                result = subprocess.run(['bash', '-c', 'set -e\n' + helper +
                    '\ndownload_release_file "source archive" "https://example.test/archive" "$TEST_DIR/archive" 300\necho continued'],
                    env=env, text=True, capture_output=True)
                self.assertEqual(result.returncode, status)
                args = (directory / 'args').read_text().splitlines()
                for option, value in [('--connect-timeout', '20'), ('--max-time', '300'),
                                      ('--retry', '1'), ('--speed-time', '30'), ('--speed-limit', '1024')]:
                    self.assertEqual(args[args.index(option) + 1], value)
                self.assertIn('first_byte=%{time_starttransfer}', ' '.join(args))
                if status:
                    self.assertNotIn('continued', result.stdout)
                    self.assertIn('failed status=28', result.stderr)
                else:
                    self.assertIn('completed elapsed=', result.stdout)

    def test_persistent_git_cache_and_exact_export(self):
        source = (ROOT / 'scripts/xyvc-sync.sh').read_text()
        self.assertNotIn('codeload.github.com', source)
        helper = source[source.index('prepare_release_source() {'):source.index('WORK_DIR=')]
        with tempfile.TemporaryDirectory() as folder:
            directory = Path(folder)
            upstream = directory / 'upstream'
            upstream.mkdir()
            def git(*args):
                return subprocess.check_output(['git', '-C', str(upstream), *args], text=True).strip()
            git('init', '-q')
            git('config', 'user.name', 'test')
            git('config', 'user.email', 'test@example.test')
            (upstream / 'large.bin').write_bytes(os.urandom(2 * 1024 * 1024))
            (upstream / 'page.html').write_text('first version')
            git('add', '.')
            git('commit', '-qm', 'first')
            first = git('rev-parse', 'HEAD')
            env = dict(os.environ)
            if not shutil.which('flock'):
                # macOS lacks flock; GitHub Ubuntu exercises the real cache lock.
                stub = directory / 'flock'
                stub.write_text('#!/bin/bash\nexit 0\n')
                stub.chmod(0o755)
                env['PATH'] = folder + ':' + env['PATH']
            cache = directory / 'cache.git'
            def export(sha, output, url=None):
                return subprocess.run(['bash', '-c', 'set -euo pipefail\n' + helper +
                    '\nprepare_release_source "$1" "$2" "$3" "$4"', '_', str(cache),
                    url or upstream.as_uri(), sha, str(directory / output)], env=env,
                    text=True, capture_output=True)
            result = export(first, 'first')
            self.assertEqual(result.returncode, 0, result.stderr)
            before = sum(p.stat().st_size for p in cache.rglob('*') if p.is_file())
            (cache / 'not-source.txt').write_text('must not enter export')
            (upstream / 'page.html').write_text('second version')
            git('add', '.')
            git('commit', '-qm', 'second')
            second = git('rev-parse', 'HEAD')
            result = export(second, 'second')
            self.assertEqual(result.returncode, 0, result.stderr)
            after = sum(p.stat().st_size for p in cache.rglob('*') if p.is_file())
            self.assertLess(after - before, 128 * 1024, 'tiny change must reuse the large cached blob')
            self.assertEqual((directory / 'second/page.html').read_text(), 'second version')
            self.assertFalse((directory / 'second/not-source.txt').exists())
            self.assertFalse((directory / 'second/.git').exists())
            result = export(first, 'rollback', 'file:///nonexistent-upstream')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('no source network transfer', result.stdout)
            self.assertEqual((directory / 'rollback/page.html').read_text(), 'first version')
            result = export('f' * 40, 'failed', 'file:///nonexistent-upstream')
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((directory / 'failed').exists())
            self.assertEqual((directory / 'second/page.html').read_text(), 'second version')

    def test_workflow_skips_superseded_commit(self):
        workflow = (ROOT / '.github/workflows/check-dual-domain-sync.yml').read_text()
        self.assertIn('workflows: ["Deploy www origin"]', workflow)
        self.assertNotIn('  push:', workflow)
        self.assertIn("github.event.workflow_run.conclusion == 'success'", workflow)
        self.assertIn('github.event.workflow_run.head_sha || github.sha', workflow)
        self.assertIn("if: steps.release.outputs.current == 'true'", workflow)
        step = workflow.split('      - name: Select deployed commit', 1)[1].split('      - name: Wait', 1)[0]
        shell = textwrap.dedent(step.split('        run: |\n', 1)[1])
        for expected, current in [('a' * 40, 'a' * 40), ('a' * 40, 'b' * 40)]:
            with self.subTest(current=current), tempfile.TemporaryDirectory() as folder:
                directory = Path(folder)
                gh = directory / 'gh'
                gh.write_text('#!/bin/bash\nprintf "%s\\n" "$CURRENT_SHA"\n')
                gh.chmod(0o755)
                output = directory / 'output'
                env = dict(os.environ, PATH=folder + ':' + os.environ['PATH'],
                           EXPECTED_SHA=expected, CURRENT_SHA=current,
                           REPOSITORY='owner/site', GITHUB_OUTPUT=str(output))
                result = subprocess.run(['bash', '-c', shell], env=env, text=True, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(output.read_text().strip(), 'current=' + str(expected == current).lower())


if __name__ == '__main__':
    unittest.main()
