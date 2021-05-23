import pandas as pd
import os
import requests
from datetime import datetime

def debug_time(): # for faster/easier timestamping
    return datetime.now().strftime('%y/%m/%d %H:%M:%S')


def get_ncea_litnum():

    # get the literacy/numeracy xls spreadsheet
    litnum_url = "https://www.nzqa.govt.nz/assets/qualifications-and-standards/qualifications/ncea/NCEA-subject-resources/Literacy-and-Numeracy/literacy-numeracy-assessment-standards-April-2019.xls"
    litnum_fn = "../cache/litnum.xls"
    if os.path.isfile(litnum_fn):  # if it's cached, use it
        print(
            f"[{debug_time()}] Using cached Literacy and Numeracy data")
    else:  # download it
        print(
            f"[{debug_time()}] Downloading Literacy and Numeracy data")
        page = requests.get(litnum_url)  # send request
        page.raise_for_status()  # raise an error on a bad status
        print(f'[{debug_time()}] Caching')
        # make directories on the way to the caching location
        os.makedirs(os.path.dirname(litnum_fn), exist_ok=True)
        with open(litnum_fn, 'wb') as f:
            # save to file for later caching if there's a cache
            f.write(page.content)

    # read it with pandas
    # header=1 because the header is on the second row
    ln_df = pd.read_excel(litnum_fn, header=1)
    # 'Registered' is the standard number
    # 'Title' is the title, with macrons!
    # 'Literacy' is either Y or blank
    # 'Numeracy' is either Y or blank
    # 'Status' is either 'Expiring', 'Registered', or 'Expired'
    ln_dict = {}  # this dict will be filled with key-value pairs for sn: {'literacy': bool, 'numeracy': bool}
    print(f'[{debug_time()}] Parsing...')
    for _, row in ln_df.iterrows():
        sn = int(row['Registered'])
        literacy = str(row['Literacy']).upper().strip() == "Y"
        numeracy = str(row['Numeracy']).upper().strip() == "Y"
        status = row['Status']
        if status == 'Registered':
            ln_dict[sn] = {'literacy': literacy, 'numeracy': numeracy}

    return ln_dict


def get_ue_lit():
    # get the UE literacy xls*X* spreadsheet (the X is frustrating because I need a different engine to actually reference it)
    uelit_url = "https://www.nzqa.govt.nz/assets/qualifications-and-standards/Awards/University-Entrance/UE-Literacy-List/University-Entrance-Literacy-list-from-1-January-2020-1.xlsx"
    uelit_fn = "../cache/uelit.xlsx"
    if os.path.isfile(uelit_fn):  # if it's cached, use it
        print(
            f"[{debug_time()}] Using cached UE Literacy data")
    else:  # download it
        print(
            f"[{debug_time()}] Downloading UE Literacy data")
        page = requests.get(uelit_url)  # send request
        page.raise_for_status()  # raise an error on a bad status
        print(f'[{debug_time()}] Caching')
        # make directories on the way to the caching location
        os.makedirs(os.path.dirname(uelit_fn), exist_ok=True)
        with open(uelit_fn, 'wb') as f:
            # save to file for later caching if there's a cache
            f.write(page.content)

    # read it with pandas (uelit dataframe)
    # header=1 because the header is on the second row
    uelit_df = pd.read_excel(uelit_fn, header=1, engine='openpyxl')
    # 'ID' is the standard number
    # 'Title' is the title, with macrons!
    # 'Reading' is either Y or N
    # 'Writing' is either Y or N
    # 'Subject Reference' is e.g. Accounting 3.1, except they mispelled some things so i can't use it. :(
    uelit_dict = {}  # this dict will be filled with key-value pairs for sn: {'reading': bool, 'writing': bool}
    print(f'[{debug_time()}] Parsing...')
    for _, row in uelit_df.iterrows():
        # THERE IS A SINGLE ROW thAT DOESn'T HAVE AN ID BECAUSE AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
        sn = row['ID']
        try:
            sn = int(sn)
        except ValueError:
            continue  # ignore it

        # I have to strip it because there are sometimes random spaces
        reading = str(row['Reading']).upper().strip() == "Y"
        writing = str(row['Writing']).upper().strip() == "Y"
        uelit_dict[sn] = {'reading': reading, 'writing': writing}

    return uelit_dict
