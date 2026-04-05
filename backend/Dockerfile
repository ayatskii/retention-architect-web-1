FROM python:3.12-slim

# libgomp1 is required by LightGBM at runtime (OpenMP shared library).
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# NOTE: this Dockerfile is built with the repo root as the build context
# (see docker-compose.yml) so it can COPY the sibling models/ directory.
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY models/ /app/models
ENV MODELS_DIR=/app/models

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
