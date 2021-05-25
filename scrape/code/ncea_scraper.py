import requests
from bs4 import BeautifulSoup  # scraping library
import json
import time
from datetime import datetime, timedelta  # self explanatory
import random  # for random delays
import os  # for environment variables and filename chekcing
from unidecode import unidecode  # for removing the macrons

# OUTLIERS (before addressing this, replace
# macrons with unaccented characters)
# the lowercase is for matching in case i
# mis-case something while writing out the LUT
outliers_lut = {
    "agribusiness (business studies)": "Business Studies",
    "mathematics and statistics": "Mathematics",
    "nga toi": ["Nga Mahi a Te Rehia",  # Leisure ?
                "Toi Puoro",  # Musical Arts
                "Toi Ataata"],  # Visual Arts
    "te reo maori": "Reo Maori",
    "technology": ["Construction and Mechanical Technologies",
                    "Generic Technology",
                    "Materials Technology",
                    "Process Technology",
                    "Processing Technologies",
                    "Technology - General Education"],
    "tikanga-a-iwi": "Tikanga a Iwi",
    # WEIRD POLYTECHY ONES TO IGNORE (false means ignore)
    "business studies": False,  # ignore this because there's already agribusiness
    "business & management": False,
    "core skills": False,
    # this could be changed later, as there are actually standards in a weird format, i just cant be bothered rn
    "driver license (class 1)": False,
    "early childhood education": False,
    "english for academic purposes": False,
    "english language (el)": False,
    "field maori": False,
    "literacy": False,
    "numeracy": False,
    "pacific studies": False,
    "supported learning": False
}

of = "../output/ncea_standards.json"
f_string = "%H:%M:%S %d/%m/%Y"

def debug_time(): # for faster/easier timestamping
    return datetime.now().strftime('%y/%m/%d %H:%M:%S')

def get_subjects():  # this function will parse the NCEA subjects page to find the names and url-names for each subject
    url = "https://www.nzqa.govt.nz/ncea/subjects/"

    # debug
    print(f"[{debug_time()}] Getting subjects")
    success = False
    page = None # init of variable to get it in scope
    while not success:
        try:
            page = requests.get(url)  # send request
            success = True
        except requests.exceptions.ConnectionError:
            print(f"[{debug_time()}] Failed to establish connection... waiting 10 seconds")
            time.sleep(10)
    soup = BeautifulSoup(page.content, 'html.parser')  # html/xml parser init
    results = soup.find_all("table")  # find all tables
    # find all list items in the first table
    results = results[0].find_all("li")

    subjects = []  # empty list will be populated with subjects

    for item in results:  # for all the list items
        url_name = "https://www.nzqa.govt.nz" + item.a['href']  # add base url
        # if the url name has levels/ at the end, remove it
        url_name = url_name.replace("levels/", "")
        # remove accents from the subject name with unidecode
        subject_name = unidecode(item.a.text)
        display_name = subject_name

        if subject_name.lower() in outliers_lut.keys():  # check if the subject is in the LUT
            # if it isn't one we should ignore
            if outliers_lut[subject_name.lower()] != False:
                # if there are multiple sub-subjects
                if type(outliers_lut[subject_name.lower()]) == list:
                    for subject in outliers_lut[subject_name.lower()]:
                        # add to the subjects list
                        subjects.append(
                            {"name": subject, "display_name": subject, "url": url_name})
                else:  # there's only one subject
                    subject_name = outliers_lut[subject_name.lower()]
            else:
                print(
                    f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Ignoring {subject_name}')
                continue

        try:
            # ensure no duplicates
            # the "next" here means that it will try to find the first element of the iterator
            # returned by the inline for loop
            _ = next(
                subject for subject in subjects if subject['name'] == subject_name)
        except StopIteration:
            # add to the subjects list
            subjects.append(
                {"name": subject_name, "display_name": display_name, "url": url_name})

    return subjects


# this function will parse the assessment search query for each level of the given subject
def get_assessments(subject):
    # url format
    url = "https://www.nzqa.govt.nz/ncea/assessment/search.do?query={subjname}&view=all&level={level:02d}"
    assessments = []  # empty list that will be populated with standards

    # e.g. turn Digital Technologies into Digital+Technologies for the query
    subjectname = subject['name'].replace(" ", "+")
    print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Getting standards for {subject["name"]}')
    for level in (1, 2, 3):  # for all the levels we're worried about
        # put info into url format
        formatted = url.format(subjname=subjectname.lower(), level=level)
        fn = f"/cache/{subjectname.lower()}/{level}.html"

        # get text from cache, or don't
        text = ""
        if os.path.isfile(fn):
            with open(fn, 'r') as f:
                text = f.read()
        else:  # there was no cached file
            delay = random.randint(5, 10)
            print(
                f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Waiting {delay}s to avoid being suspicious")
            time.sleep(delay)
            page = requests.get(formatted)  # send request
            page.raise_for_status()  # raise an error on a bad status
            if os.environ.get("HARD_CACHE") == "1":
                print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
                # make directories on the way to the caching location
                os.makedirs(os.path.dirname(fn), exist_ok=True)
                with open(fn, 'w') as f:
                    # save to file for later caching if there's a cache
                    f.write(page.text)
            text = page.text  # save page text as texttext = ""
        if os.path.isfile(fn):
            with open(fn, 'r') as f:
                text = f.read()
        else:  # there was no cached file
            delay = random.randint(5, 10)
            print(
                f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Waiting {delay}s to avoid being suspicious")
            time.sleep(delay)
            page = requests.get(formatted)  # send request
            page.raise_for_status()  # raise an error on a bad status
            if os.environ.get("HARD_CACHE") == "1":
                print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
                # make directories on the way to the caching location
                os.makedirs(os.path.dirname(fn), exist_ok=True)
                with open(fn, 'w') as f:
                    # save to file for later caching if there's a cache
                    f.write(page.text)
            text = page.text  # save page text as text

        soup = BeautifulSoup(text, "html.parser")  # html parser init
        # get all the table rows that are highlighted (header rows)
        results = soup.find_all('tr', class_="dataHighlight")
        num_ass = 0
        for row in results:  # for all the header rows

            num, title, credits, external = row.find_all(
                'strong')  # find the bolded text

            if "expired" not in str(row):
                new_ass = {  # populate dictionary
                    'level': level,  # the level the assessment applies to
                    'number': int(num.text),  # assessment number
                    'title': title.text,  # the title/name of the assessment
                    # e.g. "3 credits" would split into ['3', 'credits'], so integerise the first element
                    'credits': int(credits.text.split(" ")[0]),
                    'external': external.text == "External",  # boolean
                    'subject': subject,
                    'achievement': int(num.text) >= 90000
                }
                assessments.append(new_ass)
                num_ass += 1
        # debug
        print(
            f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Found {num_ass} standards in level {level}')
    return assessments


def get_resources(standard):
    standard_number = standard['number']
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Getting resources for {standard_number}")

    if standard_number < 90000:  # if it's a unit standard
        # there's only ever one resource (i'm pretty sure)
        outdict = {
            "standard_number": standard_number,
            # this is not the id, as the db expects, this should be handled later.
            "category": "unit",
            "year": 0,  # there isn't a year for unit standards, equivalent to None
            "title": "Unit standard",
            "nzqa_url": f"https://www.nzqa.govt.nz/nqfdocs/units/pdf/{standard_number}.pdf",
            "filepath": f"units/pdf/{standard_number}.pdf"
        }
        return [outdict]
    # code past the return will only be reached if it's not a unit standard (an achievement standard)
    url = f"https://www.nzqa.govt.nz/ncea/assessment/view-detailed.do?standardNumber={standard_number}"

    fn = f"../cache/resources/{standard_number}.html"  # name for cached file
    text = ""

    if os.path.isfile(fn):
        with open(fn, 'r') as f:
            text = f.read()
    else:  # there was no cached file
        delay = random.randint(5, 10)
        print(
            f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Waiting {delay}s to avoid being suspicious")
        time.sleep(delay)
        page = requests.get(url)  # send request
        page.raise_for_status()  # raise an error on a bad status
        if os.environ.get("HARD_CACHE") == "1":
            print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
            # make directories on the way to the caching location
            os.makedirs(os.path.dirname(fn), exist_ok=True)
            with open(fn, 'w') as f:
                # save to file for later caching if there's a cache
                f.write(page.text)
        text = page.text  # save page text as text to the local variable

    soup = BeautifulSoup(text, "html.parser")  # html parser init

    resources = []  # list of resources

    # for handling pdf <a> tags
    # they handily have the pdf and archive classes
    a_tags = soup.find_all('a', class_='pdf') + \
        soup.find_all('a', class_='archive')
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
        title = a_tag.parent.parent.td.text.strip()  # what a nightmare of a line
        base = "https://www.nzqa.govt.nz"
        link = a_tag['href']  # this is where the link goes to

        # the third directory thingy, the name of the category
        category = link.split("/")[3].strip()
        year = link.split("/")[4].strip()  # the fourth directory thingy
        # cut off the constant beginning (i think this is how i'll do the caching)
        file_path = link[len("/nqfdocs/"):]
        full_url = base + link  # the full nzqa link

        resource_dict = {
            "standard_number": standard_number,
            # this is not the id, as the db expects, this should be handled later.
            "category": category,
            "year": year,
            "title": title,
            "nzqa_url": full_url,
            "filepath": file_path
        }

        resources.append(resource_dict)
    return resources


def get_annotated_exemplars(subject):
    print(f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Getting annotated exemplars for {subject['name']}")
    url = f"{subject['url']}annotated-exemplars/"
    subject_fn = subject['name'].replace(" ", "+")
    # name for cached file
    fn = f"../cache/resources/annotated-exemplars/{subject_fn}.html"
    text = ""

    if os.path.isfile(fn):
        with open(fn, 'r') as f:
            text = f.read()
            if text == "404":  # there ain't nothin' here
                print(
                    f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Encountered 404")
                return []
    else:  # there was no cached file
        delay = random.randint(5, 10)
        print(
            f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Waiting {delay}s to avoid being suspicious")
        time.sleep(delay)
        page = requests.get(url)  # send request
        if page.status_code == 404:
            if os.environ.get("HARD_CACHE") == 1:
                print(
                    f"[{datetime.now().strftime('%y/%m/%d %H:%M:%S')}] Encountered 404")
                # write to the file with a "404" string to show that nothing's there
                with open(fn, 'w') as f:
                    f.write("404")
            return []  # no resources for internal annotated exemplars
        # if there is stuff
        if os.environ.get("HARD_CACHE") == "1":
            print(f'[{datetime.now().strftime("%y/%m/%d %H:%M:%S")}] Caching')
            # make directories on the way to the caching location
            os.makedirs(os.path.dirname(fn), exist_ok=True)
            with open(fn, 'w') as f:
                # save to file for later caching if there's a cache
                f.write(page.text)
        text = page.text  # save page text as text to the local variable

    soup = BeautifulSoup(text, "html.parser")  # html parser init

    resources = []  # list of resources

    # this method of finding the link to the annotated exemplars means that there will be some level 4 standards,
    main_div = soup.find("div", {'id': "mainPage"})
    list_items = main_div.find_all("li")
    a_tags = [a_tag for list_item in list_items for a_tag in list_item.find_all(
        "a")]  # this is a mess
    for a_tag in a_tags:
        print(a_tag.text, a_tag['href'])

        # each a-tag represents a resource with the category of annotated-exemplars, or that's what i'm calling it
        outdict = {
            # remove the "AS" or "US" at the beginning
            "standard_number": int(a_tag.text[2:]),
            "title": "Annotated exemplar",
            # add the baseurl of nzqa.govt.nz
            "nzqa_url": "https://www.nzqa.govt.nz" + a_tag['href'],
            "filepath": None,  # there isn't a file path because it's not a pdf
            "year": 0,  # there isn't an associated year
            "category": "annotated-exemplars"
        }

        resources.append(outdict)

    return resources


def scrape_and_dump(of):
    # initialise json/dictionary with assessments list and current time for the time of updating
    data = {'assessments': [], 'updated': datetime.now().strftime(f_string),
            'resources': []}
    for subject in get_subjects():
        # get assessments for all subjects
        data['assessments'] += get_assessments(subject)
        # get annotated exemplars for all subjects
        data['resources'] += get_annotated_exemplars(subject)

    for assessment in data['assessments']:  # these should be called standards
        data['resources'] += get_resources(assessment)

    with open(of, 'w') as outfile:
        json.dump(data, outfile)  # write to file


if __name__ == "__main__":  # if the module isn't imported
    # french one for testing audio/transcripts
    print(get_annotated_exemplars({"name": "Biology", "display_name": "Biology",
          "url": "https://www.nzqa.govt.nz/ncea/subjects/biology/"}))
