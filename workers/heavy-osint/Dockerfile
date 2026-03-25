FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl git unzip \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir "pip<24.1" \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir uv sherlock-project maigret \
    && arch="$(dpkg --print-architecture)" \
    && case "${arch}" in \
        amd64) subfinder_asset="subfinder_2.13.0_linux_amd64.zip"; amass_asset="amass_linux_amd64.tar.gz"; phoneinfoga_asset="phoneinfoga_Linux_x86_64.tar.gz" ;; \
        arm64) subfinder_asset="subfinder_2.13.0_linux_arm64.zip"; amass_asset="amass_linux_arm64.tar.gz"; phoneinfoga_asset="phoneinfoga_Linux_arm64.tar.gz" ;; \
        *) echo "Unsupported architecture: ${arch}" >&2; exit 1 ;; \
      esac \
    && curl -fsSL "https://github.com/projectdiscovery/subfinder/releases/download/v2.13.0/${subfinder_asset}" -o /tmp/subfinder.zip \
    && unzip -q /tmp/subfinder.zip -d /tmp/subfinder \
    && install /tmp/subfinder/subfinder /usr/local/bin/subfinder \
    && curl -fsSL "https://github.com/owasp-amass/amass/releases/download/v5.0.1/${amass_asset}" -o /tmp/amass.tar.gz \
    && mkdir -p /tmp/amass \
    && tar -xzf /tmp/amass.tar.gz -C /tmp/amass \
    && install "$(find /tmp/amass -type f -name amass | head -n1)" /usr/local/bin/amass \
    && curl -fsSL "https://github.com/sundowndev/phoneinfoga/releases/download/v2.11.0/${phoneinfoga_asset}" -o /tmp/phoneinfoga.tar.gz \
    && mkdir -p /tmp/phoneinfoga \
    && tar -xzf /tmp/phoneinfoga.tar.gz -C /tmp/phoneinfoga \
    && install "$(find /tmp/phoneinfoga -type f -name phoneinfoga | head -n1)" /usr/local/bin/phoneinfoga \
    && git clone --depth=1 https://github.com/laramies/theHarvester /opt/theHarvester \
    && cd /opt/theHarvester \
    && uv sync --locked --no-dev --no-cache \
    && printf '%s\n' '#!/usr/bin/env bash' 'cd /opt/theHarvester && exec uv run theHarvester "$@"' > /usr/local/bin/theHarvester \
    && chmod +x /usr/local/bin/theHarvester \
    && rm -rf /tmp/subfinder.zip /tmp/subfinder /tmp/amass.tar.gz /tmp/amass /tmp/phoneinfoga.tar.gz /tmp/phoneinfoga

COPY app ./app

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
