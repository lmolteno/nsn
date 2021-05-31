# syntax = docker/dockerfile:1.2
FROM python:3.9-slim-buster
WORKDIR /code
COPY requirements.txt /code/
RUN  pip install -r requirements.txt
COPY ./code /code/
COPY ./output /output/
COPY ./content /content/
COPY ./cache /cache/
CMD python3 -u checker.py
