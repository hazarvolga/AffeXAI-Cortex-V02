#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
run_id="affexai-g2-qdrant-$$"
context="$(mktemp -d)"
cleanup() {
  docker rm -f "$run_id-runner" "$run_id-storage" >/dev/null 2>&1 || true
  docker network rm "$run_id" >/dev/null 2>&1 || true
  rm -rf "$context"
}
trap cleanup EXIT
cp "$repo_root/apps/cortex/"{main.py,memory_runtime.py,service_auth.py} "$context/"
cp "$repo_root/scripts/test-cortex-qdrant.py" "$context/acceptance.py"
cat > "$context/Dockerfile" <<'DOCKER'
FROM python:3.11.14-slim-bookworm
RUN pip install --no-cache-dir fastapi==0.128.8 pydantic==2.13.5 qdrant-client==1.16.1 httpx==0.28.1
WORKDIR /test
COPY *.py ./
ENV PYTHONDONTWRITEBYTECODE=1
USER 1000:1000
CMD ["python", "acceptance.py"]
DOCKER
docker build -t affexai-cortex-qdrant-acceptance:g2-local "$context"
docker network create --internal --label affexai.scope=g2-isolated-test "$run_id" >/dev/null
docker run -d --name "$run_id-storage" --network "$run_id" --network-alias qdrant \
  --label affexai.scope=g2-isolated-test --memory 512m --cpus 1 \
  --tmpfs /qdrant/storage --tmpfs /qdrant/snapshots qdrant/qdrant:v1.16.1 >/dev/null
docker run --rm --name "$run_id-runner" --network "$run_id" \
  --label affexai.scope=g2-isolated-test --read-only --tmpfs /tmp --memory 256m --cpus 1 \
  affexai-cortex-qdrant-acceptance:g2-local
