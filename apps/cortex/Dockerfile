FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Bake a reviewed model revision into the image. Runtime stays offline and
# never downloads model code or weights after deployment.
ARG CORTEX_EMBEDDING_MODEL_ID=sentence-transformers/all-MiniLM-L6-v2
ARG CORTEX_EMBEDDING_MODEL_REVISION=1110a243fdf4706b3f48f1d95db1a4f5529b4d41
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='${CORTEX_EMBEDDING_MODEL_ID}', revision='${CORTEX_EMBEDDING_MODEL_REVISION}', local_dir='/opt/models/all-MiniLM-L6-v2', allow_patterns=['config.json','modules.json','sentence_bert_config.json','model.safetensors','tokenizer.json','tokenizer_config.json','special_tokens_map.json','vocab.txt','1_Pooling/config.json'])"

ENV CORTEX_EMBEDDING_MODEL_PATH=/opt/models/all-MiniLM-L6-v2 \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd --create-home --uid 10001 cortex \
    && chown -R cortex:cortex /app /opt/models
USER cortex

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/ready', timeout=3)" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
