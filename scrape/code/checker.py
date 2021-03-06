import time
import json
import os
from datetime import datetime, timedelta
from ncea_scraper import scrape_and_dump, of, f_string
from combine import combine
import psycopg2
import psycopg2.extras

def debug_time(): # for faster/easier timestamping
    return datetime.now().strftime('%y/%m/%d %H:%M:%S')

def refresh_flag():
    return check_flag("refresh")    

def rescrape_flag():
    return check_flag("rescrape")

def check_flag(flag_name):
    print(f"[{debug_time()}] Checking if {flag_name} flag is set")
    success = False
    flag = False
    while not success:
        try:
            conn = psycopg2.connect(
                host="db",
                database=os.environ.get("POSTGRES_DB"),
                user=os.environ.get("POSTGRES_USER"),
                password=os.environ.get("POSTGRES_PASSWORD"))

            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as curs:
                curs.execute(f"SELECT EXISTS(SELECT 1 FROM flags WHERE name='{flag_name}');")
                flag = curs.fetchone()['exists']
            conn.close()
            success = True
        except psycopg2.OperationalError:
            time.sleep(5)
    return flag 

def is_empty():
    print(f"[{debug_time()}] Checking if database is empty")
    success = False  # error handling for while the Postgres is starting
    while not success:
        try:
            conn = psycopg2.connect(
                host="db",  # this is because docker! cool!
                database=os.environ.get("POSTGRES_DB"),
                user=os.environ.get("POSTGRES_USER"),
                password=os.environ.get("POSTGRES_PASSWORD"))
            empty = False
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as curs:
                curs.execute("SELECT COUNT(*) FROM subjects;")
                count = curs.fetchone()['count']
                empty = count == 0
            conn.close()
            success = True
            return empty
        except psycopg2.OperationalError:
            time.sleep(5)


def test():
    print(f"[{debug_time()}] Testing...")
    success = False  # error handling for while the Postgres is starting
    passing = True
    while not success:
        try:
            conn = psycopg2.connect(
                host="db",  # this is because docker! cool!
                database=os.environ.get("POSTGRES_DB"),
                user=os.environ.get("POSTGRES_USER"),
                password=os.environ.get("POSTGRES_PASSWORD"))
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as curs:
                curs.execute('''SELECT COUNT(*) FROM standards 
                                INNER JOIN standard_types 
                                ON standard_types.type_id = standards.type_id 
                                WHERE standards.standard_number < 90000 
                                AND standard_types.name LIKE '%Achievement%';''')
                count = curs.fetchone()['count']
                # handle for if passing is already false (for implementation of future tests)
                passing = passing and count == 0

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
                        print(
                            f"[{debug_time()}] Failed field keys")
                        print(
                            f"[{debug_time()}] Expected {expected}, got {list(field.keys())}")
                        break
                for subfield in structure['subfields']:
                    expected = ["name", "subfield_id"]
                    current = set(subfield.keys()) == set(expected)
                    if not current:
                        passing = False
                        print(
                            f"[{debug_time()}] Failed subfield keys")
                        print(
                            f"[{debug_time()}] Expected {expected}, got {list(subfield.keys())}")
                        break
                for domain in structure['domains']:
                    expected = ["name", "domain_id"]
                    current = set(domain.keys()) == set(expected)
                    if not current:
                        passing = False
                        print(
                            f"[{debug_time()}] Failed domain keys")
                        print(
                            f"[{debug_time()}] Expected {expected}, got {list(domain.keys())}")
                        break

                curs.execute('SELECT * FROM subjects;')
                subjects = curs.fetchall()

                for subject in subjects:
                    expected = ['name', 'subject_id', 'display_name']
                    current = set(subject.keys()) == set(expected)
                    if not current:
                        passing = False
                        print(
                            f"[{debug_time()}] Failed subject keys")
                        print(
                            f"[{debug_time()}] Expected {expected}, got {list(subject.keys())}")
                        break

            conn.close()
            success = True  # for connection
            return passing
        except psycopg2.OperationalError:
            time.sleep(5)


if __name__ == "__main__":
    print(f"[{debug_time()}] Starting checking")
    alreadyforcescraped = False
    while True:
        if os.path.isfile(of):  # check if the output file exists
            with open(of) as outfile:
                print(
                    f"[{debug_time()}] Loading scraped data...")
                data = json.load(outfile)
                lastupdated = datetime.strptime(data['updated'], f_string)
                # add a year to the previous time and see if it's less than now (i'm not too worried about leap years)
                olderthanayear = (
                    lastupdated + timedelta(days=365)) < datetime.now()
                # if FORCE_SCRAPE environment variable is set, scrape even if previous file is young young
                if olderthanayear or (os.environ.get("FORCE_SCRAPE") == '1' and not alreadyforcescraped) or rescrape_flag():
                    alreadyforcescraped =  os.environ.get("FORCE_SCRAPE") == 1 # only force scrape the first time around
                    print(
                        f"[{debug_time()}] File is outdated, or scrape is forced.")
                    print(
                        f"[{debug_time()}] Entering in old data to improve uptime")
                    combine()
                    print(
                        f"[{debug_time()}] Scraping")
                    scrape_and_dump(of)
                    combine()
                elif is_empty() or refresh_flag():
                    print(f"[{debug_time()}] DB empty or refresh flag")
                    combine()
                else:
                    print(
                        f"[{debug_time()}] Nothing to be done, up-to-date scrape data")

                # run testing on database
                if not test():  # if testing returns false
                    print(
                        f"[{debug_time()}] Database failed tests!")
                    print(
                        f"[{debug_time()}] Cleaning!")
                    combine()

        else:
            print(
                f"[{debug_time()}] No file exists, scraping data.")
            scrape_and_dump(of)
            combine()
        print(f"[{debug_time()}] Waiting 6 hours...")
        time.sleep(6 * (60**2))  # every n seconds (60^2 is an hour)
        print(
            f"[{debug_time()}] ======================================")
