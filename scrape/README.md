# `/scrape/`

This is where the majority of the work was done. A few folders in here:
 - `/scrape/code/` contains 4 scripts:
   - `checker.py` is the script that does the main loop, checking whether the scraping needs to be run etc.
   - `ncea_scraper.py` is the script that scrapes the NZQA website for subjects, standards, and resources
   - `literacy_numeracy.py` handles parsing for the provided 'dataset' (excel spreadsheet) of literacy and numeracy credits for standards
   - `custom_content.py` handles processing of the custom content which is stored in the `/scrape/content/` directory.
   - `combine.py` combines all the data from the previous 3 scripts and gets it ready for entering in the database, then enters it into the database (+ MeiliSearch).
 - `/scrape/output/` contains the JSON file which was the result of scraping the NZQA website (`ncea_standards.json`)
 - `/scrape/cache/` contains all the cached HTML files as a result of the scraping (can be disabled by setting the environment variable `HARD_CACHE` in the `scrape` Docker container to 0.
 - `/scrape/content/` contains the JSON files for the custom content under each subject.
As well as folders, a couple files:
 - `Dockerfile` describes the build procedure for the docker image used in `docker-compose.yml` as the `scrape` container
 - `requirements.txt` is the list of packages that get installed with `pip` during the docker build.
