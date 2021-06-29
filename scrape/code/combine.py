# this file will combine the data from the nzqa dataset, as well as the scraped json data.
import json
import requests
from urllib.request import urlopen
import pandas as pd
import psycopg2
import os
from datetime import datetime
import meilisearch  # for entering in search data
from pandas.core.common import flatten

# functions for getting information to be combined
from custom_content import get_content
from literacy_numeracy import get_ncea_litnum, get_ue_lit


replacement_words = [
    ("M?ori", "Maori"),
    ("P?keh?", "Pakeha")
]

def debug_time(): # for faster/easier timestamping
    return datetime.now().strftime('%y/%m/%d %H:%M:%S')

def clean(conn):
    tables = [
        'standards',
        'custom_content',
        'domains',
        'fields',
        'ncea_litnum',
        'resource_categories',
        'resources',
        'standard_subject',
        'standard_types',
        'subfields',
        'subjects',
        'ue_literacy',
        'flags']
    with conn.cursor() as curs:
        for table in tables:
            curs.execute(f"DELETE FROM {table};")
    conn.commit()


def get_dataset():
    online_url = "https://catalogue.data.govt.nz/dataset/a314d10e-8da6-4640-959f-256160f9ffe4/resource/0986281d-d293-4bc5-950e-640e5bc5a07e/download/list-of-all-standards-2020.csv"

    ds_st = []  # empty list to be filled with DataSet STandards

    # import and re-format the csv dataset provided by nzqa
    # implement caching!
    nzqafn = "../cache/nzqa.csv"
    if os.path.isfile(nzqafn):
        print(
            f"[{debug_time()}] Using cached NZQA Dataset")
    else:
        print(
            f"[{debug_time()}] Downloading NZQA Dataset")
        page = requests.get(online_url)  # send request
        page.raise_for_status()  # raise an error on a bad status
        print(f'[{debug_time()}] Caching')
        # make directories on the way to the caching location
        os.makedirs(os.path.dirname(nzqafn), exist_ok=True)
        with open(nzqafn, 'w') as f:
            # save to file for later caching if there's a cache
            f.write(page.text)

    # read cached file
    ds_df = pd.read_csv(nzqafn)
    ds_df.columns = ['title', 'number', 'type', 'version', 'level', 'credits', 'status',
                     'v_status', 'field', 'subfield', 'domain']  # rename columns to ones that don't have spaces
    print(f"[{debug_time()}] Parsing...")
    for _, row in ds_df.iterrows():
        # check that the standard is worth holding on to
        if row['status'] == "Registered" and row['v_status'] == "Current":
            ds_st.append(dict(row))

    return ds_st


def get_scraped():
    s_st = []  # empty list to be filled with Scraped STandards
    s_re = []  # empty list to be filled with Scraped REsources
    scraped_fn = "/output/ncea_standards.json"

    # import in json file of scraped data
    with open(scraped_fn) as json_file:
        scraped = json.load(json_file)
        s_st = scraped['assessments']
        s_re = scraped['resources']

    return s_st, s_re

def get_subjects():
    # refer to issue #33 for more information, but basically I must make sure that the subject ids remain constant from now
    subject_fn = '../cache/subjects.json'
    
    subjects = [] # if there isn't a file
    if os.path.isfile(subject_fn):
        print(f"[{debug_time()}] Using previous list of subject IDs")
    
        # open the file and read the subject list    
        with open(subject_fn) as f:
            subjects = json.load(f)['subjects']
        
    return subjects

def store_subjects(subjects):
    # second part of issue #33
    subject_fn = '../cache/subjects.json'
    
    with open(subject_fn, 'w') as f:
       json.dump({'subjects': subjects}, f)

    return True

def combine():

    s_st, s_re = get_scraped()
    ds_st = get_dataset()
    ln_dict = get_ncea_litnum()
    uelit_dict = get_ue_lit()

    print(f'[{debug_time()}] Combining/Entering the four, basing on {len(s_st)} standards')
    # join the two, getting all the assessments from the json object and assigning them a field, subfield, and domain
    # also check that the two datasets match, print and debug where they don't
    standards = []  # output list of tuple objects for each standard
    # produce list of unique fields, subfields, domains, and subjects
    # for subjects we have to do special things for #33
    subjects = get_subjects() # get current subject_ids 
    max_subject_id = 0
    if len(subjects) > 0:
        max_subject_id = max(subjects, key=lambda s: s['id'])['id'] # max subject id we already know

    fields = []
    subfields = []
    domains = []
    types = []
    # format is (subject_id, standard_number)
    subject_standards = []  # join table between subjects and standards
    # format is {'standard_number': {'literacy': bool, 'numeracy': bool}}
    ncea_litnum = []  # join table for NCEA literacy/numeracy credits and standards
    # format is {'standard_number': {'reading': bool, 'writing': bool}}
    ue_lit = []  # join table for UE reading/writing credits and standards

    # for meili
    search_standards = []  # list of standards to be populated for search only
    # will contain id (standard_number), title, level, credits, subject name

    # counts of errors (for cooler logs)
    mismatch = 0
    singular = 0
    duplicate = 0
    for scraped in s_st:

        # update subjects and types lists
        subject_info = scraped['subject']
        try:
            subject_info = next(subject for subject in subjects if subject['name'] == subject_info['name'])
            max_subject_id = max(max_subject_id, subject_info['id']) # update max id (for use when we don't know)
            # that will update it to be the subject it already has
            # all of the try: next() idioms I have in this will take a lot of time.
            # maybe I should try to improve performance, it takes a couple minutes for the whole scrape.
            # maybe this is a good opportunity for rust!!
        except StopIteration:
            # we don't have this subject in our list of known subjects
            subject_info['id'] = max_subject_id
            subjects.append(subject_info)
            max_subject_id += 1 # increment

        subject_id = subject_info['id'] # this will either have been set by the known list or by the max_subject_id 
        # add join between subject and standard
        subject_standards.append((subject_id, scraped['number']))

        # conversion from bool to strings
        scraped_type = "Achievement" if scraped['achievement'] else "Unit"
        if scraped_type not in types:
            types.append(scraped_type)

        # the fields needed by the db are:
        standard_number = scraped['number']
        title = scraped['title']
        # oops, i used external true rather than internal true
        internal = not scraped['external']
        # search types list for the index of the type
        type_id = types.index(scraped_type)
        version = None  # the None values will be set if a related entry in the provided dataset exists
        level = scraped['level']
        credits = scraped['credits']
        field_id = None
        subfield_id = None
        domain_id = None

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
            # this really isn't a problem, just null null
            pass

        try:
            # make number match
            _ = next(
                litnum for litnum in ncea_litnum if litnum["standard_number"] == ncea_row["standard_number"])
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
            pass

        try:
            # make number match
            _ = next(
                lit for lit in ue_lit if lit["standard_number"] == ue_row["standard_number"])
        except StopIteration:
            ue_lit.append(ue_row)

        # do the replacement for the LUT of replaced words
        for word, replacement in replacement_words:
            title = title.replace(word, replacement)

        # this is a flag for when there is/n't a related entry in the provided dataset
        related_entry = True
        try:
            # make number match
            provided = next(
                standard for standard in ds_st if standard["number"] == scraped["number"])
            # if there is a provided, update the fields n stuff
            if provided['field'] not in fields:
                fields.append(provided['field'])
            if provided['subfield'] not in subfields:
                subfields.append(provided['subfield'])
            if provided['domain'] not in domains:
                domains.append(provided['domain'])

            # these values will be null if there isn't a provided entry
            # similar to the types index gathering
            field_id = fields.index(provided['field'])
            subfield_id = subfields.index(provided['subfield'])
            domain_id = domains.index(provided['domain'])
            version = provided['version']

        except StopIteration:
            related_entry = False  # lower the flag for there being an entry in the csv dataset
            singular += 1  # one more singular assessment
            #print(f"ONLY SCRAPED AS{scraped['number']:<5d}")

        title_m = provided['title'] == scraped['title']  # title match
        # if title doesn't match (and a related entry exists)
        if not title_m and related_entry:
            mismatch += 1  # one more mismatched assessments
            # print(f"RESOLVED     AS{scraped['number']:<5d}") # for debugging

            # check whether or not they've done the thing replacing accented letters with "?"
            # that should (i really hope) be the only time they use "?" in their titles
            if "?" in scraped['title'] or "?" in provided['title']:
                # best to use provided title, as they happen to replace with unaccented characters
                # if i'm using unaccented characters, probably i should put a disclaimer on the website
                title = provided['title']
            else:  # the titles are just different wording
                # use the scraped title as these are what people would expect, what's on the website and stuff
                # only do this if there aren't ? in the scraped title though
                title = scraped['title']
        
        # entry for the search database
        asus_number = f"AS{standard_number}" if standard_number > 90000 else f"US{standard_number}"
        search_standard = {"id": str(standard_number),
                           "other_number": asus_number,
                           "title": title,
                           "level": level,
                           "credits": credits,
                           "literacy": ncea_row['literacy'],
                           "numeracy": ncea_row['numeracy'],
                           "reading": ue_row['reading'],
                           "writing": ue_row['writing'],
                           "internal": internal,
                           "subject_id": [subject_id]}
        
        # entry for the postgresql database
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
            # if it can already be found in the standards list
            _ = next(
                standard for standard in standards if standard['standard_number'] == outdict['standard_number']
            )
            duplicate += 1
            # if it already exists in the search standard, update the subjects list inside it, for frontend reasons (#17)
            searched = next(
                standard for standard in search_standards if int(standard['id']) == outdict['standard_number']
            )
            # print(f"AS{outdict['standard_number']} is a duplicate!")
            # i don't need to have an if here because it will raise an exception if it doesnt exist      
            # so, assuming it exists:
            all_subjects = searched['subject_id'] + [subject_id]
            all_subjects = [*{*all_subjects}] # convert to set (unique only) and then back to a list
            searched['subject_id'] = all_subjects # the next() function returns an object (pointery thing) that modifies the object in the list
            # the code i used to test this was:
            # >>> a = []
            # >>> for i in range(10):
            # ...     a.append({"a": i})
            # >>> a
            # [{'a': 0}, {'a': 1}, {'a': 2}, {'a': 3}, {'a': 4}, {'a': 5}, {'a': 6}, {'a': 7}, {'a': 8}, {'a': 9}]
            # >>> b = next(b for b in a if b['a'] == 1)
            # >>> b['a'] = 10
            # >>> a
            # [{'a': 0}, {'a': 10}, {'a': 2}, {'a': 3}, {'a': 4}, {'a': 5}, {'a': 6}, {'a': 7}, {'a': 8}, {'a': 9}]
            # you can see that the list a is mutated to have the second element have 'a' = 10, as opposed to the original 'a' = 1 in that element
            # i really hope this doesn't come back to bite me :(
        except StopIteration:  # there is no duplicate
            standards.append(outdict)
            search_standards.append(search_standard)

    print(
        f"Resolved:\n{duplicate:>3d} {'Duplicates':>10s}\n{mismatch:>3d} {'Mismatches':>10s}\n{singular:>3d} {'Singulars':>10s}")

    print(f"[{debug_time()}] Storing subjects as JSON...")
    store_subjects(subjects)

    # Resources!
    print(f"[{debug_time()}] Processing {len(s_re)} resources...")
    categories = []  # list of categories to go into the database
    resources = []  # list of resource dicts to go into the database
    duplicate = 0  # counter for duplicates that i resolve
    for resource in s_re:
        # first verify that the resource references a standard that exists (not level 4 or anything)
        try:
            standard = next(
                standard for standard in standards if standard['standard_number'] == resource['standard_number'])
        except StopIteration:  # none such standard exists
            continue  # skip

        # update list of categories
        if resource['category'] not in categories:
            categories.append(resource['category'])
        category_id = categories.index(resource['category'])

        # the rest of the information goes straight into the dict
        # replace with int pointer to id of category
        resource['category'] = category_id

        # check for duplicate
        try:
            _ = next(prev for prev in resources if
                     prev['nzqa_url'] == resource['nzqa_url'] and
                     prev['year'] == resource['year'] and
                     prev['standard_number'] == resource['standard_number'] and
                     prev['category'] == resource['category'])
            duplicate += 1
        except StopIteration:  # there is no duplicate, so it reaches the stopiteration endpoint
            resources.append(resource)

    print(f"[{debug_time()}] Resolved {duplicate} duplicate resources")

    # custom content (#30)
    print(f"[{debug_time()}] Getting custom content...")
    contents = get_content() # this is a list of objects
    # each object represents the content for a subject
    # {
    #   subject_id
    #   level_1 -> list of html objects
    #   level_2 -> ''
    #   level_3 -> ''
    #   general -> '' for the top of the subject page
    # }
    db_contents = [] # this will contain tuples of (subject_id, level, html) and level can be null
    print(f"[{debug_time()}] Processing custom content...")
    for content in contents:
        sections = [
            ('level_1',1),
            ('level_2',2),
            ('level_3',3),
            ('general', None)
        ]
        for section in sections:
            if section[0] in content.keys():
                for html in content[section[0]]:
                    outtuple = (content['subject'], section[1], html)
                    db_contents.append(outtuple)

    print(f"[{debug_time()}] Entering all data")

    # Enter the data
    conn = psycopg2.connect(host="db",  # this is because docker! cool!
                            database=os.environ.get("POSTGRES_DB"),
                            user    =os.environ.get("POSTGRES_USER"),
                            password=os.environ.get("POSTGRES_PASSWORD"))


    print(f"[{debug_time()}] Entering subjects and standards into Meilisearch")

    # save both the subjects and standards to the search utility
    client = meilisearch.Client('http://search:7700')
    client.index('subjects').add_documents(subjects)
    client.index('standards').add_documents(search_standards)
    
    print(f"[{debug_time()}] Cleaning PostgreSQL")
    clean(conn)

    print(f"[{debug_time()}] Entering subjects and standards into PostgreSQL")
    # enter info
    with conn.cursor() as curs:
        # insert types ([*enumerate(types)] turns ['a','b'] to [(0,'a'), (1,'b')], assigning indicies)
        # for the subjects, which is a dict, we need to make a list from {'id': 0, 'name': a, 'display_name': b} to [0, a, b]
        flattened_subjects = [[s['id'], s['name'], s['display_name']] for s in subjects]
        curs.executemany("INSERT INTO standard_types (type_id, name)                   VALUES (%s,%s);", [*enumerate(types)])
        curs.executemany("INSERT INTO subjects       (subject_id, name, display_name)  VALUES (%s,%s,%s);", flattened_subjects)
        curs.executemany("INSERT INTO fields         (field_id, name)                  VALUES (%s,%s);", [*enumerate(fields)])
        curs.executemany("INSERT INTO subfields      (subfield_id, name)               VALUES (%s,%s);", [*enumerate(subfields)])
        curs.executemany("INSERT INTO domains        (domain_id, name)                 VALUES (%s,%s);", [*enumerate(domains)])

        # insert a dict into a table
        # this should be easier, oh my god
        # i'm doing this because there are so many columns to enter, it looks super frickin messy (but it would be messier if
        # I did this with the normal SQL statement thing
        cols = list(standards[0].keys())  # get all the column names

        vals = [[standard[x] for x in cols]
                for standard in standards]  # get all the values
        # get all the %s strings you need for substituting into the query
        vals_str_list = ["%s"] * len(vals[0])
        vals_str = ", ".join(vals_str_list)  # add commas between them

        curs.executemany("INSERT INTO standards ({cols}) VALUES ({vals_str})".format(
            cols=", ".join(cols), vals_str=vals_str), vals)  # combine it all

        # insert relational join table for link between standards and subjects
        curs.executemany(
            "INSERT INTO standard_subject (subject_id, standard_number) VALUES (%s,%s);", subject_standards)
        # insert literacy/numeracy/reading/writing
        # flatten dicts to just the values (with a good order)
        # the order is standard_number, literacy, numeracy
        # and also     standard_number, reading , writing
        ncea_vals = [list(row.values()) for row in ncea_litnum]
        ue_vals = [list(row.values()) for row in ue_lit]
        curs.executemany(
            "INSERT INTO ncea_litnum (standard_number, literacy, numeracy) VALUES (%s,%s,%s);", ncea_vals) 
        curs.executemany(
            "INSERT INTO ue_literacy (standard_number, reading , writing ) VALUES (%s,%s,%s);", ue_vals)

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
        curs.executemany(
            "INSERT INTO resources (standard_number, category, year, title, nzqa_url, filepath) VALUES (%s,%s,%s, %s,%s,%s);", resource_tuples)

        # insert custom content
        curs.executemany(
            "INSERT INTO custom_content (subject_id, level, html) VALUES (%s, %s, %s);",
            db_contents
        )
        print(f"[{debug_time()}] Committing...")
        conn.commit()

    conn.close()
