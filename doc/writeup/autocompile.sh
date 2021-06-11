#!/bin/bash
zathura main.pdf &
while $1
do
    EVENT=$(inotifywait -s --format '%e' main.tex)
    [ $? != 0 ] && exit
    [ "$EVENT" = "MODIFY" ] || [ "$EVENT" = "MOVE_SELF" ] && xelatex --interaction=batchmode main.tex --quiet
done
