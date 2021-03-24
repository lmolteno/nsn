# this file will combine the data from the nzqa dataset, as well as the scraped json data.
import json
from urllib.request import urlopen
import pandas as pd

s_st  = [] # empty list to be filled with Scraped STandards 
ds_st = [] # empty list to be filled with DataSet STandards

scraped_fn = "../output/ncea_standards.json"
online_url = "https://catalogue.data.govt.nz/dataset/a314d10e-8da6-4640-959f-256160f9ffe4/resource/0986281d-d293-4bc5-950e-640e5bc5a07e/download/list-of-all-standards-2020.csv"

# import in json file of scraped data
with open(scraped_fn) as json_file:
    scraped = json.load(json_file)
    s_st = scraped['assessments']


# import and re-format the csv dataset provided by nzqa
print("reading csv")
ds_df = pd.read_csv(online_url) # DataSet DataFrame
ds_df.columns = ['title','number','type','version','level','credits','status','v_status','field','subfield','domain'] # rename columns to ones that don't have spaces
print("parsing csv")
for index,row in ds_df.iterrows():
    achievement = row['type'] == "Achivement"
    if row['status']  == "Registered" and row['v_status'] == "Current": # check that the standard is worth holding on to
        ds_st.append(dict(row))

print('combining the two')
# join the two, getting all the assessments from the json object and assigning them a field, subfield, and domain
# also check that the two datasets match, print and debug where they don't
standards = [] # output list of tuple objects for each standard
# produce list of unique fields, subfields, domains, and subjects
subjects = []
fields = []
subfields = []
domains = []
types = []
for scraped in s_st:
    # update subjects, types lists
    if scraped['subject']['name'] not in subjects:
        subjects.append(scraped['subject']['name'])
        
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
        print(f"ONLY SCRAPED AS{scraped['number']:<5d}")

    
    title_m = provided['title'] == scraped['title'] # title match
    if not title_m and related_entry: # if title doesn't match (and a related entry exists)
        print(f"RESOLVED     AS{scraped['number']:<5d}") # for debugging

        # check whether or not they've done the thing replacing accented letters with "?"
        # that should (i really hope) be the only time they use "?" in their titles
        if "?" in scraped['title'] or "?" in provided['title']:
            # best to use provided title, as they happen to replace with unaccented characters
            # if i'm using unaccented characters, probably i should put a disclaimer on the website
            title = provided['title']
        else: # the titles are just different wording
              # use the scraped title as these are what people would expect, what's on the website and stuff
            title = scraped['title'] # only do this if there aren't ? in the scraped title though

    # the same order as the definition in sql for ease of insertion
    outtuple = (standard_number, title, internal, type_id, version, level, credits, field_id, subfield_id)
    standards.append(outtuple)

print(standards[:5])
# Enter the data
#import psycopg2
#conn = psycopg2.connect(
    #host="db", # this is because docker! cool!
    #database="nzqa",
    #user="entry",
    #password="ilikeenteringdata")


