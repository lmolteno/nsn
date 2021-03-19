# this file will combine the data from the nzqa dataset, as well as the scraped json data.
import csv
import json

s_st  = [] # empty list to be filled with Scraped STandards 
ds_st = [] # empty list to be filled with DataSet STandards

# import in json file of scraped data
with open('ncea_subject_assessments.json') as json_file:
    scraped = json.load(json_file)
    s_st = scraped['assessments']

# import and re-format the csv dataset provided by nzqa
with open('list-of-all-standards-2020.csv') as csv_file:
    reader = csv.DictReader(csv_file)
    for row in reader:
        row['title'] = row.pop('Standard Title') # they put spaces in their column names! :(
        row['number'] = int(row.pop('Standard Number'))
        row['achievement'] = row.pop('Standard Type') == "Achievement"
        row['version'] = int(row.pop('Standard Version'))
        row['level'] = int(row.pop('Standard Level'))
        row['credits'] = int(row.pop('Credits'))
        row['v_status'] = row.pop('Standard Version Status') # version status
        row['status'] = row.pop('Standard Status')
        row['field'] = row.pop('Field')
        row['subfield'] = row.pop('SubField')
        row['domain'] = row.pop('Domain')
        if row['status'] == "Registered" and row['v_status'] == "Current": # check that the standard is worth holding on to
            ds_st.append(row)

# join the two, getting all the assessments from the json object and assigning them a field, subfield, and domain
# also check that the two datasets match, print and debug where they don't
for scraped in s_st[:1]:
    provided = next(standard for standard in ds_st if standard["number"] == scraped["number"])
    title_m = provided['title'] == scraped['title']
    level_m = provided['level'] == scraped['level']
    print(scraped, provided)

import psycopg2
conn = psycopg2.connect(
    host="localhost",
    database="nzqa",
    user="entry",
    password="ilikeenteringdata")


