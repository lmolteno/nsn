import requests
from bs4 import BeautifulSoup

def get_subjects():
    url = "https://www.nzqa.govt.nz/ncea/subjects/"
   
    page = requests.get(url)
    soup = BeautifulSoup(page.content, 'html.parser')
    results = soup.find_all("li")
    subjects = []
    for item in results:
        if 'levels' in item.a['href']:
            url_ref = item.a['href'].split('/')[3]
            subjects.append({"name": item.a.text, "url": url_ref})
    return subjects

def get_assessments(subject):
    url = "https://www.nzqa.govt.nz/ncea/assessment/search.do?query={subjname}&view=all&level={level:02d}"
    assesssments = []
    for level in (1,):#,2,3):
        formatted = url.format(subjname=subject['name'].lower(), level=level)
        print(f'querying {formatted}')
        page = requests.get(formatted)
        soup = BeautifulSoup(page.content, 'html.parser')
        results = soup.find_all('tr', class_="dataHighlight")
        for row in results:
            stuff = row.find_all('td')
            print(stuff)

print(get_assessments(get_subjects()[0]))
