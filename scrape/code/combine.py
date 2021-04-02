# this file will combine the data from the nzqa dataset, as well as the scraped json data.
import json
import requests
from urllib.request import urlopen
import pandas as pd
import psycopg2
import os
from datetime import datetime
import meilisearch # for entering in search data
from pandas.core.common import flatten

replacement_words = [
    ("M?ori", "Maori"),
    ("P?keh?", "Pakeha")
]

def combine():
    s_st  = [] # empty list to be filled with Scraped STandards 
    ds_st = [] # empty list to be filled with DataSet STandards

    scraped_fn = "/output/ncea_standards.json"
    online_url = "https://catalogue.data.govt.nz/dataset/a314d10e-8da6-4640-959f-256160f9ffe4/resource/0986281d-d293-4bc5-950e-640e5bc5a07e/download/list-of-all-standards-2020.csv"

    # import in json file of scraped data
    with open(scraped_fn) as json_file:
        scraped = json.load(json_file)
        s_st = scraped['assessments']


    # import and re-format the csv dataset provided by nzqa
    # implement caching!
    nzqafn = "../cache/nzqa.csv"
    if os.path.isfile(nzqafn):
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Using cached NZQA Dataset")
    else:
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Downloading NZQA Dataset")
        page = requests.get(online_url) # send request
        page.raise_for_status() # raise an error on a bad status
        print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
        os.makedirs(os.path.dirname(nzqafn), exist_ok=True) # make directories on the way to the caching location
        with open(nzqafn, 'w') as f:
            f.write(page.text) # save to file for later caching if there's a cache
        
    ds_df = pd.read_csv(nzqafn)
    ds_df.columns = ['title','number','type','version','level','credits','status','v_status','field','subfield','domain'] # rename columns to ones that don't have spaces
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Parsing...")
    for index,row in ds_df.iterrows():
        achievement = row['type'] == "Achivement"
        if row['status']  == "Registered" and row['v_status'] == "Current": # check that the standard is worth holding on to
            ds_st.append(dict(row))

    print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Combining the two, basing on {len(s_st)} standards')
    # join the two, getting all the assessments from the json object and assigning them a field, subfield, and domain
    # also check that the two datasets match, print and debug where they don't
    standards = [] # output list of tuple objects for each standard
    # produce list of unique fields, subfields, domains, and subjects
    subjects = []
    fields = []
    subfields = []
    domains = []
    types = []
    subject_standards = [] # join table between subjects and standards
    
    # for meilei
    search_standards = [] # list of standards to be populated for search only
    # will contain id (standard_number), title, level, credits, subject name

    # counts of errors
    mismatch  = 0
    singular  = 0
    duplicate = 0
    for scraped in s_st:
        
        #if scraped['number'] == 91154:
            #print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] I found validity!")
        
        # update subjects, types lists
        subject_tuple = (scraped['subject']['name'], scraped['subject']['display_name'])
        if subject_tuple not in subjects:
            subjects.append(subject_tuple)
        subject_id = subjects.index(subject_tuple)
        subject_standards.append((subject_id, scraped['number'])) # add join between subject and standard
        
        scraped_type = "Achievement" if scraped['achievement'] else "Unit" # conversion from bool to strings    
        if scraped_type not in types:
            types.append(scraped_type)

        # the fields needed by the db are:
        standard_number = scraped['number']
        title           = scraped['title']
        internal        = not scraped['external'] # oops, i used external true rather than internal true
        type_id         = types.index(scraped_type) # search types list for the index of the type
        version         = None # the None values will be set if a related entry in the provided dataset exists
        level           = scraped['level']
        credits         = scraped['credits']
        field_id        = None 
        subfield_id     = None
        domain_id       = None
        
        # do the replacement for the LUT of replaced words
        for word, replacement in replacement_words:
            title = title.replace(word, replacement)

        related_entry = True # this is a flag for when there is/n't a related entry in the provided dataset
        try:
            provided = next(standard for standard in ds_st if standard["number"] == scraped["number"]) # make number match
            # if there is a provided, update the fields n stuff
            if provided['field'] not in fields:
                fields.append(provided['field'])
            if provided['subfield'] not in subfields:
                subfields.append(provided['subfield'])
            if provided['domain'] not in domains:
                domains.append(provided['domain'])
                
            # these values will be null if there isn't a provided entry
            field_id    = fields.index(provided['field']) # similar to the types index gathering
            subfield_id = subfields.index(provided['subfield'])
            domain_id   = domains.index(provided['domain'])
            version     = provided['version']
            
        except StopIteration:
            related_entry = False # lower the flag
            singular += 1 # one more singular assessment
            #print(f"ONLY SCRAPED AS{scraped['number']:<5d}")

        
        title_m = provided['title'] == scraped['title'] # title match
        if not title_m and related_entry: # if title doesn't match (and a related entry exists)
            mismatch += 1 # one more mismatched assessments
            #print(f"RESOLVED     AS{scraped['number']:<5d}") # for debugging

            # check whether or not they've done the thing replacing accented letters with "?"
            # that should (i really hope) be the only time they use "?" in their titles
            if "?" in scraped['title'] or "?" in provided['title']:
                # best to use provided title, as they happen to replace with unaccented characters
                # if i'm using unaccented characters, probably i should put a disclaimer on the website
                title = provided['title']
            else: # the titles are just different wording
                # use the scraped title as these are what people would expect, what's on the website and stuff
                title = scraped['title'] # only do this if there aren't ? in the scraped title though
        
        search_standard = {"id": str(standard_number),
                           "title": title,
                           "level": level,
                           "credits": credits,
                           "internal": internal}
        
        # the same order as the definition in sql for ease of insertion
        outtuple = (standard_number, title, internal, type_id, version, level, credits, field_id, subfield_id, domain_id)
        
        # ensure no duplication
        try:
            aaaa = next(standard for standard in standards if standard[0] == outtuple[0]) # if it can already be found
            duplicate += 1
            #print(f"DUPLICATE AS{scraped['number']:<5d}")
        except StopIteration: # there is no duplicate
            #if scraped['number'] == 91154:
                #print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] I'm entering validity!")
            standards.append(outtuple)
            search_standards.append(search_standard)

    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Entering data")
    print(f"Resolved:\n{duplicate:>3d} {'Duplicates':>15s}\n{mismatch:>3d} {'Mismatches':>15s}\n{singular:>3d} {'Singulars':>15s}")

    # Enter the data
    conn = psycopg2.connect(
        host="db", # this is because docker! cool!
        database=os.environ.get("POSTGRES_DB"),
        user=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD"))
    
    # convert list of tuples into list of dictionaries
    search_subjects = [{"id": str(index), "name": subj_name[0], "display_name": subj_name[1]} for index, subj_name in enumerate(subjects)]
    
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Entering subjects and standards into Meilisearch")

    # save both the subjects and standards to the search utility
    client = meilisearch.Client('http://search:7700')
    client.index('subjects').add_documents(search_subjects)
    client.index('standards').add_documents(search_standards)
    
    # enter info
    with conn.cursor() as curs:
        # insert types ([*enumerate(types)] turns ['a','b'] to [(0,'a'), (1,'b')], assigning indicies)
        # for the subjects, which is a tuple, we need to make a better list from [0, (a,b)] to [0, a, b]
        flattened_subjects = [list(flatten(sublist)) for sublist in [*enumerate(subjects)]]
        curs.executemany("INSERT INTO standard_types (type_id, name)                   VALUES (%s,%s);", [*enumerate(types)])
        curs.executemany("INSERT INTO subjects       (subject_id, name, display_name)  VALUES (%s,%s,%s);", flattened_subjects)
        curs.executemany("INSERT INTO fields         (field_id, name)                  VALUES (%s,%s);", [*enumerate(fields)])
        curs.executemany("INSERT INTO subfields      (subfield_id, name)               VALUES (%s,%s);", [*enumerate(subfields)])
        curs.executemany("INSERT INTO domains        (domain_id, name)                 VALUES (%s,%s);", [*enumerate(domains)])
        
        curs.executemany('''INSERT INTO standards (
            standard_number,
            title,
            internal,
            type_id,
            version,
            level,
            credits,
            field_id,
            subfield_id,
            domain_id) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);''', standards)
        
        curs.executemany("INSERT INTO standard_subject (subject_id, standard_number) VALUES (%s,%s);", subject_standards)
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Committing {len(standards)} standards")
        conn.commit()

    conn.close()
