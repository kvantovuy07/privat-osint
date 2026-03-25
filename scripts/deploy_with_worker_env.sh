#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRETS_DIR="${ROOT_DIR}/../.secrets"

if [[ -z "${WORKER_URL_FILE:-}" ]]; then
  if [[ -f "${SECRETS_DIR}/huggingface_worker_url.txt" ]]; then
    WORKER_URL_FILE="${SECRETS_DIR}/huggingface_worker_url.txt"
  else
    WORKER_URL_FILE="${SECRETS_DIR}/render_worker_url.txt"
  fi
fi

if [[ -z "${WORKER_TOKEN_FILE:-}" ]]; then
  if [[ -f "${SECRETS_DIR}/huggingface_worker_token.txt" ]]; then
    WORKER_TOKEN_FILE="${SECRETS_DIR}/huggingface_worker_token.txt"
  else
    WORKER_TOKEN_FILE="${SECRETS_DIR}/render_worker_token.txt"
  fi
fi

if [[ ! -f "${WORKER_URL_FILE}" ]]; then
  echo "Worker URL file not found: ${WORKER_URL_FILE}" >&2
  exit 1
fi

if [[ ! -f "${WORKER_TOKEN_FILE}" ]]; then
  echo "Worker token file not found: ${WORKER_TOKEN_FILE}" >&2
  exit 1
fi

WORKER_URL="$(<"${WORKER_URL_FILE}")"
WORKER_TOKEN="$(<"${WORKER_TOKEN_FILE}")"

cd "${ROOT_DIR}"

npx vercel deploy --prod --yes \
  --env "SHERLOCK_BRIDGE_URL=${WORKER_URL}/tool/sherlock" \
  --env "SHERLOCK_BRIDGE_TOKEN=${WORKER_TOKEN}" \
  --env "MAIGRET_BRIDGE_URL=${WORKER_URL}/tool/maigret" \
  --env "MAIGRET_BRIDGE_TOKEN=${WORKER_TOKEN}" \
  --env "THEHARVESTER_BRIDGE_URL=${WORKER_URL}/tool/theharvester" \
  --env "THEHARVESTER_BRIDGE_TOKEN=${WORKER_TOKEN}" \
  --build-env "SHERLOCK_BRIDGE_URL=${WORKER_URL}/tool/sherlock" \
  --build-env "SHERLOCK_BRIDGE_TOKEN=${WORKER_TOKEN}" \
  --build-env "MAIGRET_BRIDGE_URL=${WORKER_URL}/tool/maigret" \
  --build-env "MAIGRET_BRIDGE_TOKEN=${WORKER_TOKEN}" \
  --build-env "THEHARVESTER_BRIDGE_URL=${WORKER_URL}/tool/theharvester" \
  --build-env "THEHARVESTER_BRIDGE_TOKEN=${WORKER_TOKEN}"
