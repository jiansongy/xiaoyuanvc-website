# GLM Proxy Deployment

This folder is a standalone Vercel Serverless Function project for the Campus VC AI tools.

Goal:
- serve the proxy from a custom domain such as `api.xiaoyuanvc.com`
- avoid relying on `*.vercel.app` for users in mainland China / WeChat

## Endpoints

- `GET /api/glm-proxy`
  - health check
- `POST /api/glm-proxy`
  - forwards regular `messages` requests to GLM
  - routes `toolId: "student-startup-self-check"` to the self-check backend
  - applies unified data schema normalization
  - uses double-layer scoring with heuristic rules + AI reasoning
  - returns structured history snapshots and action mapping

## Required Environment Variables

- `GLM_API_KEY`
  - Zhipu GLM API key

## Optional Environment Variables

- `GLM_MODEL`
  - primary model; defaults to `glm-5.3`
- `GLM_FALLBACK_MODEL`
  - fallback model; defaults to `glm-4.7-flashx`
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
  "model": "glm-5.3",
  "fallbackModel": "glm-4.7-flashx",
  "hasApiKey": true
}
```

POST test:

```bash
curl -X POST https://api.xiaoyuanvc.com/api/glm-proxy \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"用一句话介绍校园VC"}],"stream":false}'
```

Student startup self-check:

```bash
curl -X POST https://api.xiaoyuanvc.com/api/glm-proxy \
  -H 'Content-Type: application/json' \
  -d '{"toolId":"student-startup-self-check","toolState":{"draftData":{"product":"一个帮助大学生管理课程任务和截止日期的智能学习工具"}}}'
```

## Notes

- The server selects the model; clients do not send model names
- GLM-5.3 uses enabled thinking with low reasoning effort and a 4096-token cap
- GLM-4.7-FlashX fallback disables thinking to keep recovery within its
  10-second attempt budget
- Transient status, connection, or pre-output body failures can fall back to
  `glm-4.7-flashx`
- One 55-second deadline covers generic connection and body streaming; the
  self-check shares one 52-second deadline across analysis, retries, fallback,
  and optional history recalibration
- History recalibration is skipped when less than 10 seconds remain
- CORS is restricted to the configured allowed origins
- Custom domain is strongly preferred over `*.vercel.app`
