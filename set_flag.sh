#!/bin/bash

docker-compose exec db psql -U nzqa -c "INSERT INTO flags (name) VALUES ('$1');"
