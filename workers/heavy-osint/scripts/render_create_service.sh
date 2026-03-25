#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
SECRETS_DIR="${ROOT_DIR}/.secrets"
RENDER_API_KEY_FILE="${RENDER_API_KEY_FILE:-${SECRETS_DIR}/render_api_key.txt}"
WORKER_TOKEN_FILE="${WORKER_TOKEN_FILE:-${SECRETS_DIR}/render_worker_token.txt}"
WORKER_SERVICE_ID_FILE="${WORKER_SERVICE_ID_FILE:-${SECRETS_DIR}/render_worker_service_id.txt}"
WORKER_URL_FILE="${WORKER_URL_FILE:-${SECRETS_DIR}/render_worker_url.txt}"

OWNER_ID="${OWNER_ID:-tea-d71sudi4d50c73bvjsj0}"
SERVICE_NAME="${SERVICE_NAME:-privat-osint-heavy-worker}"
REPO_URL="${REPO_URL:-https://github.com/kvantovuy07/privat-osint}"
BRANCH="${BRANCH:-main}"
ROOT_SUBDIR="${ROOT_SUBDIR:-workers/heavy-osint}"
REGION="${REGION:-frankfurt}"
PLAN="${PLAN:-free}"

if [[ ! -f "${RENDER_API_KEY_FILE}" ]]; then
  echo "Render API key file not found: ${RENDER_API_KEY_FILE}" >&2
  exit 1
fi

mkdir -p "${SECRETS_DIR}"
chmod 700 "${SECRETS_DIR}"

if [[ ! -f "${WORKER_TOKEN_FILE}" ]]; then
  openssl rand -hex 24 > "${WORKER_TOKEN_FILE}"
  chmod 600 "${WORKER_TOKEN_FILE}"
fi

RENDER_API_KEY="$(<"${RENDER_API_KEY_FILE}")"
WORKER_TOKEN="$(<"${WORKER_TOKEN_FILE}")"

existing_json="$(curl -s https://api.render.com/v1/services \
  -H "Authorization: Bearer ${RENDER_API_KEY}")"

existing_service_id="$(printf '%s' "${existing_json}" | jq -r --arg name "${SERVICE_NAME}" '.[] | select(.service.name == $name) | .service.id' | head -n1)"

if [[ -n "${existing_service_id}" ]]; then
  echo "${existing_service_id}" > "${WORKER_SERVICE_ID_FILE}"
  chmod 600 "${WORKER_SERVICE_ID_FILE}"
  service_json="$(curl -s "https://api.render.com/v1/services/${existing_service_id}" \
    -H "Authorization: Bearer ${RENDER_API_KEY}")"
  service_url="$(printf '%s' "${service_json}" | jq -r '.service.serviceDetails.url // empty')"
  if [[ -n "${service_url}" ]]; then
    printf '%s' "${service_url}" > "${WORKER_URL_FILE}"
    chmod 600 "${WORKER_URL_FILE}"
  fi
  echo "Service already exists: ${existing_service_id}"
  [[ -n "${service_url}" ]] && echo "URL: ${service_url}"
  exit 0
fi

payload_file="$(mktemp)"
cat > "${payload_file}" <<JSON
{
  "type": "web_service",
  "name": "${SERVICE_NAME}",
  "ownerId": "${OWNER_ID}",
  "repo": "${REPO_URL}",
  "branch": "${BRANCH}",
  "rootDir": "${ROOT_SUBDIR}",
  "autoDeploy": "yes",
  "envVars": [
    { "key": "OSINT_WORKER_TOKEN", "value": "${WORKER_TOKEN}" }
  ],
  "serviceDetails": {
    "runtime": "docker",
    "plan": "${PLAN}",
    "region": "${REGION}",
    "healthCheckPath": "/health",
    "numInstances": 1
  }
}
JSON

response_file="$(mktemp)"
http_code="$(
  curl -s -o "${response_file}" -w '%{http_code}' \
    -X POST https://api.render.com/v1/services \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H 'Content-Type: application/json' \
    --data @"${payload_file}"
)"

if [[ "${http_code}" == "201" ]]; then
  service_id="$(jq -r '.service.id' "${response_file}")"
  service_url="$(jq -r '.service.serviceDetails.url // empty' "${response_file}")"
  printf '%s' "${service_id}" > "${WORKER_SERVICE_ID_FILE}"
  chmod 600 "${WORKER_SERVICE_ID_FILE}"
  if [[ -n "${service_url}" ]]; then
    printf '%s' "${service_url}" > "${WORKER_URL_FILE}"
    chmod 600 "${WORKER_URL_FILE}"
  fi
  echo "Render worker created: ${service_id}"
  [[ -n "${service_url}" ]] && echo "URL: ${service_url}"
  exit 0
fi

if [[ "${http_code}" == "402" ]]; then
  echo "Render blocked service creation because billing is not configured." >&2
  echo "Add payment info in https://dashboard.render.com/billing and rerun this script." >&2
  cat "${response_file}" >&2
  exit 2
fi

echo "Render service creation failed with HTTP ${http_code}" >&2
cat "${response_file}" >&2
exit 1
