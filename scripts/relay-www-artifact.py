"""Stage a GitHub Actions build on the existing Bangkok relay. No GitHub token leaves CI."""
import base64
import gzip
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request


def receiver_module():
    spec = importlib.util.spec_from_file_location('receiver', Path(__file__).with_name('receive-www-relay.py'))
    item = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(item)
    return item


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def signed_artifact_url(repository, artifact_id, token):
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository) or not artifact_id.isdigit():
        raise ValueError('Invalid GitHub artifact identity')
    request = urllib.request.Request(
        f'https://api.github.com/repos/{repository}/actions/artifacts/{artifact_id}/zip',
        headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2022-11-28'})
    try:
        urllib.request.build_opener(NoRedirect()).open(request, timeout=30)
    except urllib.error.HTTPError as result:
        if result.code == 302:
            receiver = receiver_module()
            url = result.headers['Location']
            if not receiver.valid_url(url):
                raise ValueError('Unexpected artifact storage redirect')
            return url
        raise RuntimeError('GitHub artifact redirect failed: HTTP ' + str(result.code)) from None
    raise RuntimeError('GitHub did not return an artifact download redirect')


def remote_command(data):
    source = Path(__file__).with_name('receive-www-relay.py').read_bytes()
    packed = base64.b64encode(gzip.compress(source)).decode()
    arguments = base64.b64encode(json.dumps(data).encode()).decode()
    # Only scoped signed URL, identifiers and code cross to Bangkok, never GH_TOKEN.
    return ('python3 -c ' + "'import base64,gzip,sys; "
            f'exec(compile(gzip.decompress(base64.b64decode("{packed}")),"relay","exec"))' +
            "' '" + arguments + "'")


def aliyun(*arguments):
    result = subprocess.run(['aliyun', 'swas-open', *arguments], capture_output=True, text=True, timeout=40)
    if result.returncode:
        raise RuntimeError('Command Assistant API request failed')
    return json.loads(result.stdout)


def execute(data):
    region = os.environ['XYVC_RELAY_REGION']
    instance = os.environ['XYVC_RELAY_INSTANCE_ID']
    args = ['--region', region, '--biz-region-id', region, '--instance-id', instance]
    command = remote_command(data)
    # Mask the encoded argument as well as its raw URL in provider error messages.
    print('::add-mask::' + base64.b64encode(json.dumps(data).encode()).decode(), flush=True)
    print('::add-mask::' + base64.b64encode(command.encode()).decode(), flush=True)
    result = subprocess.run(['bash', 'scripts/submit-www-command.sh', *args,
                             '--name', 'xyvc-relay-' + data['run'], '--type', 'RunShellScript',
                             '--working-user', 'root', '--timeout', '600', '--command-content', command],
                            capture_output=True, text=True, timeout=180)
    if result.returncode:
        raise RuntimeError('Relay command submission failed')
    invoke_id = json.loads(result.stdout)['InvokeId']
    for attempt in range(90):
        try:
            response = aliyun('describe-invocation-result', *args, '--invoke-id', invoke_id)
        except (RuntimeError, subprocess.TimeoutExpired, json.JSONDecodeError):
            if attempt == 89:
                raise
            time.sleep(5)
            continue
        record = response.get('InvocationResult', {})
        status = record.get('InvocationStatus', '')
        if status == 'Success' and str(record.get('ExitCode')) == '0':
            print(base64.b64decode(record.get('Output', '')).decode(errors='replace')[-3000:])
            return
        if status not in ('', 'Pending', 'Running') and record.get('InvokeRecordStatus') != 'Running':
            print(base64.b64decode(record.get('Output', '')).decode(errors='replace')[-3000:])
            raise RuntimeError('Relay operation failed: ' + status)
        time.sleep(8)
    raise RuntimeError('Timed out waiting for Bangkok relay')


def main():
    data = {'sha': os.environ['GITHUB_SHA'], 'digest': os.environ['ARTIFACT_SHA256'],
            'run': os.environ['GITHUB_RUN_ID'] + '-' + os.environ['GITHUB_RUN_ATTEMPT'],
            'manifest_digest': os.environ['MANIFEST_SHA256']}
    receiver = receiver_module()
    filename = receiver.identity(data)
    if '--cleanup' in sys.argv:
        data['cleanup'] = True
        execute(data)
        return
    for attempt in range(2):
        data['url'] = signed_artifact_url(os.environ['GITHUB_REPOSITORY'], os.environ['ARTIFACT_ID'], os.environ['GH_TOKEN'])
        print('::add-mask::' + data['url'], flush=True)
        try:
            execute(data)
            break
        except RuntimeError:
            if attempt:
                raise
            print('Refreshing the short-lived artifact URL before retrying the relay.')
    url = os.environ['XYVC_RELAY_BASE_URL'].rstrip('/') + '/' + filename[:-7] + '/manifest.json'
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        output.write('url=' + url + '\n')


if __name__ == '__main__':
    main()
