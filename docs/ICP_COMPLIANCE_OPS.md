# ICP Compliance Operations

This repo publishes two origins:

- `xiaoyuanvc.com`: Cloudflare Pages builds `main` with `build.sh`.
- `www.xiaoyuanvc.com`: Alibaba Cloud Simple Application Server in Beijing runs nginx from `/var/www/xiaoyuanvc`.

`www` must stay online on the Alibaba Cloud Beijing origin. Do not point the `www` DNS record back to Cloudflare Pages or another overseas origin.

## Automatic www Sync

`.github/workflows/deploy-www-origin.yml` runs on every push to `main` and can also be run manually from GitHub Actions.

It does not use SSH. Public TCP 22 can stay closed. The workflow calls Alibaba Cloud Simple Application Server Command Assistant `RunCommand`, then polls `DescribeInvocationResult` until the server-side command exits successfully.

The workflow downloads the versioned deployment script from the exact pushed commit and runs it with
`XYVC_GITHUB_SHA` set to that commit:

```bash
scripts/xyvc-sync.sh
```

The script snapshots the current server state, downloads that exact source archive, runs `bash build.sh`,
validates the complete `dist/` tree and filing numbers, then swaps `/var/www/xiaoyuanvc`. A failed
post-swap local smoke test restores the previous release.

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
