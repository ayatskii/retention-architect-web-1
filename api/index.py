"""
Vercel serverless entry point for the FastAPI backend.

Vercel's @vercel/python runtime looks for an ASGI `app` export in this file
and routes every request matching the rewrite rule in vercel.json here.

The real app lives in backend/main.py. We add backend/ to sys.path so its
internal imports (`from ml import inference`) resolve, then mount the app
under /api so that a request to /api/stats reaches the FastAPI route /stats.
"""

import os
import sys

# Make backend/ importable — models and demo_data.json are resolved via
# __file__ inside backend/, so no path rewriting is needed for data files.
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(_REPO_ROOT, "backend"))

from fastapi import FastAPI  # noqa: E402
from main import app as backend_app  # noqa: E402

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", backend_app)
