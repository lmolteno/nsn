# syntax = docker/dockerfile:1.2
FROM python:3.9-slim-buster
LABEL MAINTAINER Linus Molteno "linus@molteno.net"
WORKDIR /code
COPY requirements.txt /code/
RUN  pip install -r requirements.txt
COPY ./code /code/
EXPOSE 3000
CMD python server.py