# Security Policy

## Scope

This repository publishes the public website for `https://xiaoyuanvc.com/`.

## Reporting a Vulnerability

Please report suspected security issues through the public contact channel on the website:

- `https://xiaoyuanvc.com/#contact`

Include:

- A short description of the issue
- Steps to reproduce
- The affected URL
- Any screenshots or proof of concept that help validate impact

## Deployment Notes

The current GitHub Pages deployment cannot attach important response headers such as:

- `Strict-Transport-Security`
- `X-Frame-Options`
- `Permissions-Policy`

For a hardened production deployment, place this site behind a platform that supports response headers, then reuse the rules in [`_headers`](/Users/jasonyin/Desktop/Documents/Dev/XYVC/_headers) and [`_redirects`](/Users/jasonyin/Desktop/Documents/Dev/XYVC/_redirects).
