# NZQA Navigator

A simpler navigation for the NZQA assessment resources (past papers, assessment schedules, exemplars, etc).
NZQA have been kind enough to provide a [dataset](https://catalogue.data.govt.nz/dataset/list-of-standards-by-category-2020) for their assessment standards, which will be used as reference and updated in future years (hopefully). As well as this, they have an _excel spreadsheet_ for their literacy/numeracy credits, [disgusting](https://www.nzqa.govt.nz/assets/qualifications-and-standards/qualifications/ncea/NCEA-subject-resources/Literacy-and-Numeracy/literacy-numeracy-assessment-standards-April-2019.xls).

## Intentions

- Minimizing the number of clicks to get to a given assessment.
- I will not store every PDF, they will be links to the NZQA website.
- Sorting things in an easy-to-understand way (level -> subject -> standards)
- Papers are listed alongside assessment schedules, exemplars, in a not really dumb listy way
- Browser-storage list of user-specific subjects for quick access
- A nice design, like practically all other government websites, my goodness NZQA, such a mess! (I understand there's probably a lot that would have to go on to change anything I'm really not that mad and this is supposed to be a simple tool)

## Structure

- Node.js RESTful backend
- HTML/CSS/JS frontend, probably bootstrap or some other fast frontend CSS/JS library

## Layout

- Home page
    - Search bar (present in all pages, fast, locally based)
    - List of user-selected subjects (starred, locally stored)
    - List of all subjects
- Subject page
    - List of all years to choose from
    - List of all assessments (description), their number/number of credits, and their most recent achievement standard.
        - Download papers for last 3 years (as dropdown on subject, if external)
- Year page
    - Every assessment is shown for that year, including marking schedule, exam paper, exemplars (if they exist)
    - For internal assessments, show exemplars.
- Assessment page
    - Description, number of credits, PEP, all past papers, all exemplars etc. (organised by type, then chronologically)

## More info/Kanban Board

[Notion](https://www.notion.so/Fast-access-NZQA-d4f21847f9174bc2954bd6a3e8205363)
