# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/serviceAccountKey.json ./serviceAccountKey.json
COPY app/ ./app
COPY scheduler.py .

# Expose the port FastAPI listens on
EXPOSE 8000

# Entrypoint: launch both FastAPI and scheduler in one container via uvicorn + APScheduler 
CMD ["sh", "-c", "\
    uvicorn app.main:app --host 0.0.0.0 --port $PORT & \
    python scheduler.py \
"]
