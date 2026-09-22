"""Exercise transport retries and the actual workflow's remote deduplication wrapper."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[1]


class CommandRetryTests(unittest.TestCase):
    def test_submission_outcomes(self):
        for mode, expected_status, expected_calls in [
            ('recover', 0, 2), ('reset', 1, 3), ('denied', 1, 1)
        ]:
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as folder:
                directory = Path(folder)
                cli = directory / 'aliyun'
                cli.write_text('''#!/bin/bash
n=$(cat "$TEST_DIR/count" 2>/dev/null || echo 0)
n=$((n+1))
echo "$n" > "$TEST_DIR/count"
if [[ "$MODE" == denied ]]; then
  echo 'Forbidden.RAM: access denied' >&2; exit 1
fi
if [[ "$MODE" == reset || "$n" == 1 ]]; then
  echo 'read: connection reset by peer' >&2; exit 1
fi
echo '{"InvokeId":"test-invocation"}'
''')
                cli.chmod(0o755)
                sleeper = directory / 'sleep'
                sleeper.write_text('#!/bin/sh\nexit 0\n')
                sleeper.chmod(0o755)
                env = dict(os.environ, PATH=f'{folder}:{os.environ["PATH"]}',
                           TEST_DIR=folder, MODE=mode)
                result = subprocess.run(['bash', str(ROOT / 'scripts/submit-www-command.sh')],
                                        env=env, capture_output=True, text=True)
                self.assertEqual(result.returncode, expected_status, result.stderr)
                self.assertEqual(int((directory / 'count').read_text()), expected_calls)
                if expected_status == 0:
                    self.assertIn('test-invocation', result.stdout)

    @unittest.skipUnless(shutil.which('flock'), 'flock required; exercised on GitHub Ubuntu')
    def test_duplicate_submissions_execute_once(self):
        workflow = (ROOT / '.github/workflows/deploy-www-origin.yml').read_text()
        start = workflow.index('          operation_b64=')
        end = workflow.index('          response="$(bash scripts/submit-www-command.sh', start)
        generator = textwrap.dedent(workflow[start:end])
        for status in (0, 7):
            with self.subTest(status=status), tempfile.TemporaryDirectory() as folder:
                generator_local = generator.replace('/var/lib/xyvc-operations', folder + '/state')
                env = dict(os.environ, GITHUB_RUN_ID='123', GITHUB_RUN_ATTEMPT='1',
                           COMMAND_CONTENT=f'echo executed >> "{folder}/calls"; sleep 0.2; exit {status}')
                generated = subprocess.check_output(
                    ['bash', '-c', generator_local + '\nprintf "%s" "$COMMAND_CONTENT"'],
                    env=env, text=True)
                processes = [subprocess.Popen(['bash', '-c', generated],
                                              stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                             for _ in range(2)]
                for process in processes:
                    _, error = process.communicate(timeout=10)
                    self.assertEqual(process.returncode, status, error)
                self.assertEqual((Path(folder) / 'calls').read_text(), 'executed\n')


if __name__ == '__main__':
    unittest.main()
