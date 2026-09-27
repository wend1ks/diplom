# Deploy: Vercel frontend + Django API

The React/Vite frontend is deployed on Vercel. Django and PostgreSQL run as separate services. The repository's `backend/Dockerfile` is ready for a Docker based Python host such as Render.

## 1. Push the repository

Commit and push the project to GitHub. Do not commit `backend/.env` or put credentials in the Vite frontend. `VITE_*` values are public and become part of the browser bundle.

## 2. Create PostgreSQL and deploy Django

Create a PostgreSQL database with your backend host and copy its **internal** connection URL. Create a Docker web service from this repository with `backend` as its root directory (so it finds `Dockerfile` and `requirements.txt`). Set the service's health check path to `/health/`.

Set these backend environment variables in the host dashboard:

| Variable | Value |
| --- | --- |
| `DJANGO_SECRET_KEY` | A unique random secret; generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | Backend hostname only, without `https://`, for example `your-api.onrender.com` |
| `DATABASE_URL` | PostgreSQL connection URL from the database service |
| `CORS_ALLOWED_ORIGINS` | Exact Vercel production origin, e.g. `https://your-app.vercel.app` (add custom domain too if used) |
| `CSRF_TRUSTED_ORIGINS` | Exact HTTPS frontend origin(s), comma separated |
| `FRONTEND_URL` | Frontend origin, e.g. `https://your-app.vercel.app` |
| `MEDIA_ROOT` | Persistent disk path, e.g. `/var/data/media` |

Attach a persistent disk to the backend at `/var/data` so uploaded avatars and assignment files survive deploys/restarts. Without persistent storage, locally saved uploads can disappear when the container is replaced.

Run database migrations once before sending traffic: `python manage.py migrate --noinput` from the backend service shell or its pre-deploy command. The app collects static files at container startup and serves them with WhiteNoise.

Optional integrations:

- For GitHub sign-in, set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_REDIRECT_URI=https://YOUR-API-HOST/api/auth/github/callback/`. Register that same callback URL in the GitHub OAuth app.
- For password reset emails, set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, and `DEFAULT_FROM_EMAIL` to working SMTP credentials.

After the service is live, note its HTTPS base URL, such as `https://your-api.onrender.com`.

## 3. Deploy the frontend on Vercel

Import the same repository as a Vercel project and set **Root Directory** to `frontend/front`. The checked-in Vercel config builds the Vite app. Add this environment variable for Production (and Preview if preview deployments should use the same API):

```text
VITE_API_URL=https://YOUR-API-HOST/api
```

Redeploy after setting it. If you add a Vercel custom domain, add its exact `https://` origin to both `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` on the backend, then redeploy the backend.

## 4. Final checks

- Open `https://YOUR-API-HOST/health/`; it should return `{"status":"ok"}`.
- Open the Vercel site and check registration/login and API requests in the browser.
- If GitHub sign-in is enabled, test the callback and redirect to the frontend.
- If uploads are used, upload a file, redeploy the backend, and confirm the file remains available.

For local development, copy `backend/.env.example` to `backend/.env` and set `DJANGO_DEBUG=True`; copy `frontend/front/.env.example` only when using a deployed API. Vite's local proxy targets `127.0.0.1:8000`.