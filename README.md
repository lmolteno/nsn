# NCEA Standards Navigator [nsn.nz](https://nsn.nz/)

This project is aimed at being a simpler navigation for the NZQA assessment resources (past papers, assessment schedules, exemplars, etc).
NZQA have been kind enough to provide a [dataset](https://catalogue.data.govt.nz/dataset/list-of-standards-by-category-2020) for their assessment standards, which will be used as reference and updated in future years (hopefully). As well as this, they have an _excel spreadsheet_ for their literacy/numeracy credits, [disgusting](https://www.nzqa.govt.nz/assets/qualifications-and-standards/qualifications/ncea/NCEA-subject-resources/Literacy-and-Numeracy/literacy-numeracy-assessment-standards-April-2019.xls). Oh no, not just that, they have an _excel**x**_ spreadsheet for their _UE_ reading/writing/literacy credits, absolutely [horrifying](https://www.nzqa.govt.nz/assets/qualifications-and-standards/Awards/University-Entrance/UE-Literacy-List/University-Entrance-Literacy-list-from-1-January-2020-1.xlsx).

## Description of contents:
- `docker-compose.yml` is the file that describes how all the Docker containers work together (port mappings, shared storage etc.)
- `Caddyfile(.dev)` is the config file for Caddy
- `Makefile` contains some quick scripts for development (so I can type `make` rather than `docker-compose up -d` basically)
- `set_flag.sh` allows me to quickly and easily add flags to the database so that the next time the scraping script checks, it will refresh or rescrape.

## Running/install
```bash
docker-compose up -d
```
Should work. Tested on Debian Buster/Bullseye (`apt` has the necessary packages `docker.io` and `docker-compose`). Make sure you're in the group `docker` post-install.

## More info/Kanban Board

[Notion](https://www.notion.so/Fast-access-NZQA-d4f21847f9174bc2954bd6a3e8205363)

---

## Intentions

- Minimizing the number of clicks to get to a given assessment.
- I will not store every PDF, they will be links to the NZQA website (except for caching)
- Papers are listed alongside assessment schedules, exemplars, rather than being shown just a list of documents.
- Browser-storage list of user-specific subjects/standards for quick access/

## Structure

 - **Python3.9 with Beautiful Soup and Pandas**: for scraping, parsing, and managing the database of resources, standards, and subjects.
 - **MeiliSearch**: for serving fast, typo-resistant search results for both subjects and standards.
 - **PostgreSQL**: for providing a scalable, enterprise-level database.
 - **Python with Flask and Waitress**: for serving the data from the database to the frontend with a RESTful API.
 - **Caddy**: as a reverse proxy and a service retrieving auto-SSL/TLS certificates from LetsEncrypt.
 - **GoAccess**: for reading Caddy logs and hosting a websocket, where a dashboard can be connected.
 - **HTML/CSS/JS + Bootstrap**: for creating a responsive, dynamic frontend. 

![System Diagram](/static/about/system_diagram.png)
