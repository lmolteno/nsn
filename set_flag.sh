#!/bin/bash

if [[ $* == *--check* ]]
then
    docker-compose exec db psql -U nzqa -c "SELECT * FROM flags;"
else
    docker-compose exec db psql -U nzqa -c "INSERT INTO flags (name) VALUES ('$1');"
    docker-compose exec db psql -U nzqa -c "SELECT * FROM flags;"
fi