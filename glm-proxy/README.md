# GLM Proxy Deployment

This folder is a standalone Vercel Serverless Function project for the Campus VC AI tools.

Goal:
- serve the proxy from a custom domain such as `api.xiaoyuanvc.com`
- avoid relying on `*.vercel.app` for users in mainland China / WeChat

## Endpoints

- `GET /api/glm-proxy`
  - health check
- `POST /api/glm-proxy`
  - forwards requests to GLM

## Required Environment Variables

- `GLM_API_KEY`
  - Zhipu GLM API key

## Optional Environment Variables

- `ALLOWED_ORIGINS`
  - comma-separated list
  - example:
    - `https://xiaoyuanvc.com,http://localhost:8080`

## Recommended Vercel Setup

1. Create a new Vercel project with root directory set to `glm-proxy`
2. Add environment variable:
   - `GLM_API_KEY`
3. Add custom domain:
   - `api.xiaoyuanvc.com`
4. In your DNS provider, add the record Vercel asks for
5. After the domain is active, verify:
   - `https://api.xiaoyuanvc.com/api/glm-proxy`
6. Then keep the frontend pointed at:
   - same-origin `/api/glm-proxy` when hosted behind that domain, or
   - `https://api.xiaoyuanvc.com/api/glm-proxy`

## Quick Verification

Health check:

```bash
curl https://api.xiaoyuanvc.com/api/glm-proxy
```

Expected response shape:

```json
{
  "ok": true,
  "service": "glm-proxy",
  "model": "glm-4-flash",
  "hasApiKey": true
}
```

POST test:

```bash
curl -X POST https://api.xiaoyuanvc.com/api/glm-proxy \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"用一句话介绍校园VC"}],"stream":false}'
```

## Notes

- The proxy forces model `glm-4-flash`
- CORS is restricted to the configured allowed origins
- Custom domain is strongly preferred over `*.vercel.app`
