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
print("printing csv")
for index,row in ds_df.iterrows():
    achievement = row['type'] == "Achivement"
    if row['status']  == "Registered" and row['v_status'] == "Current": # check that the standard is worth holding on to
        ds_st.append(dict(row))

# join the two, getting all the assessments from the json object and assigning them a field, subfield, and domain
# also check that the two datasets match, print and debug where they don't
out = [] # output list of dict objects for each standard
# produce list of unique fields, subfields, domains, and subjects
subjects = []
fields = []
subfields = []
domains = []
for scraped in s_st[:1]:
    outdict = {}
    provided = next(standard for standard in ds_st if standard["number"] == scraped["number"]) # make number match
    
    # update subjects, fields, subfields, domains lists
    if scraped['subject']['name'] not in subjects:
        subjects.append(scraped['subject']['name'])
    if provided['field'] not in fields:
        fields.append(provided['field'])
    if provided['subfield'] not in subfields:
        subfields.append(provided['subfield'])
    if provided['domain'] not in domains:
        domains.append(provided['domain'])
    
    # check that info matches
    title_m = provided['title'] == scraped['title'] # title match
    level_m = provided['level'] == scraped['level'] # level match
    if level_m and title_m: # if title and level match
        # the fields needed by the db are:
        #standard_number
        #title
        #internal
        #type_id 
        #version 
        #level 
        #credits 
        #field_id 
        #subfield_id 
        #domain_id 
        outdict = {}
    print(scraped)

# Enter the data
#import psycopg2
#conn = psycopg2.connect(
    #host="db", # this is because docker! cool!
    #database="nzqa",
    #user="entry",
    #password="ilikeenteringdata")


