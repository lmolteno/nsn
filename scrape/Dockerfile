# syntax = docker/dockerfile:1.2
FROM python:3.9-slim-buster
MAINTAINER Linus Molteno "linus@molteno.net"
WORKDIR /code
COPY requirements.txt /code/
RUN  pip install -r requirements.txt
COPY ./code /code/
COPY ./output /output
# run the python scraping script. if the current json file is older than a year, re-scrape
# CMD python3 ncea_scraper.py
# combine dataset and enter into the database
# CMD python3 combine.py
CMD python3 -u checker.py
