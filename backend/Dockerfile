# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for local storage
RUN mkdir -p /app/data/audio /app/data/sessions /app/data/metadata

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Run the application
# Railway provides $PORT env variable - use it if available, otherwise default to 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
