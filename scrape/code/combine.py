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

def get_dataset():
    online_url = "https://catalogue.data.govt.nz/dataset/a314d10e-8da6-4640-959f-256160f9ffe4/resource/0986281d-d293-4bc5-950e-640e5bc5a07e/download/list-of-all-standards-2020.csv"
    
    ds_st = [] # empty list to be filled with DataSet STandards    
    
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
        
    # read cached file
    ds_df = pd.read_csv(nzqafn)
    ds_df.columns = ['title','number','type','version','level','credits','status','v_status','field','subfield','domain'] # rename columns to ones that don't have spaces
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Parsing...")
    for index,row in ds_df.iterrows():
        achievement = row['type'] == "Achivement"
        if row['status']  == "Registered" and row['v_status'] == "Current": # check that the standard is worth holding on to
            ds_st.append(dict(row))
            
    return ds_st

def get_scraped():
    s_st  = [] # empty list to be filled with Scraped STandards 
    s_re = [] # empty list to be filled with Scraped REsources
    scraped_fn = "/output/ncea_standards.json"

    # import in json file of scraped data
    with open(scraped_fn) as json_file:
        scraped = json.load(json_file)
        s_st = scraped['assessments']
        s_re = scraped['resources']
        
    return s_st, s_re

def get_ncea_litnum():
    
    # get the literacy/numeracy xls spreadsheet
    litnum_url = "https://www.nzqa.govt.nz/assets/qualifications-and-standards/qualifications/ncea/NCEA-subject-resources/Literacy-and-Numeracy/literacy-numeracy-assessment-standards-April-2019.xls"
    litnum_fn = "../cache/litnum.xls"
    if os.path.isfile(litnum_fn): # if it's cached, use it
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Using cached Literacy and Numeracy data")
    else: # download it
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Downloading Literacy and Numeracy data")
        page = requests.get(litnum_url) # send request
        page.raise_for_status() # raise an error on a bad status
        print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
        os.makedirs(os.path.dirname(litnum_fn), exist_ok=True) # make directories on the way to the caching location
        with open(litnum_fn, 'wb') as f:
            f.write(page.content) # save to file for later caching if there's a cache
            
    # read it with pandas
    ln_df = pd.read_excel(litnum_fn, header=1) # header=1 because the header is on the second row
    # 'Registered' is the standard number
    # 'Title' is the title, with macrons!
    # 'Literacy' is either Y or blank
    # 'Numeracy' is either Y or blank
    # 'Status' is either 'Expiring', 'Registered', or 'Expired'
    ln_dict = {} # this dict will be filled with key-value pairs for sn: {'literacy': bool, 'numeracy': bool}
    print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Parsing...')
    for index, row in ln_df.iterrows():
        sn = int(row['Registered'])
        title = row['Title']
        literacy = str(row['Literacy']).upper().strip() == "Y"
        numeracy = str(row['Numeracy']).upper().strip() == "Y"
        status = row['Status']
        if status == 'Registered':
            ln_dict[sn] = {'literacy': literacy, 'numeracy': numeracy}
            
    return ln_dict

def get_ue_lit():
    # get the UE literacy xls*X* spreadsheet (the X is frustrating because I need a different engine to actually reference it)
    uelit_url = "https://www.nzqa.govt.nz/assets/qualifications-and-standards/Awards/University-Entrance/UE-Literacy-List/University-Entrance-Literacy-list-from-1-January-2020-1.xlsx"
    uelit_fn = "../cache/uelit.xlsx"
    if os.path.isfile(uelit_fn): # if it's cached, use it
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Using cached UE Literacy data")
    else: # download it
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Downloading UE Literacy data")
        page = requests.get(uelit_url) # send request
        page.raise_for_status() # raise an error on a bad status
        print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
        os.makedirs(os.path.dirname(uelit_fn), exist_ok=True) # make directories on the way to the caching location
        with open(uelit_fn, 'wb') as f:
            f.write(page.content) # save to file for later caching if there's a cache
    
    # read it with pandas (uelit dataframe)
    uelit_df = pd.read_excel(uelit_fn, header=1, engine='openpyxl') # header=1 because the header is on the second row
    # 'ID' is the standard number
    # 'Title' is the title, with macrons!
    # 'Reading' is either Y or N
    # 'Writing' is either Y or N
    # 'Subject Reference' is e.g. Accounting 3.1, except they mispelled some things so i can't use it. :(
    uelit_dict = {} # this dict will be filled with key-value pairs for sn: {'reading': bool, 'writing': bool}
    print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Parsing...')
    for index, row in uelit_df.iterrows():
        # THERE IS A SINGLE ROW thAT DOESn'T HAVE AN ID BECAUSE AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        sn = row['ID']
        try:
            sn = int(sn)
        except ValueError:
            continue # ignore it
        title = row['Title']
        reading = str(row['Reading']).upper().strip() == "Y" # I have to strip it because there are sometimes random spaces
        writing = str(row['Writing']).upper().strip() == "Y"
        uelit_dict[sn] = {'reading': reading, 'writing': writing}
        
    return uelit_dict

def combine():
    
    s_st, s_re = get_scraped()
    ds_st = get_dataset()
    ln_dict = get_ncea_litnum()
    uelit_dict = get_ue_lit()
    
    print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Combining/Entering the four, basing on {len(s_st)} standards')
    # join the two, getting all the assessments from the json object and assigning them a field, subfield, and domain
    # also check that the two datasets match, print and debug where they don't
    standards = [] # output list of tuple objects for each standard
    # produce list of unique fields, subfields, domains, and subjects
    subjects = []
    fields = []
    subfields = []
    domains = []
    types = []
    # format is (subject_id, standard_number)
    subject_standards = [] # join table between subjects and standards
    # format is {'standard_number': {'literacy': bool, 'numeracy': bool}}
    ncea_litnum = [] # join table for NCEA literacy/numeracy credits and standards    
    # format is {'standard_number': {'reading': bool, 'writing': bool}}
    ue_lit = [] # join table for UE reading/writing credits and standards
    
    # for meili
    search_standards = [] # list of standards to be populated for search only
    # will contain id (standard_number), title, level, credits, subject name

    # counts of errors (for cooler logs)
    mismatch  = 0
    singular  = 0
    duplicate = 0
    for scraped in s_st:
        
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
        
        # handle NCEA literacy and numeracy
        # default to false, false
        ncea_row = {'standard_number': standard_number,
                    'literacy': False,
                    'numeracy': False}
        try:
            info = ln_dict[standard_number]
            ncea_row = {'standard_number': standard_number,
                        'literacy': info['literacy'],
                        'numeracy': info['numeracy']}
        except KeyError:
            # it isn't mentioned
            # this really isn't a problem
            # i don't know what to do to make it do nothing
            a = 1 # mmhm. relevant.
            
        try:
            dup = next(litnum for litnum in ncea_litnum if litnum["standard_number"] == ncea_row["standard_number"]) # make number match
        except StopIteration:
            ncea_litnum.append(ncea_row)
        
        # handle UE literacy
        ue_row = {'standard_number': standard_number,
                  'reading': False,
                  'writing': False}
        try:
            info = uelit_dict[standard_number]
            ue_row = {'standard_number': standard_number,
                      'reading': info['reading'],
                      'writing': info['writing']}
        except KeyError:
            a = 1
        
        try:
            dup = next(lit for lit in ue_lit if lit["standard_number"] == ue_row["standard_number"]) # make number match
        except StopIteration:
            ue_lit.append(ue_row)
            
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
                           "literacy": ncea_row['literacy'],
                           "numeracy": ncea_row['numeracy'],
                           "reading": ue_row['reading'],
                           "writing": ue_row['writing'],
                           "internal": internal}  
        
        outdict = {"standard_number": standard_number,
                   "title": title,
                   "internal": internal,
                   "type_id": type_id,
                   "version": version,
                   "level": level,
                   "credits": credits,
                   "field_id": field_id,
                   "subfield_id": subfield_id,
                   "domain_id": domain_id}
        
        # ensure no duplication
        try:
            aaaa = next(standard for standard in standards if standard['standard_number'] == outdict['standard_number']) # if it can already be found
            duplicate += 1
            #print(f"DUPLICATE AS{scraped['number']:<5d}")
        except StopIteration: # there is no duplicate
            standards.append(outdict)
            search_standards.append(search_standard)
    
    print(f"Resolved:\n{duplicate:>3d} {'Duplicates':>15s}\n{mismatch:>3d} {'Mismatches':>15s}\n{singular:>3d} {'Singulars':>15s}")
    
    # Resource handling
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Processing {len(s_re)} resources...")
    categories = [] # list of categories to go into the database
    resources = [] # list of resource dicts to go into the database
    duplicate = 0 # counter for duplicates that i resolve
    for resource in s_re:
        # update list of categories
        if resource['category'] not in categories:
            categories.append(resource['category'])
        category_id = categories.index(resource['category'])
        
        # the rest of the information goes straight into the dict
        resource['category'] = category_id # replace with int pointer to id of category
        
        #check for duplicate URLs
        try:
            dupe = next(prev for prev in resources if 
                            prev['nzqa_url'] == resource['nzqa_url'] and 
                            prev['year'] == resource['year'] and
                            prev['standard_number'] == resource['standard_number'] and
                            prev['category'] == resource['category'])
            duplicate += 1
        except StopIteration: # there is no duplicate, so it reaches the stopiteration endpoint
            resources.append(resource)

    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Resolved {duplicate} duplicates")
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Entering all data")

    # Enter the data
    conn = psycopg2.connect(host="db", # this is because docker! cool!
                            database=os.environ.get("POSTGRES_DB"),
                            user=os.environ.get("POSTGRES_USER"),
                            password=os.environ.get("POSTGRES_PASSWORD"))
    
    # convert list of tuples into list of dictionaries for meilisearch
    search_subjects = [{"id": str(index),
                        "name": subj_name[0],
                        "display_name": subj_name[1]} for index, subj_name in enumerate(subjects)]
    
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
        
        # insert a dict into a table
        # this should be easier, oh my god
        # i'm doing this because there are so many columns to enter, it looks super frickin messy
        cols = list(standards[0].keys()) # get all the column names

        vals = [[standard[x] for x in cols] for standard in standards] # get all the values
        vals_str_list = ["%s"] * len(vals[0]) # get all the %s strings you need for substituting into the query
        vals_str = ", ".join(vals_str_list) # add commas between them

        curs.executemany("INSERT INTO standards ({cols}) VALUES ({vals_str})".format(
                    cols=", ".join(cols), vals_str=vals_str), vals) # combine it all
        
        # insert relational join table for link between standards and subjects
        curs.executemany("INSERT INTO standard_subject (subject_id, standard_number) VALUES (%s,%s);", subject_standards)
        # insert literacy/numeracy/reading/writing
        # flatten dicts to just the values (with a good order)
        # the order is standard_number, literacy, numeracy
        # and also     standard_number, reading , writing
        ncea_vals = [list(row.values()) for row in ncea_litnum]
        ue_vals   = [list(row.values()) for row in ue_lit]
        curs.executemany("INSERT INTO ncea_litnum (standard_number, literacy, numeracy) VALUES (%s,%s,%s);", ncea_vals)
        curs.executemany("INSERT INTO ue_literacy (standard_number, reading , writing ) VALUES (%s,%s,%s);", ue_vals)
        
        # handle the resources and the cateogires
        curs.executemany("INSERT INTO resource_categories (category_id, name) VALUES (%s, %s);", [*enumerate(categories)])
        # convert list of dicts to list of tuples with the right order
        resource_tuples = [(
            r['standard_number'],
            r['category'],
            r['year'],
            r['title'],
            r['nzqa_url'],
            r['filepath']) for r in resources]
        curs.executemany("INSERT INTO resources (standard_number, category, year, title, nzqa_url, filepath) VALUES (%s,%s,%s, %s,%s,%s);", resource_tuples)
        
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Committing...")
        conn.commit()

    conn.close()
