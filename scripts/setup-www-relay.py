"""One-time Bangkok setup: add a Beijing-only static path to the existing Caddy site."""
from pathlib import Path
import subprocess

CONFIG = Path('/opt/xyvc-daily-caddy/Caddyfile')
ROOT = Path('/var/lib/xyvc-daily-caddy/config/xyvc-releases')
CONTAINER = 'xyvc-daily-caddy'
SITE = 'approval.xiaoyuanvc.com {\n'
MARKER = '# XYVC prebuilt release relay'
BLOCK = '''    # XYVC prebuilt release relay
    handle /_xyvc-release/* {
        @beijing remote_ip 39.106.61.204/32
        handle @beijing {
            uri strip_prefix /_xyvc-release
            root * /config/xyvc-releases
            file_server
        }
        handle {
            respond "Forbidden" 403
        }
    }
'''


def updated_config(original):
    if MARKER in original:
        if BLOCK not in original:
            raise ValueError('Relay config differs from the reviewed block; inspect manually')
        return original
    if original.count(SITE) != 1 or '/_xyvc-release' in original:
        raise ValueError('Unexpected Caddy site structure or conflicting path')
    return original.replace(SITE, SITE + BLOCK, 1)


def main():
    original = CONFIG.read_text()
    candidate = updated_config(original)
    subprocess.run(['docker', 'exec', '-i', CONTAINER, 'caddy', 'validate',
                    '--config', '/dev/stdin', '--adapter', 'caddyfile'],
                   input=candidate, universal_newlines=True, check=True)
    ROOT.mkdir(mode=0o755, parents=True, exist_ok=True)
    (ROOT / 'health.txt').write_text('xyvc-relay-ready\n')
    if candidate != original:
        backup = CONFIG.with_name('Caddyfile.before-xyvc-relay')
        if backup.exists():
            raise ValueError('Existing pre-migration backup; inspect before changing config')
        backup.write_text(original)
        backup.chmod(0o600)
        # Write in place: the container bind-mount points at this file inode.
        CONFIG.write_text(candidate)
        try:
            subprocess.run(['docker', 'exec', CONTAINER, 'caddy', 'reload',
                            '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile'], check=True)
        except BaseException:
            CONFIG.write_text(original)
            subprocess.run(['docker', 'exec', CONTAINER, 'caddy', 'reload',
                            '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile'], check=False)
            raise
    print('RELAY-READY https://approval.xiaoyuanvc.com/_xyvc-release/health.txt')
    print('Only Beijing origin 39.106.61.204 can read this path; other routes unchanged.')


if __name__ == '__main__':
    main()
