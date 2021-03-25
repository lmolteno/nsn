
print("importing")
import time
import json
import os
from datetime import datetime, timedelta
from ncea_scraper import scrape_and_dump, of, f_string
from combine import combine     
import psycopg2

def clean():
    print("cleaning database")
    tables = ['subjects','fields','subfields','domains','standard_types','subject_standard','standards']
    conn = psycopg2.connect(
        host="db", # this is because docker! cool!
        database="nzqa",
        user="nzqa",
        password="nzqa")
    
    with conn.cursor() as curs:
        curs.executemany("DELETE FROM %s;", tables)
        curs.commit()
    conn.close()

def is_empty():
    print("checking if database is empty")

    conn = psycopg2.connect(
        host="db", # this is because docker! cool!
        database="nzqa",
        user="nzqa",
        password="nzqa")
    empty = False
    with conn.cursor() as curs:
        curs.execute("SELECT COUNT(*) FROM subjects;")
        count = curs.fetchone()[0]
        empty = count == 0
    conn.close()
    return empty

if __name__ == "__main__":
    print("starting checking")
    while True:
        if os.path.isfile(of): # check if the output file exists
            with open(of) as outfile:
                print("loading file")
                data = json.load(outfile)
                lastupdated = datetime.strptime(data['updated'], f_string)
                # add a year to the previous time and see if it's less than now (i'm not too worried about leap years)
                olderthanayear = (lastupdated + timedelta(days=365)) < datetime.now() 
                # if FORCE_SCRAPE environment variable is set, scrape even if previous file is young young
                if olderthanayear or os.environ.get("FORCE_SCRAPE") == '1' or is_empty(): 
                    print("Scraping")
                    scrape_and_dump(of)
                    clean()
                    combine()
                else:
                    print("Nothing to be done, up to date scrape data")
        else:
            print("No file exists, scraping data.")
            scrape_and_dump(of)
            clean()
            combine()
        time.sleep(60**2) # every n seconds (60^2 is an hour)
