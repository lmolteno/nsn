# database maintenence dockerfile
FROM debian:buster
MAINTAINER Linus Molteno "linus@molteno.net"
ARG DEBIAN_FRONTEND=noninteractive

# debian setup
RUN apt-get update && apt-get install -y \
    curl python3-requests python3-bs4

RUN rm -rf /var/lib/apt/lists/*

ENV LANG C.UTF-8

# already done in docker-compose
# COPY ./code /code
# COPY ./output /output # this is for checking whether the user has already scraped the nzqa website
VOLUME /output
VOLUME /code
WORKDIR /code

CMD python3 ncea_scraper.py # run the python scraping script. if the current json file is older than a year, re-scrape
CMD python3 combine.py # enter the data into the database
