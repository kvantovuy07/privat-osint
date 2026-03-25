# Heavy OSINT Worker

Self-hosted worker that returns structured JSON back into `Privat OSINT` for heavy tools that should not run inside Vercel request-time.

## Why this exists

These tools are better suited to a VPS or container host:

- `Sherlock`
- `Maigret`
- `theHarvester`
- `Subfinder`
- `Amass`
- optional `PhoneInfoga`
- optional `Octosuite`
- optional `SpiderFoot` adapter

The main app can call this worker and render results directly in the UI.

## Run

```bash
cd workers/heavy-osint
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

Or build it:

```bash
docker build -t privat-osint-heavy-worker .
docker run --rm -p 8080:8080 --env-file .env privat-osint-heavy-worker
```

## One-file deploy options

- `Fly.io`: use [fly.toml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/fly.toml)
- `Render`: use [render.yaml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/render.yaml)
- `Railway`: use [railway.toml](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/railway.toml)

All three expect you to set the same runtime env vars from [.env.example](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/.env.example).

## Commands

Each endpoint shells out to a configurable command template.

Supported placeholders:

- `{query}`
- `{output_dir}`
- `{output_file}`
- `{output_base}`

Recommended command templates:

```bash
SHERLOCK_COMMAND="sherlock --print-found --csv --folderoutput {output_dir} {query}"
MAIGRET_COMMAND="maigret {query} --json simple --folderoutput {output_dir}"
THEHARVESTER_COMMAND="theHarvester -d {query} -b all -f {output_base}"
SUBFINDER_COMMAND="subfinder -silent -oJ -d {query}"
AMASS_COMMAND="amass enum -passive -norecursive -d {query}"
PHONEINFOGA_COMMAND="phoneinfoga scan -n {query} -o json"
```

The provided [Dockerfile](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/Dockerfile) now preinstalls the Python-based tools `Sherlock`, `Maigret`, and `theHarvester`, and it pins `pip<24.1` so `Maigret` continues to build cleanly with its current dependency tree. That makes the quickest external-host path: deploy the container, set the worker token, and optionally override commands. `Subfinder`, `Amass`, `PhoneInfoga`, and `Octosuite` still require either host-level binaries, a custom image layer, or explicit command overrides.

If you prefer Docker-wrapped tools on your host, point these env vars to your own `docker run ...` command templates instead.

`Octosuite` does not have a single universal CLI pattern for every investigation workflow, so keep `OCTOSUITE_COMMAND` empty until you decide which wrapper or command shape you want to expose through the worker.

## Endpoints

- `POST /health`
- `POST /tool/sherlock`
- `POST /tool/maigret`
- `POST /tool/theharvester`
- `POST /tool/subfinder`
- `POST /tool/amass`
- `POST /tool/spiderfoot`
- `POST /tool/phoneinfoga`
- `POST /tool/octosuite`

Request shape:

```json
{
  "query": "openai",
  "type": "domain"
}
```

Response shape:

```json
{
  "title": "Sherlock Worker",
  "description": "Structured results from the configured Sherlock command.",
  "items": []
}
```

## App wiring

Set the main app envs to the worker URLs:

```bash
SHERLOCK_BRIDGE_URL="https://worker.example.com/tool/sherlock"
MAIGRET_BRIDGE_URL="https://worker.example.com/tool/maigret"
SPIDERFOOT_BRIDGE_URL="https://worker.example.com/tool/spiderfoot"
THEHARVESTER_BRIDGE_URL="https://worker.example.com/tool/theharvester"
SUBFINDER_BRIDGE_URL="https://worker.example.com/tool/subfinder"
AMASS_BRIDGE_URL="https://worker.example.com/tool/amass"
PHONEINFOGA_BRIDGE_URL="https://worker.example.com/tool/phoneinfoga"
OCTOSUITE_BRIDGE_URL="https://worker.example.com/tool/octosuite"
```

If `OSINT_WORKER_TOKEN` is set on the worker, use the same token in the app bridge token envs.

## Notes

- This worker is for lawful public-source OSINT only.
- The app already handles many HTTP-native sources directly. Use this worker for deeper tools, not for basic registry/domain lookups.
- `SpiderFoot` varies more by deployment shape, so its command is intentionally opt-in.
