# syntax = docker/dockerfile:1.2
FROM python:3.9-slim-buster
MAINTAINER Linus Molteno "linus@molteno.net"
WORKDIR /code
COPY requirements.txt /code/
RUN --mount=type=cache,target=/root/.cache \
    pip install -r requirements.txt
COPY ./code /code/
# run the python scraping script. if the current json file is older than a year, re-scrape
ENV FLASK_APP /code/server.py
EXPOSE 5000
CMD flask run --host=0.0.0.0
