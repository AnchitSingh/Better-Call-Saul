# backend/Dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy the backend build context (your corporate_law_squad/ folder and files)
COPY . .

RUN pip install --no-cache-dir google-adk python-dotenv

ENV GOOGLE_GENAI_USE_VERTEXAI=FALSE

# Bind to 0.0.0.0 and the Cloud Run-provided $PORT (defaults to 8080 if not set)
CMD ["/bin/sh", "-c", "adk api_server --host 0.0.0.0 --port ${PORT:-8080} --allow_origins='*'"]
