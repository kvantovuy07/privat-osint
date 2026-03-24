import csv
import json
import os
import shlex
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel


app = FastAPI(title="Privat OSINT Heavy Worker", version="0.1.0")


class RunRequest(BaseModel):
    query: str
    type: str | None = None


TOOL_CONFIG: dict[str, dict[str, Any]] = {
    "sherlock": {
        "title": "Sherlock Worker",
        "description": "Structured results from the configured Sherlock command.",
        "command_env": "SHERLOCK_COMMAND",
        "default_command": "sherlock --print-found --csv --folderoutput {output_dir} {query}",
        "parser": "sherlock",
    },
    "maigret": {
        "title": "Maigret Worker",
        "description": "Structured results from the configured Maigret command.",
        "command_env": "MAIGRET_COMMAND",
        "default_command": "maigret {query} --json simple --folderoutput {output_dir}",
        "parser": "maigret",
    },
    "theharvester": {
        "title": "theHarvester Worker",
        "description": "Structured results from the configured theHarvester command.",
        "command_env": "THEHARVESTER_COMMAND",
        "default_command": "uv run theHarvester -d {query} -b all -f {output_base}",
        "parser": "theharvester",
    },
    "subfinder": {
        "title": "Subfinder Worker",
        "description": "Structured results from the configured Subfinder command.",
        "command_env": "SUBFINDER_COMMAND",
        "default_command": "subfinder -silent -oJ -d {query}",
        "parser": "subfinder",
    },
    "amass": {
        "title": "Amass Worker",
        "description": "Structured results from the configured Amass command.",
        "command_env": "AMASS_COMMAND",
        "default_command": "amass enum -passive -norecursive -d {query}",
        "parser": "amass",
    },
    "spiderfoot": {
        "title": "SpiderFoot Worker",
        "description": "Structured results from the configured SpiderFoot command.",
        "command_env": "SPIDERFOOT_COMMAND",
        "default_command": "",
        "parser": "generic",
    },
}


def require_token(authorization: str | None) -> None:
    configured = os.getenv("OSINT_WORKER_TOKEN", "").strip()
    if not configured:
        return
    expected = f"Bearer {configured}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def clean_query(value: str) -> str:
    query = value.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    return query


def build_command(template: str, query: str, output_dir: Path) -> list[str]:
    output_file = output_dir / "result"
    output_base = output_dir / "result"
    formatted = template.format(
        query=query,
        output_dir=str(output_dir),
        output_file=str(output_file),
        output_base=str(output_base),
    )
    return shlex.split(formatted)


def serialize_item(source: str, type_name: str, title: str, subtitle: str = "", description: str = "", url: str | None = None, tags: list[str] | None = None, details: list[dict[str, str]] | None = None) -> dict[str, Any]:
    return {
        "id": f"{source.lower().replace(' ', '-')}-{title.lower()[:60]}",
        "source": source,
        "type": type_name,
        "title": title,
        "subtitle": subtitle or None,
        "description": description or None,
        "url": url,
        "tags": tags or [],
        "details": details or [],
    }


def collect_files(output_dir: Path, suffixes: tuple[str, ...]) -> list[Path]:
    return sorted(path for path in output_dir.rglob("*") if path.is_file() and path.suffix in suffixes)


def parse_sherlock(output_dir: Path, stdout: str) -> list[dict[str, Any]]:
    csv_files = collect_files(output_dir, (".csv",))
    items: list[dict[str, Any]] = []

    for file_path in csv_files:
        with file_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                site = row.get("site") or row.get("Site") or "Site"
                profile_url = row.get("url_user") or row.get("url") or row.get("URL") or ""
                items.append(
                    serialize_item(
                        "Sherlock",
                        "profile-hit",
                        site,
                        profile_url,
                        row.get("status") or "Public profile hit",
                        profile_url or None,
                        ["sherlock", "username"],
                    )
                )

    if items:
        return items[:60]

    return parse_generic_lines(stdout, source="Sherlock", tag="username")


def parse_maigret(output_dir: Path, stdout: str) -> list[dict[str, Any]]:
    files = collect_files(output_dir, (".json", ".ndjson"))
    items: list[dict[str, Any]] = []

    for file_path in files:
        text = file_path.read_text(encoding="utf-8", errors="ignore").strip()
        if not text:
            continue

        if file_path.suffix == ".ndjson":
            for line in text.splitlines():
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue
                title = str(data.get("site") or data.get("url_user") or "Profile")
                items.append(
                    serialize_item(
                        "Maigret",
                        "profile-hit",
                        title,
                        str(data.get("url_user") or ""),
                        str(data.get("status") or ""),
                        data.get("url_user"),
                        ["maigret", "username"],
                    )
                )
        else:
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                continue

            if isinstance(data, dict):
                for site, raw in data.items():
                    if not isinstance(raw, dict):
                        continue
                    status = raw.get("status", {})
                    status_name = ""
                    if isinstance(status, dict):
                        status_name = str(status.get("status") or "")
                    elif status:
                        status_name = str(status)

                    profile_url = raw.get("url_user") or raw.get("url") or ""
                    items.append(
                        serialize_item(
                            "Maigret",
                            "profile-hit",
                            str(site),
                            str(profile_url),
                            status_name,
                            str(profile_url) if profile_url else None,
                            ["maigret", "username"],
                        )
                    )

    if items:
        return items[:80]

    return parse_generic_lines(stdout, source="Maigret", tag="username")


def parse_theharvester(output_dir: Path, stdout: str) -> list[dict[str, Any]]:
    files = collect_files(output_dir, (".json",))
    items: list[dict[str, Any]] = []

    for file_path in files:
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue

        for email in data.get("emails", [])[:30]:
            items.append(
                serialize_item(
                    "theHarvester",
                    "email",
                    str(email),
                    "",
                    "Public email found by theHarvester.",
                    None,
                    ["theharvester", "email"],
                )
            )
        for host in data.get("hosts", [])[:30]:
            if isinstance(host, dict):
                hostname = str(host.get("hostname") or host.get("host") or "")
                ip = str(host.get("ip") or "")
                items.append(
                    serialize_item(
                        "theHarvester",
                        "host",
                        hostname or "Host",
                        ip,
                        "Public host or subdomain discovered by theHarvester.",
                        None,
                        ["theharvester", "host"],
                    )
                )
            else:
                items.append(
                    serialize_item(
                        "theHarvester",
                        "host",
                        str(host),
                        "",
                        "Public host or subdomain discovered by theHarvester.",
                        None,
                        ["theharvester", "host"],
                    )
                )
        for person in data.get("people", [])[:20]:
            items.append(
                serialize_item(
                    "theHarvester",
                    "person",
                    str(person),
                    "",
                    "Person-like result discovered by theHarvester.",
                    None,
                    ["theharvester", "person"],
                )
            )

    if items:
        return items[:80]

    return parse_generic_lines(stdout, source="theHarvester", tag="osint")


def parse_subfinder(output_dir: Path, stdout: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("{"):
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue
            host = str(data.get("host") or data.get("input") or "")
            source = data.get("sources") or data.get("source") or []
            source_text = ", ".join(source) if isinstance(source, list) else str(source)
            if host:
                items.append(
                    serialize_item(
                        "Subfinder",
                        "subdomain",
                        host,
                        source_text,
                        "Passive subdomain discovered by Subfinder.",
                        None,
                        ["subfinder", "subdomain"],
                    )
                )
        else:
            items.append(
                serialize_item(
                    "Subfinder",
                    "subdomain",
                    line,
                    "",
                    "Passive subdomain discovered by Subfinder.",
                    None,
                    ["subfinder", "subdomain"],
                )
            )
    return items[:80]


def parse_amass(output_dir: Path, stdout: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("["):
            continue
        items.append(
            serialize_item(
                "Amass",
                "infrastructure-hit",
                line.split()[0],
                "",
                "Infrastructure or subdomain line returned by Amass.",
                None,
                ["amass", "infrastructure"],
            )
        )
    return items[:80]


def parse_generic_lines(stdout: str, source: str, tag: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in stdout.splitlines():
        line = raw.strip()
        if not line:
            continue
        items.append(
            serialize_item(
                source,
                "raw-line",
                line[:120],
                "",
                "Structured parsing was not available, so this line was preserved from stdout.",
                None,
                [tag],
            )
        )
    return items[:50]


def parse_output(tool: str, output_dir: Path, stdout: str) -> list[dict[str, Any]]:
    parser_name = TOOL_CONFIG[tool]["parser"]
    if parser_name == "sherlock":
        return parse_sherlock(output_dir, stdout)
    if parser_name == "maigret":
        return parse_maigret(output_dir, stdout)
    if parser_name == "theharvester":
        return parse_theharvester(output_dir, stdout)
    if parser_name == "subfinder":
        return parse_subfinder(output_dir, stdout)
    if parser_name == "amass":
        return parse_amass(output_dir, stdout)
    return parse_generic_lines(stdout, source=tool.title(), tag=tool)


def run_tool(tool: str, query: str) -> dict[str, Any]:
    config = TOOL_CONFIG[tool]
    template = os.getenv(config["command_env"], config["default_command"]).strip()
    if not template:
        return {
            "title": config["title"],
            "description": f"{config['title']} is not configured yet. Set {config['command_env']} on the worker host.",
            "items": [],
        }

    with tempfile.TemporaryDirectory(prefix=f"{tool}-") as temp_dir:
        output_dir = Path(temp_dir)
        command = build_command(template, query, output_dir)
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=240,
            check=False,
        )

        stdout = completed.stdout or ""
        stderr = completed.stderr or ""
        items = parse_output(tool, output_dir, stdout)

        if not items and stderr.strip():
            items = [
                serialize_item(
                    config["title"],
                    "stderr",
                    "Tool output",
                    "",
                    stderr.strip()[:2000],
                    None,
                    [tool, "stderr"],
                )
            ]

        description = config["description"]
        if completed.returncode != 0:
            description = f"{description} Command exited with code {completed.returncode}."

        return {
            "title": config["title"],
            "description": description,
            "items": items,
        }


@app.post("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "tools": sorted(TOOL_CONFIG.keys())}


@app.post("/tool/{tool}")
def run(tool: str, request: RunRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    require_token(authorization)
    selected = tool.lower()
    if selected not in TOOL_CONFIG:
        raise HTTPException(status_code=404, detail="Unknown tool")
    query = clean_query(request.query)
    return run_tool(selected, query)
