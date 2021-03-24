# backend dockerfile
FROM debian:buster
MAINTAINER Tim Molteno "tim@4i.nz"
ARG DEBIAN_FRONTEND=noninteractive

# debian setup
RUN apt-get update && apt-get install -y \
    curl python3-pip python3-dateutil python3-psycopg2 \
    python3-flask python3-flask-script \
    python3-flask-cors

RUN rm -rf /var/lib/apt/lists/*

# Install tart python packages
RUN pip3 install --no-cache-dir flask-jwt-extended

ENV LANG C.UTF-8

# COPY ./code /code
VOLUME /code
WORKDIR /code

ENV FLASK_APP=server
ENV FLASK_DEBUG=1
ENV FLASK_ENV=development
ENV FLASK_RUN_PORT=3000

EXPOSE 3000

# CMD flask run --no-reload -h0.0.0.0
CMD flask run -h0.0.0.0
