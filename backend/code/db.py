import psycopg2
import os
from psycopg2.extras import RealDictCursor

from flask import current_app, g
from flask.cli import with_appcontext

def get_db():
    if 'postgres_db' not in g:
        db_username = os.environ['POSTGRES_USER']
        db_password = os.environ['POSTGRES_PASSWORD']
        db_name = os.environ['POSTGRES_DB']
        g.postgres_db  = psycopg2.connect(dbname=db_name, user=db_username, host="db", password=db_password)        
        g.postgres_db.cursor_factory = RealDictCursor

    return g.postgres_db


def close_db(e=None):
    db = g.pop('postgres_db', None)

    if db is not None:
        db.close()
        
def init_app(app):
    app.teardown_appcontext(close_db)
