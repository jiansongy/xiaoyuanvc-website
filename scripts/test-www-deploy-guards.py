"""Test download failure boundaries and the real workflow's commit selection."""
import os
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
