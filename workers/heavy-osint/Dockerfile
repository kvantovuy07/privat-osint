FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir "pip<24.1" \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir uv sherlock-project maigret \
    && git clone --depth=1 https://github.com/laramies/theHarvester /opt/theHarvester \
    && cd /opt/theHarvester \
    && uv sync --locked --no-dev --no-cache \
    && printf '%s\n' '#!/usr/bin/env bash' 'cd /opt/theHarvester && exec uv run theHarvester "$@"' > /usr/local/bin/theHarvester \
    && chmod +x /usr/local/bin/theHarvester

COPY app ./app

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
