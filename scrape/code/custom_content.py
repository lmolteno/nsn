import json
import os

def get_content():
    folder_path = '../content/' # folder with all the json files

    files = os.listdir(folder_path)

    sections = [
        'level_1',
        'level_2',
        'level_3',
        'general'
    ]
    data = []
    for filepath in files:
        with open(folder_path + filepath) as f: 
            data += json.load(f)['content'] # get content from file - append to data list

    out_content = []

    for info in data:
        try:
            out_info = next(out_info for out_info in out_content if out_info['subject'] == info['subject'])
            # have already got a content thing for this subject
            for section in sections:
                if section in info.keys(): # if we want to add this to the current stuff
                    if section in out_info.keys(): # the list already exists in the output object
                        out_info[section] += info[section]
                    else:
                        out_info[section] = info[section] # initialise list
        except StopIteration:
            # we don't have an output object for this subject
            out_content.append(info)

    # we now have a list of all the information collapsed into one-object-per-subject format,
    # which makes it easier for post-processing and putting into the database
    # the reason I put it in the strange json format is so that later down the line I can just
    # add a json object to the list without worrying about putting it in the 'physics' object
    # this script will handle this for me, and then I can just put the objects in on a per-provider basis

    return out_content          


if __name__ == '__main__':
    print(get_content())
