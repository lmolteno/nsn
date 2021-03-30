import time
import json
import os
from datetime import datetime, timedelta
from ncea_scraper import scrape_and_dump, of, f_string
from combine import combine     
import psycopg2

def clean():
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Cleaning database")
    tables = ['subjects','standards','fields','subfields','domains','standard_types','standard_subject']
    success = False # error handling for while the Postgres is starting
    while not success:
        try:
            conn = psycopg2.connect(
                host="db", # this is because docker! cool!
                database=os.environ.get("POSTGRES_DB"),
                user=os.environ.get("POSTGRES_USER"),
                password=os.environ.get("POSTGRES_PASSWORD"))
            
            with conn.cursor() as curs:
                for table in tables:
                    curs.execute(f"DELETE FROM {table};")
                conn.commit()
            conn.close()
            success = True
        except psycopg2.OperationalError:
            time.sleep(5)

def is_empty():
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Checking if database is empty")
    success = False # error handling for while the Postgres is starting
    while not success:
        try:
            conn = psycopg2.connect(
                host="db", # this is because docker! cool!
                database=os.environ.get("POSTGRES_DB"),
                user=os.environ.get("POSTGRES_USER"),
                password=os.environ.get("POSTGRES_PASSWORD"))
            empty = False
            with conn.cursor() as curs:
                curs.execute("SELECT COUNT(*) FROM subjects;")
                count = curs.fetchone()[0]
                empty = count == 0
            conn.close()
            success = True
            return empty
        except psycopg2.OperationalError:
            time.sleep(5)

def test():
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Testing...")
    success = False # error handling for while the Postgres is starting
    passing = True
    while not success:
        try:
            conn = psycopg2.connect(
                host="db", # this is because docker! cool!
                database=os.environ.get("POSTGRES_DB"),
                user=os.environ.get("POSTGRES_USER"),
                password=os.environ.get("POSTGRES_PASSWORD"))
            empty = False
            with conn.cursor() as curs:
                curs.execute('''SELECT COUNT(*) FROM standards 
                                INNER JOIN standard_types 
                                ON standard_types.type_id = standards.type_id 
                                WHERE standards.standard_number < 90000 
                                AND standard_types.name LIKE '%Achievement%';''')
                count = curs.fetchone()[0]
                passing = passing and count == 0 # handle for if passing is already false (for implementation of future tests)
            conn.close()
            success = True
            return empty
        except psycopg2.OperationalError:
            time.sleep(5)

if __name__ == "__main__":
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Starting checking")
    while True:
        if os.path.isfile(of): # check if the output file exists
            with open(of) as outfile:
                print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Loading file")
                data = json.load(outfile)
                lastupdated = datetime.strptime(data['updated'], f_string)
                # add a year to the previous time and see if it's less than now (i'm not too worried about leap years)
                olderthanayear = (lastupdated + timedelta(days=365)) < datetime.now() 
                # if FORCE_SCRAPE environment variable is set, scrape even if previous file is young young
                if olderthanayear or os.environ.get("FORCE_SCRAPE") == '1': 
                    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] File is outdated, or scrape is forced.")
                    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Entering in old data to improve uptime")
                    clean()
                    combine()
                    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Scraping")
                    scrape_and_dump(of)
                    clean()
                    combine()
                elif is_empty():
                    clean()
                    combine()
                else:
                    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Nothing to be done, up-to-date scrape data")
        else:
            print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] No file exists, scraping data.")
            scrape_and_dump(of)
            clean()
            combine()
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Waiting an hour...")
        time.sleep(60**2) # every n seconds (60^2 is an hour)
