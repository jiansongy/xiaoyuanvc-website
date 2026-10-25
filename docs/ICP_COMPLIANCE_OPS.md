# ICP Compliance Operations

This repo publishes two origins:

- `xiaoyuanvc.com`: Cloudflare Pages builds `main` with `build.sh`.
- `www.xiaoyuanvc.com`: Alibaba Cloud Simple Application Server in Beijing runs nginx from `/var/www/xiaoyuanvc`.

`www` must stay online on the Alibaba Cloud Beijing origin. Do not point the `www` DNS record back to Cloudflare Pages or another overseas origin.

## Automatic www Sync

`.github/workflows/deploy-www-origin.yml` runs on every push to `main` and can also be run manually from GitHub Actions.

`Check dual-domain sync` starts after a successful `Deploy www origin` run, or by manual dispatch. It checks the deployed run's `head_sha`, and skips commits superseded on `main`; it no longer spends its 10-minute convergence window while www is still building.

GitHub Actions now runs `npm run build` with Node.js 22.23.1. It packages only the complete `dist/` tree and uploads it to a private OSS bucket in mainland China. Each object is named by commit SHA, run ID and run attempt, with overwrite protection. A one-hour signed HTTPS URL and the independently calculated SHA-256 digest are passed to Command Assistant. Signed URLs and encoded command payloads are masked in Actions logs.

The server only downloads and activates that prebuilt release. It does not fetch GitHub, install Node, run npm, or build pages. Public TCP 22 can stay closed; the existing Command Assistant submission, retry deduplication and polling mechanism is retained.

`scripts/xyvc-sync.sh` verifies the archive SHA-256, rejects unsafe archive paths and links, checks `.well-known/deploy-sha.txt` against the exact requested commit, and validates required pages and filing numbers before replacing `/var/www/xiaoyuanvc`. Failed download, hash, version or content checks leave the old live directory in place. A failed post-swap local smoke test restores the previous release. The public check also verifies the served SHA.

Downloads have a 20-second connect timeout, a 240-second per-attempt limit and one retry. The remote command remains limited to 900 seconds; local smoke requests have explicit timeouts. The job has 35 minutes to cover the GitHub build and remote operation. Certificate renewal remains independent of Node, build output and OSS configuration.

The former `/var/cache/xyvc-deploy/source.git` cache is no longer used. Do not delete it during migration; it can be removed separately after the new delivery path has been verified.

### One-time OSS setup (before merging/enabling this workflow)

The existing Command Assistant RAM policy is intentionally unchanged. Its permissions do not include OSS upload. Create or choose a **private** mainland-China bucket, preferably `cn-beijing`, block public access, and configure a lifecycle rule deleting `www-releases/` objects after one day. Do not make archives public or put long-lived cloud keys on the origin server. This adds OSS storage and transfer usage.

Add repository variables:

- `XYVC_OSS_BUCKET`: exact bucket name.
- `XYVC_OSS_REGION`: bucket region, for example `cn-beijing`.

Add separate repository secrets (never put credential values in commits, issues or chat):

- `XYVC_OSS_ACCESS_KEY_ID`
- `XYVC_OSS_ACCESS_KEY_SECRET`

The dedicated OSS RAM principal needs only `oss:PutObject` and `oss:GetObject` on `acs:oss:*:*:<BUCKET>/www-releases/*`. No bucket listing, bucket creation, ACL changes or object deletion permissions are required by the workflow. The existing `ALIYUN_*` Command Assistant secrets and region variable remain required.

If these values are absent the job fails before uploading or submitting a remote operation; it does not fall back to server-side source builds. Configure these values before merging this migration to `main`.

### Verification

Offline (no cloud calls or production writes):

```bash
python3 scripts/test-www-command-retry.py
python3 scripts/test-www-deploy-guards.py
python3 scripts/test-www-artifact.py
bash scripts/test-www-deployment.sh
npm run build
```

Tests cover artifact hashes and commit mismatch, unsafe paths and links, download failure preserving the live tree, successful activation, post-swap rollback, submission deduplication and superseded dual-domain checks. A production build is local output only; do not commit `dist/`.

After OSS configuration and an authorized deployment, require `DONE-SYNC SHA=<expected>` and public `.well-known/deploy-sha.txt` equal to that SHA. Also verify the apex/www pages and redirects described below. A branch PR or passing offline tests alone does not prove cloud upload/download permissions or end-to-end deployment.

The nginx root is currently a directory rather than a release symlink. Its same-filesystem swap uses two
renames and can create a sub-second gap between the old and new directory names. Converting the existing
production root to a symlink would widen the migration risk, so this workflow accepts that bounded gap and
immediately verifies the local and public origins.

Required GitHub repository secrets:

- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`
- `ALIYUN_INSTANCE_ID`

Optional GitHub repository variable:

- `ALIYUN_REGION_ID`, defaults to `cn-beijing` when unset.

Use a RAM user with the smallest practical policy:

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "swas-open:RunCommand",
        "swas-open:DescribeInvocationResult"
      ],
      "Resource": "*"
    }
  ]
}
```

Current setup:

- RAM user: `xyvc-github-www-deploy`
- Custom policy: `XYVCGitHubWWWDeployPolicy`
- GitHub secrets configured: `ALIYUN_ACCESS_KEY_ID`, `ALIYUN_ACCESS_KEY_SECRET`, `ALIYUN_INSTANCE_ID`
- GitHub variable configured: `ALIYUN_REGION_ID=cn-beijing`

Run the workflow manually once after pushing this workflow before relying on push-triggered deploys.

Official API references:

- [RunCommand](https://help.aliyun.com/zh/simple-application-server/developer-reference/api-swas-open-2020-06-01-runcommand)
- [DescribeInvocationResult](https://www.alibabacloud.com/help/zh/simple-application-server/developer-reference/api-swas-open-2020-06-01-describeinvocationresult)

## External Monitors

Keep a third-party monitor for `www` because GitHub Actions only proves deploys, not ongoing uptime.

This repo also has `.github/workflows/check-www-origin.yml`, a daily GitHub Actions check for DNS, HTTPS 200, filing numbers, and certificate expiry. Treat it as a backup alarm, not the only monitor.

Recommended checks:

- HTTPS URL monitor: `https://www.xiaoyuanvc.com/`, expect HTTP 200.
- Course monitor: `https://www.xiaoyuanvc.com/learn/crypto-vc/`, expect HTTP 200 and `加密创投教程`.
- Course monitor: `https://www.xiaoyuanvc.com/learn/digital-startup/`, expect HTTP 200 and `数字创业教程`.
- Keyword monitor: response body contains `京ICP备2021017602号-1`.
- Certificate monitor: alert at least 14 days before expiry.

Current UptimeRobot monitors:

- `803386136`: HTTP/S monitor for `https://www.xiaoyuanvc.com/`, 5-minute interval, email alert to `jiansongy@gmail.com`.
- `803386144`: keyword monitor for `京ICP备2021017602号-1`, alerts when the keyword is missing.
- `803386146`: keyword monitor for `京公网安备11010802035175号`, alerts when the keyword is missing.

UptimeRobot SSL and domain expiry checks are locked behind a paid plan on the current account. The GitHub daily workflow remains the no-cost certificate expiry check.

Existing certbot renewal remains the first line of defense. The monitor is only the alarm.

If the certificate warning fires, run **Deploy www origin** manually and select
`renew-certificate`. It uses the existing Alibaba Cloud Command Assistant permissions to run
the fixed `certbot renew` command and reload nginx only when a certificate was renewed; it does
not publish site files. Check that the workflow prints the new certificate expiry before closing
the alert.

## www nginx Redirects (automated)

`_redirects` is honored by the Cloudflare Pages origin (`xiaoyuanvc.com`) but **not** by the `www`
Alibaba Cloud nginx origin. `scripts/xyvc-sync.sh` therefore applies the `www` redirects directly
to the nginx server block on every deploy (idempotent, and it reverts on `nginx -t` failure so it
never leaves the origin down).

The sync script:
- Locates the nginx config that declares `server_name www.xiaoyuanvc.com`.
- Writes `/etc/nginx/xyvc-www-redirects.conf` (a `location`-only include) and injects
  `include /etc/nginx/xyvc-www-redirects.conf;` into that `server` block.
- Runs `nginx -t`; on success it reloads nginx, on failure it rolls the include back and keeps the
  origin serving the previous config.
- Logs `[nginx-redirects] ...` lines so the deploy output shows whether the rules were applied.

Do not hand-edit `/etc/nginx/xyvc-www-redirects.conf` — the sync script rewrites it each deploy.

Reference snippet (what the sync script writes):

```nginx
location = /resources/ai-ready-check              { return 301 /resources/; }
location = /resources/ai-ready-check.html         { return 301 /resources/; }
location = /resources/ai-employee-interview-guide { return 301 /resources/; }
location = /resources/ai-employee-interview-guide.html { return 301 /resources/; }
location = /resources/china-hackathon-calendar { return 301 /resources/china-hackathon-statistics; }
```

Verify after a deploy:

```bash
curl --noproxy '*' -sI https://www.xiaoyuanvc.com/resources/ai-ready-check | grep -i '^location'
curl --noproxy '*' -sI https://www.xiaoyuanvc.com/resources/ai-employee-interview-guide | grep -i '^location'
```

Expected: each returns `Location: https://www.xiaoyuanvc.com/resources/` with HTTP 301.

## Manual Verification

```bash
dig +short www.xiaoyuanvc.com A @223.5.5.5
curl --noproxy '*' -sI https://www.xiaoyuanvc.com/ | grep -i '^location'
curl --noproxy '*' -s https://www.xiaoyuanvc.com/ | grep -oE '京ICP备2021017602号-1|京公网安备11010802035175号'
curl --noproxy '*' -fsS https://www.xiaoyuanvc.com/learn/crypto-vc/ | grep -F '加密创投教程'
curl --noproxy '*' -fsS https://www.xiaoyuanvc.com/learn/digital-startup/ | grep -F '数字创业教程'
echo | openssl s_client -connect www.xiaoyuanvc.com:443 -servername www.xiaoyuanvc.com 2>/dev/null | openssl x509 -noout -issuer -dates
```

Expected:

- `www` resolves to `39.106.61.204`.
- No cross-host redirect from `https://www.xiaoyuanvc.com/`.
- Both `/learn/` course entry points return HTTP 200 with their expected page markers.
- Both ICP and public security filing numbers are present.
- Certificate issuer is Let's Encrypt and expiry is not near.
