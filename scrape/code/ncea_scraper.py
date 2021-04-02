import requests
from bs4 import BeautifulSoup # scraping library
import json
import time 
from datetime import datetime,timedelta # self explanatory
import random # for random delays
import os # for environment variables and filename chekcing
from unidecode import unidecode # for removing the macrons

# OUTLIERS (before addressing this, replace 
# macrons with unaccented characters)
# the lowercase is for matching in case i
# mis-case something while writing out the LUT
outliers_lut = {
    "agribusiness (business studies)": "Business Studies",
    "mathematics and statistics": "Mathematics",
    "nga toi": ["Nga Mahi a Te Rehia", # Leisure ?
                 "Toi Puoro", # Musical Arts
                 "Toi Ataata"], # Visual Arts
    "te reo maori": "Reo Maori",
    "technology": ["Construction and Mechanical Technologies",
                    "Generic Technology",
                    "Materials Technology",
                    "Process Technology",
                    "Processing Technologies",
                    "Technology - General Education"],
    "tikanga-a-iwi": "Tikanga a Iwi",
    ## WEIRD POLYTECHY ONES TO IGNORE
    "business studies": False,
    "business & management": False,
    "core skills": False,
    "driver license (class 1)": False, # this could be changed later, as there are actually standards in a weird format, i just cant be bothered rn
    "early childhood education": False,
    "english for academic purposes": False,
    "english language (el)": False,
    "field maori": False,
    "literacy": False,
    "numeracy": False,
    "pacific studies": False,
    "supported learning": False
};

of = "../output/ncea_standards.json"
f_string = "%H:%M:%S %d/%m/%Y"

def get_subjects(): # this function will parse the NCEA subjects page to find the names and url-names for each subject
    url = "https://www.nzqa.govt.nz/ncea/subjects/"
    
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Getting subjects") # debug
    
    page = requests.get(url) # send request
    soup = BeautifulSoup(page.content, 'html.parser') # html/xml parser init
    results = soup.find_all("table") # find all tables
    results = results[0].find_all("li") # find all list items in the first table
    
    subjects = [] # empty list will be populated with subjects
    
    for item in results: # for all the list items
        # this next line was bad, not good.
        # if 'levels' in item.a['href']: # if the subject is what we would generally call a subject (if they link normally)
        subject_name = unidecode(item.a.text) # this is an accent-remover
        
        display_name = subject_name
        
        if subject_name.lower() in outliers_lut.keys(): # check if the subject is in the LUT
            if outliers_lut[subject_name.lower()] != False: # if it isn't one we should ignore
                if type(outliers_lut[subject_name.lower()]) == list: # if there are multiple sub-subjects
                    for subject in outliers_lut[subject_name.lower()]:
                        subjects.append({"name": subject})
                else: # there's only one subject
                    subject_name = outliers_lut[subject_name.lower()]
            else:
                print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Ignoring {subject_name}')
                continue
        
        try:
            # ensure no duplicates
            # the "next" here means that it will try to find the first element of the iterator 
            # returned by the inline for loop
            duplicate = next(subject for subject in subjects if subject['name'] == subject_name)
        except StopIteration:
            subjects.append({"name": subject_name, "display_name": display_name}) # add to the subjects list
            
    return subjects

def get_assessments(subject): # this function will parse the assessment search query for each level of the given subject
    url = "https://www.nzqa.govt.nz/ncea/assessment/search.do?query={subjname}&view=all&level={level:02d}" # url format
    assessments = [] # empty list that will be populated with standards
    
    subjectname = subject['name'].replace(" ", "+") # e.g. turn Digital Technologies into Digital+Technologies for the query
    print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Getting standards for {subject["name"]}')
    for level in (1,2,3): # for all the levels we're worried about
        formatted = url.format(subjname=subjectname.lower(), level=level) # put info into url format
        fn = f"/cache/{subjectname.lower()}/{level}.html"
        
        # get text from cache, or don't
        text = ""
        if os.path.isfile(fn):
            with open(fn, 'r') as f:
                text = f.read()
        else: # there was no cached file
            delay = random.randint(5,10)
            print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Waiting {delay}s to avoid being suspicious")
            time.sleep(delay)
            page = requests.get(formatted) # send request
            page.raise_for_status() # raise an error on a bad status
            if os.environ.get("HARD_CACHE") == "1":
                print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
                os.makedirs(os.path.dirname(fn), exist_ok=True) # make directories on the way to the caching location
                with open(fn, 'w') as f:
                    f.write(page.text) # save to file for later caching if there's a cache
            text = page.text # save page text as text
                    
                
        soup = BeautifulSoup(text, "html.parser",) # html parser init
        results = soup.find_all('tr', class_="dataHighlight") # get all the table rows that are highlighted (header rows)
        num_ass = 0
        for row in results: # for all the header rows
            a_tags = len(row.find_all('td')[0].find_all('a')) # find how many a tags there are
            num, title, credits, external = row.find_all('strong') # find the bolded text
            #if a_tags < 2: # the assessment hasn't expired (an extra <a> tag is added when it has expired that links to the review page) (this is actually false)
            if "expired" not in str(row):
                new_ass = { # populate dictionary
                    'level': level, # the level the assessment applies to
                    'number': int(num.text), # assessment number
                    'title': title.text, # the title/name of the assessment
                    'credits': int(credits.text.split(" ")[0]), # e.g. "3 credits" would split into ['3', 'credits'], so integerise the first element
                    'external': external.text == "External", # boolean
                    'subject': subject,
                    'achievement': int(num.text) >= 90000
                }
                assessments.append(new_ass)
                num_ass += 1
        print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Found {num_ass} standards in level {level}') # debug
    return assessments

def scrape_and_dump(of):
    # initialise json/dictionary with assessments list and current time for the time of updating
    data = {'assessments': [], 'updated': datetime.now().strftime(f_string)} 
    for subject in get_subjects():
        data['assessments'] += get_assessments(subject) # get assessments for all subjects

    with open(of, 'w') as outfile:
        json.dump(data, outfile) # write to file

if __name__ == "__main__": # if the module isn't imported
    print(get_subjects())
    print(get_assessments({"name": "Biology"}))
