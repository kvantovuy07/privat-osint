#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
VENV_DIR="${WORKER_DIR}/.venv-hf-deploy"

python3 -m venv "${VENV_DIR}"
source "${VENV_DIR}/bin/activate"
python -m pip install --upgrade pip >/dev/null
python -m pip install "huggingface_hub>=0.30,<1" >/dev/null
python "${SCRIPT_DIR}/hf_space_deploy.py"
