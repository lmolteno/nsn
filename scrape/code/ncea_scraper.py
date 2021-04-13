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
    ## WEIRD POLYTECHY ONES TO IGNORE (false means ignore)
    "business studies": False, # ignore this because there's already agribusiness
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
        url_name = item.a.href
        subject_name = unidecode(item.a.text) # this is an accent-remover
        display_name = subject_name
        
        if subject_name.lower() in outliers_lut.keys(): # check if the subject is in the LUT
            if outliers_lut[subject_name.lower()] != False: # if it isn't one we should ignore
                if type(outliers_lut[subject_name.lower()]) == list: # if there are multiple sub-subjects
                    for subject in outliers_lut[subject_name.lower()]:
                        subjects.append({"name": subject, "display_name": subject})
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
            text = page.text # save page text as texttext = ""
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
                    
                
        soup = BeautifulSoup(text, "html.parser") # html parser init
        results = soup.find_all('tr', class_="dataHighlight") # get all the table rows that are highlighted (header rows)
        num_ass = 0
        for row in results: # for all the header rows
            a_tags = len(row.find_all('td')[0].find_all('a')) # find how many a tags there are
            num, title, credits, external = row.find_all('strong') # find the bolded text
            #if a_tags < 2: # the assessment hasn't expired (an extra <a> tag is added when it has expired that links to the review page) (this is actually false)
            if "expiring" in str(row):
                a=1 # do nothing
                #print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] {num_ass} is expiring') # debug
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

def get_resources(standard):
    standard_number = standard['number']
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Getting resources for {standard_number}")
    
    if standard_number < 90000: # if it's a unit standard
        # there's only ever one resource (i'm pretty sure)
        outdict = {
            "standard_number": standard_number,
            "category": "unit", # this is not the id, as the db expects, this should be handled later.
            "year": 0, # there isn't a year for unit standards, equivalent to None
            "title": "Unit standard",
            "nzqa_url": f"https://www.nzqa.govt.nz/nqfdocs/units/pdf/{standard_number}.pdf",
            "filepath": f"units/pdf/{standard_number}.pdf"
        }
        return [outdict]
    # code past the return will only be reached if it's not a unit standard (an achievement standard)
    url = f"https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber={standard_number}"

    fn = f"../cache/resources/{standard_number}.html" # name for cached file
    text = ""
    
    if os.path.isfile(fn):
        with open(fn, 'r') as f:
            text = f.read()
    else: # there was no cached file
        delay = random.randint(5,10)
        print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Waiting {delay}s to avoid being suspicious")
        time.sleep(delay)
        page = requests.get(url) # send request
        page.raise_for_status() # raise an error on a bad status
        if os.environ.get("HARD_CACHE") == "1":
            print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
            os.makedirs(os.path.dirname(fn), exist_ok=True) # make directories on the way to the caching location
            with open(fn, 'w') as f:
                f.write(page.text) # save to file for later caching if there's a cache
        text = page.text # save page text as text to the local variable
        
    soup = BeautifulSoup(text, "html.parser") # html parser init
    
    resources = [] # list of resources
    
    # for handling pdf <a> tags
    a_tags = soup.find_all('a', class_='pdf') + soup.find_all('a', class_='archive') # they handily have the pdf and archive classes
    for a_tag in a_tags:
        # the structure of the html around the links is such:
        # <tr>
        #  <td>Title of thingy</td>
        #  <td>
        #   <a class='pdf' href='thingy.pdf'></a>
        #   <a class='doc' href='thingy.doc'></a>
        #  </td>
        # </tr>
        # so given the <a class='pdf'> tag, we go to the parent of it's parent, then the _first_ td, then the text of that, and strip it. WE DO NOT CARE ABOUT THE DOCS IT'S OBJECTIVELY SILLY :(
        title = a_tag.parent.parent.td.text.strip() # what a nightmare of a line
        base  = "https://www.nzqa.govt.nz"
        link  = a_tag['href'] # this is where the link goes to

        category = link.split("/")[3].strip() # the third directory thingy, the name of the category
        year = link.split("/")[4].strip() # the fourth directory thingy
        file_path = link[len("/nqfdocs/"):] # cut off the constant beginning (i think this is how i'll do the caching)
        full_url = base + link # the full nzqa link
        
        resource_dict = {
            "standard_number": standard_number,
            "category": category, # this is not the id, as the db expects, this should be handled later.
            "year": year,
            "title": title,
            "nzqa_url": full_url,
            "filepath": file_path
        }
                
        resources.append(resource_dict)
    return resources
        
def scrape_and_dump(of):
    # initialise json/dictionary with assessments list and current time for the time of updating
    data = {'assessments': [], 'updated': datetime.now().strftime(f_string), 'resources': []} 
    for subject in get_subjects():
        data['assessments'] += get_assessments(subject) # get assessments for all subjects
    
    for assessment in data['assessments']: # these should be called standards
        data['resources'] += get_resources(assessment)

    with open(of, 'w') as outfile:
        json.dump(data, outfile) # write to file

if __name__ == "__main__": # if the module isn't imported
    print(get_resources(15020)) # french one for testing audio/transcripts
