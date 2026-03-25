import csv
import json
import os
import shlex
import subprocess
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel


app = FastAPI(title="Privat OSINT Heavy Worker", version="0.1.0")


INTERACTIVE_SHERLOCK_SITES = [
    "GitHub",
    "GitLab",
    "Reddit",
    "Keybase",
    "DEV Community",
    "Medium",
    "Telegram",
    "Patreon",
    "Docker Hub",
    "Kaggle",
    "LeetCode",
    "Hugging Face",
    "PyPi",
    "Replit.com",
    "TryHackMe",
    "Codecademy",
    "Codeberg",
    "BitBucket",
    "HackerNews",
    "npm",
    "Bluesky",
    "Twitter",
    "Instagram",
    "TikTok",
    "LinkedIn",
]

HIGH_SIGNAL_PROFILE_HOST_PRIORITY = [
    "github.com",
    "gist.github.com",
    "gitlab.com",
    "reddit.com",
    "keybase.io",
    "t.me",
    "huggingface.co",
    "stackoverflow.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "bsky.app",
    "instagram.com",
    "tiktok.com",
    "dev.to",
    "medium.com",
    "hub.docker.com",
    "kaggle.com",
    "leetcode.com",
    "codeberg.org",
    "bitbucket.org",
    "npmjs.com",
    "pypi.org",
    "replit.com",
    "tryhackme.com",
    "codecademy.com",
    "patreon.com",
    "developer.apple.com",
    "discussions.apple.com",
    "behance.net",
    "hackerone.com",
    "hackerearth.com",
    "hackerrank.com",
    "codeforces.com",
    "codewars.com",
    "chess.com",
    "crowdin.com",
    "news.ycombinator.com",
]

HIGH_SIGNAL_PROFILE_HOSTS = set(HIGH_SIGNAL_PROFILE_HOST_PRIORITY)

PROFILE_PATH_REJECT_PATTERNS = [
    "/search",
    "/users/filter",
    "/explore",
    "/directory",
    "/tag/",
    "/topics/",
    "/hashtag/",
    "/discover",
    "/login",
    "/signup",
]


class RunRequest(BaseModel):
    query: str
    type: str | None = None


TOOL_CONFIG: dict[str, dict[str, Any]] = {
    "sherlock": {
        "title": "Sherlock Worker",
        "description": "Structured results from the configured Sherlock command.",
        "command_env": "SHERLOCK_COMMAND",
        "default_command": "",
        "parser": "sherlock",
    },
    "maigret": {
        "title": "Maigret Worker",
        "description": "Structured results from the configured Maigret command.",
        "command_env": "MAIGRET_COMMAND",
        "default_command": "",
        "parser": "maigret",
    },
    "theharvester": {
        "title": "theHarvester Worker",
        "description": "Structured results from the configured theHarvester command.",
        "command_env": "THEHARVESTER_COMMAND",
        "default_command": "theHarvester -d {query} -b all -f {output_base}",
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
    "phoneinfoga": {
        "title": "PhoneInfoga Worker",
        "description": "Structured results from the configured PhoneInfoga command.",
        "command_env": "PHONEINFOGA_COMMAND",
        "default_command": "phoneinfoga scan -n {query} -o json",
        "parser": "phoneinfoga",
    },
    "octosuite": {
        "title": "Octosuite Worker",
        "description": "Structured results from the configured Octosuite command.",
        "command_env": "OCTOSUITE_COMMAND",
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


def split_csv_env(name: str) -> list[str]:
    return [entry.strip() for entry in os.getenv(name, "").split(",") if entry.strip()]


def build_tool_command(tool: str, template: str, query: str, output_dir: Path) -> list[str]:
    if tool == "sherlock":
        timeout = os.getenv("SHERLOCK_TIMEOUT", "8").strip() or "8"
        sites = split_csv_env("SHERLOCK_SITES") or INTERACTIVE_SHERLOCK_SITES
        command = [
            "sherlock",
            "--print-found",
            "--csv",
            "--folderoutput",
            str(output_dir),
            "--timeout",
            timeout,
        ]
        for site in sites:
            command.extend(["--site", site])
        command.append(query)
        return command

    if tool == "maigret":
        top_sites = os.getenv("MAIGRET_TOP_SITES", "80").strip() or "80"
        timeout = os.getenv("MAIGRET_TIMEOUT", "8").strip() or "8"
        max_connections = os.getenv("MAIGRET_MAX_CONNECTIONS", "40").strip() or "40"
        command = [
            "maigret",
            query,
            "--json",
            "simple",
            "--folderoutput",
            str(output_dir),
            "--top-sites",
            top_sites,
            "--timeout",
            timeout,
            "--no-recursion",
            "-n",
            max_connections,
        ]
        tags = split_csv_env("MAIGRET_TAGS")
        if tags:
            command.extend(["--tags", ",".join(tags)])
        return command

    return build_command(template, query, output_dir)


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


def infer_title_from_url(url: str, fallback: str = "Profile") -> str:
    if not url:
        return fallback
    parsed = urlparse(url)
    hostname = parsed.netloc.lower().split("@")[-1]
    if hostname.startswith("www."):
        hostname = hostname[4:]
    if not hostname:
        return fallback
    return hostname.split(".")[0] or fallback


def root_hostname(url: str) -> str:
    parsed = urlparse(url)
    hostname = parsed.netloc.lower().split("@")[-1]
    if hostname.startswith("www."):
        hostname = hostname[4:]
    return hostname


def is_high_signal_host(hostname: str) -> bool:
    return any(
        hostname == allowed or hostname.endswith(f".{allowed}")
        for allowed in HIGH_SIGNAL_PROFILE_HOSTS
    )


def is_profile_like_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except ValueError:
        return False

    if parsed.scheme not in {"http", "https"}:
        return False

    hostname = root_hostname(url)
    if not hostname or not is_high_signal_host(hostname):
        return False

    path = parsed.path.lower()
    query = parsed.query.lower()
    composite = f"{path}?{query}"
    if any(pattern in composite for pattern in PROFILE_PATH_REJECT_PATTERNS):
        return False

    if hostname == "stackoverflow.com" and not path.startswith("/users/"):
        return False
    if hostname == "linkedin.com" and not (
        path.startswith("/in/") or path.startswith("/pub/")
    ):
        return False
    if hostname == "medium.com" and not path.startswith("/@"):
        return False
    if hostname == "hub.docker.com" and not path.startswith("/u/"):
        return False
    if hostname == "t.me" and path.count("/") != 1:
        return False

    return True


def profile_host_rank(url: str) -> int:
    hostname = root_hostname(url)
    for index, allowed in enumerate(HIGH_SIGNAL_PROFILE_HOST_PRIORITY):
        if hostname == allowed or hostname.endswith(f".{allowed}"):
            return index
    return len(HIGH_SIGNAL_PROFILE_HOST_PRIORITY) + 50


def dedupe_and_rank_profiles(items: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    deduped: dict[str, dict[str, Any]] = {}
    for item in items:
        url = str(item.get("url") or item.get("subtitle") or "").strip()
        if not url or not is_profile_like_url(url):
            continue
        key = url.lower()
        if key not in deduped:
            deduped[key] = item

    return sorted(
        deduped.values(),
        key=lambda item: (
            profile_host_rank(str(item.get("url") or item.get("subtitle") or "")),
            str(item.get("title") or "").lower(),
        ),
    )[:limit]


def collect_files(output_dir: Path, suffixes: tuple[str, ...]) -> list[Path]:
    return sorted(path for path in output_dir.rglob("*") if path.is_file() and path.suffix in suffixes)


def parse_sherlock(output_dir: Path, stdout: str) -> list[dict[str, Any]]:
    csv_files = collect_files(output_dir, (".csv",))
    items: list[dict[str, Any]] = []

    for file_path in csv_files:
        with file_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                profile_url = row.get("url_user") or row.get("url") or row.get("URL") or ""
                site = row.get("site") or row.get("Site") or row.get("name") or infer_title_from_url(profile_url, fallback="Site")
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

    ranked_items = dedupe_and_rank_profiles(items, limit=18)
    if ranked_items:
        return ranked_items

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

    ranked_items = dedupe_and_rank_profiles(items, limit=14)
    if ranked_items:
        return ranked_items

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


def parse_phoneinfoga(output_dir: Path, stdout: str) -> list[dict[str, Any]]:
    text = stdout.strip()
    if not text:
        return []

    json_candidates: list[Any] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("{") or line.startswith("["):
            try:
                json_candidates.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    if not json_candidates:
        try:
            json_candidates = [json.loads(text)]
        except json.JSONDecodeError:
            return parse_generic_lines(stdout, source="PhoneInfoga", tag="phone")

    items: list[dict[str, Any]] = []

    for payload in json_candidates:
        if isinstance(payload, list):
            iterable = payload
        else:
            iterable = [payload]

        for entry in iterable:
            if not isinstance(entry, dict):
                continue

            normalized = str(
                entry.get("number")
                or entry.get("phone")
                or entry.get("input")
                or entry.get("international")
                or "Phone result"
            )
            country = str(entry.get("country") or entry.get("countryCode") or "")
            carrier = str(entry.get("carrier") or entry.get("operator") or "")
            line_type = str(entry.get("type") or entry.get("lineType") or "")
            items.append(
                serialize_item(
                    "PhoneInfoga",
                    "phone-intelligence",
                    normalized,
                    country or carrier,
                    "Structured phone-intelligence result returned by PhoneInfoga.",
                    None,
                    ["phoneinfoga", "phone"],
                    [
                        {"label": "Country", "value": country or "Unknown"},
                        {"label": "Carrier", "value": carrier or "Unknown"},
                        {"label": "Type", "value": line_type or "Unknown"},
                    ],
                )
            )

    return items[:40] if items else parse_generic_lines(stdout, source="PhoneInfoga", tag="phone")


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
    if parser_name == "phoneinfoga":
        return parse_phoneinfoga(output_dir, stdout)
    return parse_generic_lines(stdout, source=tool.title(), tag=tool)


def run_tool(tool: str, query: str) -> dict[str, Any]:
    config = TOOL_CONFIG[tool]
    template = os.getenv(config["command_env"], config["default_command"]).strip()
    if not template and tool not in {"sherlock", "maigret"}:
        return {
            "title": config["title"],
            "description": f"{config['title']} is not configured yet. Set {config['command_env']} on the worker host.",
            "items": [],
        }

    with tempfile.TemporaryDirectory(prefix=f"{tool}-") as temp_dir:
        output_dir = Path(temp_dir)
        command = build_tool_command(tool, template, query, output_dir)
        try:
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=240,
                check=False,
            )
        except FileNotFoundError:
            return {
                "title": config["title"],
                "description": f"{config['title']} could not start because the configured command was not found on the worker host.",
                "items": [
                    serialize_item(
                        config["title"],
                        "command-error",
                        "Command not found",
                        " ".join(command[:2]),
                        "Install the tool on the worker or update the command template.",
                        None,
                        [tool, "worker-error"],
                    )
                ],
            }
        except subprocess.TimeoutExpired:
            return {
                "title": config["title"],
                "description": f"{config['title']} timed out before producing a structured result.",
                "items": [
                    serialize_item(
                        config["title"],
                        "timeout",
                        "Timed out",
                        query,
                        "The worker stopped waiting after 240 seconds.",
                        None,
                        [tool, "timeout"],
                    )
                ],
            }

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
