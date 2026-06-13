FROM python:3.12-alpine

WORKDIR /app
COPY . .

EXPOSE 5000
CMD ["python", "backend.py"]
