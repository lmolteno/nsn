import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
import random
import os

of = "..output/ncea_standards.json"
f_string = "%H:%M:%S %d/%m/%Y"

def get_subjects(): # this function will parse the NCEA subjects page to find the names and url-names for each subject
    url = "https://www.nzqa.govt.nz/ncea/subjects/"
    
    print(f"Getting subjects") # debug
    
    page = requests.get(url) # send request
    soup = BeautifulSoup(page.content, 'html.parser') # html/xml parser init
    results = soup.find_all("li") # find all list items
    
    subjects = [] # empty list will be populated with subjects
    
    for item in results: # for all the list items
        if 'levels' in item.a['href']: # if the subject is what we would generally call a subject (e.g. literacy doesn't count)
            url_ref = item.a['href'].split('/')[3] # find the url name
            subjects.append({"name": item.a.text, "url": url_ref}) # add to the subjects list
            
    return subjects

def get_assessments(subject): # this function will parse the assessment search query for each level of the given subject
    url = "https://www.nzqa.govt.nz/ncea/assessment/search.do?query={subjname}&view=all&level={level:02d}" # url format
    assessments = [] # empty list that will be populated with assessments
    
    subjectname = subject['name'].replace(" ", "+") # e.g. turn Digital Technologies into Digital+Technologies for the query
    
    for level in (1,2,3): # for all the levels we're worried about
        formatted = url.format(subjname=subjectname.lower(), level=level) # put info into url format
        
        print(f'Getting assessments for {subject["name"]}, level {level}') # debug
        
        page = requests.get(formatted) # send request
        soup = BeautifulSoup(page.content, 'html.parser') # html parser init
        results = soup.find_all('tr', class_="dataHighlight") # get all the table rows that are highlighted (header rows)
        
        for row in results: # for all the header rows
            a_tags = len(row.find_all('td')[0].find_all('a')) # find how many a tags there are
            num, title, credits, external = row.find_all('strong') # find the bolded text
            if a_tags < 2: # the assessment hasn't expired (an extra <a> tag is added when it has expired that links to the review page)
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
    return assessments

def scrape_and_dump(of):
    # initialise json/dictionary with assessments list and current time for the time of updating
    data = {'assessments': [], 'updated': datetime.now().strftime(f_string)} 
    for subject in get_subjects():
        delay = random.randint(0,10)
        print(f"Waiting {delay}s to avoid being suspicious")
        time.sleep(delay)
        data['assessments'] += get_assessments(subject) # get assessments for all subjects

    with open(of, 'w') as outfile:
        json.dump(data, outfile) # write to file

if __name__ == "__main__": # if the module isn't imported
    if os.path.isfile(of): # check if the output file exists
        with open(of) as outfile:
            data = json.load(outfile)
            lastupdated = datetime.strptime(data['updated'], f_string)
            # add a year to the previous time and see if it's less than now (i'm not too worried about leap years)
            olderthanayear = (lastupdated + timedelta(days=365)) < datetime.now() 
            # if FORCE_SCRAPE environment variable is set, scrape even if previous file is young young
            if olderthanayear or os.environ.get("FORCE_SCRAPE") == '1': 
                print("Scraping")
                scrape_and_dump(of)
            else:
                print("Nothing to be done, up to date scrape data")
    else:
        print("No file exists, scraping data.")
        scrape_and_dump(of)
