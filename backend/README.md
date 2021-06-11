# `/backend/`

This directory contains the code for the API, which is run in the `api_service` container.
It also contains the same two files that are in the `/scrape/` directory:
 - `Dockerfile` describes the build procedure for the docker image
 - `requirements.txt` lists the necessary packages for the server to run.

Endpoints are:
 - `/api/subjects`: get all subjects
 - `/api/standards`: get all standards
 - `/api/standards?subject=subject_id`: get all standards for a given subject id
 - `/api/structure`: get all domain names, field names, and subfield names
 - `/api/content?id=subject_id`: get custom content for a subject
