# Heavy Worker Hosting Options

This note captures the practical external-host paths for `workers/heavy-osint` as of `2026-03-25`.

## What Is Already Ready

- Docker image entrypoint: [Dockerfile](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/Dockerfile)
- Render blueprint: [render.yaml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/render.yaml)
- Fly config: [fly.toml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/fly.toml)
- Railway config: [railway.toml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/railway.toml)
- Runtime env template: [.env.example](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/.env.example)
- Worker app: [main.py](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/app/main.py)

The provided Docker image now preinstalls:

- `Sherlock`
- `Maigret`
- `theHarvester`

These still need host-level binaries or a custom image layer if you want them live:

- `Subfinder`
- `Amass`
- `PhoneInfoga`
- `Octosuite`
- optional `SpiderFoot` wrapper

## Best Current Path

`Render` is the easiest zero-CLI path for a first external worker because:

- Render supports Docker deploys and `render.yaml` blueprints.
- Render also offers free web services for testing.
- A worker needs a public HTTP URL, which maps naturally to a Render web service.

Tradeoff:

- Render free web services spin down after `15` minutes idle and can take about `1` minute to wake up.
- Render explicitly says free web services are not for production.

Official references:

- Render Blueprints: https://render.com/docs/infrastructure-as-code
- Render free web services: https://render.com/docs/free
- Render pricing: https://render.com/pricing

## Stable Paid Path

`Railway` is a strong next step when you want less cold-start friction than a free Render instance:

- Railway supports Dockerfiles directly.
- Railway supports custom Dockerfile paths.
- This repo already contains [railway.toml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/railway.toml).

Official references:

- Railway Dockerfiles: https://docs.railway.com/builds/dockerfiles
- Railway pricing: https://railway.com/pricing

## Control-Oriented Path

`Fly.io` is a good fit if you want a lightweight always-on container and more low-level control:

- The repo already contains [fly.toml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/fly.toml).
- Fly is well-suited for single-container HTTP workers.

Official references:

- Fly deploy docs: https://fly.io/docs/launch/deploy/
- Fly config reference: https://fly.io/docs/reference/configuration/
- Fly pricing docs: https://fly.io/docs/about/pricing/

## Why It Was Not Auto-Deployed From Here

The current environment does not have:

- a logged-in `Render`, `Railway`, or `Fly.io` account
- platform API tokens
- a verified CLI session such as `flyctl auth login` or `railway login`

Without one of those, I can prepare the worker and configs, but I cannot create the external host itself.

## Minimum Needed To Finish Deployment

Pick one platform and provide access there. After that, the remaining minimum is:

1. A connected Git provider or direct deploy path for this repository.
2. One public worker URL, for example `https://privat-osint-heavy-worker.onrender.com`.
3. These worker env vars:
   - `OSINT_WORKER_TOKEN`
   - `SHERLOCK_COMMAND`
   - `MAIGRET_COMMAND`
   - `THEHARVESTER_COMMAND`
   - optional tool command envs for anything beyond the preinstalled Python tools
4. The same bridge URL and token envs in the main app.

## Fastest Render Path

1. Create a Render account.
2. Connect the repository.
3. Create a Blueprint and point Render at [render.yaml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/render.yaml).
4. Set `OSINT_WORKER_TOKEN`.
5. Deploy.
6. Put the resulting worker URL into the main app bridge envs:
   - `SHERLOCK_BRIDGE_URL`
   - `MAIGRET_BRIDGE_URL`
   - `THEHARVESTER_BRIDGE_URL`
7. Redeploy the main app.

## What To Add For Full Heavy Coverage

To go beyond the preinstalled Python tools, extend the Docker image with:

- `Subfinder`
- `Amass`
- `PhoneInfoga`
- your chosen `SpiderFoot` adapter
- your chosen `Octosuite` wrapper

At that point the site can pull those results into the unified UI through the bridge envs that already exist in the main app.
