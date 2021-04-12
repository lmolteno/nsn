import time
import json
import os
from datetime import datetime, timedelta
from ncea_scraper import scrape_and_dump, of, f_string
from combine import combine     
import psycopg2
import psycopg2.extras

def clean():
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Cleaning database")
    tables = [
            'domains',
            'fields',
            'ncea_litnum',
            'resource_categories',
            'resources',
            'standard_subject',
            'standard_types',
            'standards',
            'subfields',
            'subjects',
            'ue_literacy']
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
            with conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor) as curs:
                curs.execute("SELECT COUNT(*) FROM subjects;")
                count = curs.fetchone()['count']
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
            with conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor) as curs:
                curs.execute('''SELECT COUNT(*) FROM standards 
                                INNER JOIN standard_types 
                                ON standard_types.type_id = standards.type_id 
                                WHERE standards.standard_number < 90000 
                                AND standard_types.name LIKE '%Achievement%';''')
                count = curs.fetchone()['count']
                passing = passing and count == 0 # handle for if passing is already false (for implementation of future tests)
                
                # this tests whether or not the database is rendering column names properly
                structure = {"fields": [], "subfields": [], "domains": []}
                curs.execute('SELECT * FROM fields;')
                structure['fields'] = curs.fetchall()
                curs.execute('SELECT * FROM subfields;')
                structure['subfields'] = curs.fetchall()
                curs.execute('SELECT * FROM domains;')
                structure['domains'] = curs.fetchall()
                
                # casting as set means order doesn't matter for comparison
                for field in structure['fields']:
                    expected = ["name", "field_id"]
                    current = set(field.keys()) == set(expected)
                    if not current:
                        passing = False
                        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Failed field keys")
                        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Expected {expected}, got {list(field.keys())}")
                        break
                for subfield in structure['subfields']:
                    expected = ["name", "subfield_id"]
                    current = set(subfield.keys()) == set(expected)
                    if not current:
                        passing = False
                        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Failed subfield keys")
                        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Expected {expected}, got {list(subfield.keys())}")
                        break
                for domain in structure['domains']:
                    expected = ["name", "domain_id"]
                    current = set(domain.keys()) == set(expected)
                    if not current:
                        passing = False
                        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Failed domain keys")
                        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Expected {expected}, got {list(domain.keys())}")
                        break
                
                curs.execute('SELECT * FROM subjects;')
                subjects = curs.fetchall()
                
                for subject in subjects:
                    expected = ['name', 'subject_id', 'display_name']
                    current = set(subject.keys()) == set(expected)
                    if not current:
                        passing = False
                        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Failed subject keys")
                        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Expected {expected}, got {list(subject.keys())}")
                        break
                
            conn.close()
            success = True # for connection
            return passing
        except psycopg2.OperationalError:
            time.sleep(5)

if __name__ == "__main__":
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Starting checking")
    while True:
        if os.path.isfile(of): # check if the output file exists
            with open(of) as outfile:
                print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Loading scraped data...")
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
                    
                # run testing on database
                if not test(): # if testing returns false
                    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Database failed tests!")
                    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Cleaning!")
                    clean()
                    combine()
                    
        else:
            print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] No file exists, scraping data.")
            scrape_and_dump(of)
            clean()
            combine()
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Waiting 6 hours...")
        time.sleep(6 * (60**2)) # every n seconds (60^2 is an hour)
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] ======================================")
