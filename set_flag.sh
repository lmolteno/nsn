#!/bin/bash

if [[ $* == *--check* ]]
then
    echo "Flags set:"
    docker-compose exec db psql -U nzqa -c "SELECT * FROM flags;" | sed -n '/-\+/,/(0 rows)/{/-\+/!{/(.\+)/!p}}' | sed 's/^ *//g'
else
    docker-compose exec db psql -U nzqa -c "INSERT INTO flags (name) VALUES ('$1');"
    echo "Flags set:"
    docker-compose exec db psql -U nzqa -c "SELECT * FROM flags;" | sed -n '/-\+/,/(.\+)/{/-\+/!{/(.\+)/!p}}' | sed 's/^ *//g'
fi