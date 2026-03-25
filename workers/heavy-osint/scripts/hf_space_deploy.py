#!/usr/bin/env python3
import os
import re
import shutil
import tempfile
from pathlib import Path

from huggingface_hub import HfApi


ROOT_DIR = Path(__file__).resolve().parents[4]
WORKER_DIR = ROOT_DIR / "privat-osint" / "workers" / "heavy-osint"
SECRETS_DIR = ROOT_DIR / ".secrets"

HF_TOKEN_FILE = Path(os.getenv("HF_TOKEN_FILE", SECRETS_DIR / "huggingface_token.txt"))
HF_OWNER = os.getenv("HF_SPACE_OWNER", "").strip()
HF_SPACE_NAME = os.getenv("HF_SPACE_NAME", "privat-osint-heavy-worker").strip()
HF_SPACE_PRIVATE = os.getenv("HF_SPACE_PRIVATE", "false").strip().lower() in {"1", "true", "yes", "on"}

WORKER_TOKEN_FILE = Path(os.getenv("WORKER_TOKEN_FILE", SECRETS_DIR / "huggingface_worker_token.txt"))
SPACE_REPO_ID_FILE = Path(os.getenv("SPACE_REPO_ID_FILE", SECRETS_DIR / "huggingface_space_repo_id.txt"))
WORKER_URL_FILE = Path(os.getenv("WORKER_URL_FILE", SECRETS_DIR / "huggingface_worker_url.txt"))


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9-]+", "-", value.strip().lower())
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or "privat-osint-heavy-worker"


def ensure_token_file(path: Path) -> str:
    if not path.exists():
        raise SystemExit(f"Hugging Face token file not found: {path}")
    token = path.read_text(encoding="utf-8").strip()
    if not token:
        raise SystemExit(f"Hugging Face token file is empty: {path}")
    return token


def ensure_worker_token(path: Path) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    os.chmod(path.parent, 0o700)
    if not path.exists():
        path.write_text(os.urandom(24).hex(), encoding="utf-8")
        os.chmod(path, 0o600)
    token = path.read_text(encoding="utf-8").strip()
    if not token:
        raise SystemExit(f"Worker token file is empty: {path}")
    return token


def build_hf_readme(repo_id: str) -> str:
    return f"""---
title: Privat OSINT Heavy Worker
colorFrom: green
colorTo: gray
sdk: docker
app_port: 8080
pinned: false
---

# Privat OSINT Heavy Worker

Docker-based worker for `Privat OSINT`.

- Repository ID: `{repo_id}`
- Runtime: `Docker Space`
- Port: `8080`

This Space is used as an external worker for lawful public-source OSINT tools such as `Sherlock`, `Maigret`, and `theHarvester`.
"""


def stage_worker(repo_id: str) -> Path:
    temp_dir = Path(tempfile.mkdtemp(prefix="hf-space-"))
    for entry in WORKER_DIR.iterdir():
        if entry.name in {".venv", "__pycache__", ".venv-hf-deploy"}:
            continue
        target = temp_dir / entry.name
        if entry.is_dir():
            shutil.copytree(
                entry,
                target,
                dirs_exist_ok=True,
                ignore=shutil.ignore_patterns(".venv", "__pycache__", ".venv-hf-deploy"),
            )
        else:
            shutil.copy2(entry, target)

    (temp_dir / "README.md").write_text(build_hf_readme(repo_id), encoding="utf-8")
    return temp_dir


def main() -> None:
    token = ensure_token_file(HF_TOKEN_FILE)
    worker_token = ensure_worker_token(WORKER_TOKEN_FILE)

    api = HfApi(token=token)
    whoami = api.whoami(token=token)
    owner = HF_OWNER or whoami.get("name", "").strip()
    if not owner:
        raise SystemExit("Could not determine Hugging Face username. Set HF_SPACE_OWNER explicitly.")

    space_name = slugify(HF_SPACE_NAME)
    repo_id = f"{owner}/{space_name}"
    stage_dir = stage_worker(repo_id)

    try:
        api.create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="docker",
            private=HF_SPACE_PRIVATE,
            exist_ok=True,
            token=token,
        )
        api.add_space_secret(repo_id=repo_id, key="OSINT_WORKER_TOKEN", value=worker_token, token=token)
        api.upload_folder(
            repo_id=repo_id,
            repo_type="space",
            folder_path=str(stage_dir),
            commit_message="Deploy Privat OSINT heavy worker",
            token=token,
        )
    finally:
        shutil.rmtree(stage_dir, ignore_errors=True)

    subdomain = f"{owner}-{space_name}".replace("_", "-").lower()
    worker_url = f"https://{subdomain}.hf.space"

    SPACE_REPO_ID_FILE.write_text(repo_id, encoding="utf-8")
    WORKER_URL_FILE.write_text(worker_url, encoding="utf-8")
    os.chmod(SPACE_REPO_ID_FILE, 0o600)
    os.chmod(WORKER_URL_FILE, 0o600)

    print(f"Hugging Face Space ready: {repo_id}")
    print(f"Worker URL: {worker_url}")
    print(f"Repo file: {SPACE_REPO_ID_FILE}")
    print(f"URL file: {WORKER_URL_FILE}")


if __name__ == "__main__":
    main()
