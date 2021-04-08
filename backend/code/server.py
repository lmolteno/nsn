import os
from flask import Flask, request, jsonify
import psycopg2
import psycopg2.extras

class DBManager:
    def __init__(self,
                 database=os.environ.get("POSTGRES_DB"),
                 host="db",
                 user=os.environ.get("POSTGRES_USER"),
                 password=os.environ.get("POSTGRES_PASSWORD")):
        self.connection = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password)
        self.cursor = self.connection.cursor(cursor_factory = psycopg2.extras.RealDictCursor)
    
    def get_subjects(self):
        self.cursor.execute('SELECT * FROM subjects;')
        rec = self.cursor.fetchall()
        return rec
    
    def get_structure_info(self):
        rec = {"fields": [], "subfields": [], "domains": []}
        self.cursor.execute('SELECT * FROM fields;')
        rec['fields'] = self.cursor.fetchall()
        self.cursor.execute('SELECT * FROM subfields;')
        rec['subfields'] = self.cursor.fetchall()
        self.cursor.execute('SELECT * FROM domains;')
        rec['domains'] = self.cursor.fetchall()
        return rec
    
    def get_standards(self):
        rec = []
        sql = """SELECT DISTINCT standards.standard_number,
                    title,
                    name AS subject_name,
                    level,
                    internal,
                    type_id,
                    version,
                    credits,
                    reading,
                    writing,
                    literacy,
                    numeracy,
                    field_id,
                    subfield_id,
                    domain_id,
                    subjects.subject_id AS subject_id FROM standards
                 INNER JOIN standard_subject
                 ON standard_subject.standard_number=standards.standard_number
                 INNER JOIN subjects
                 ON standard_subject.subject_id=subjects.subject_id
                 INNER JOIN ncea_litnum
                 ON standards.standard_number=ncea_litnum.standard_number
                 INNER JOIN ue_literacy
                 ON standards.standard_number=ue_literacy.standard_number;"""
        self.cursor.execute(sql)
        rec = self.cursor.fetchall()
        return rec
    
    def get_standards_from_subject(self, subject_id):
        rec = []
        sql = """SELECT DISTINCT standards.standard_number,
                    title,
                    name AS subject_name,
                    level,
                    internal,
                    type_id,
                    version,
                    credits,
                    reading,
                    writing,
                    literacy,
                    numeracy,
                    field_id,
                    subfield_id,
                    domain_id,
                    subjects.subject_id AS subject_id FROM standards
                 INNER JOIN standard_subject
                 ON standard_subject.standard_number=standards.standard_number
                 INNER JOIN subjects
                 ON standard_subject.subject_id=subjects.subject_id
                 INNER JOIN ncea_litnum
                 ON standards.standard_number=ncea_litnum.standard_number
                 INNER JOIN ue_literacy
                 ON standards.standard_number=ue_literacy.standard_number
                 WHERE subjects.subject_id = %s;"""
        self.cursor.execute(sql, (subject_id,))
        rec = self.cursor.fetchall()
        return rec


server = Flask(__name__)
conn = None

@server.route('/api/standards', methods=['GET'])
def api_standards():
    global conn
    if not conn:
        conn = DBManager()
    # Check if a subject ID was provided as part of the URL.
    # If no ID is provided, get all standards
    if 'subject' in request.args:
        subject_id = int(request.args['subject'])
        
        standards = conn.get_standards_from_subject(subject_id)
        if len(standards) > 0:
            return jsonify({"success": True, "standards": standards})
        else:
            return jsonify({"success": False, "error": "No standards exist for that subject"})
    else: # get all standards
        standards = conn.get_standards()
        if len(standards) > 0:
            return jsonify({"success": True, "standards": standards})
        else:
            return jsonify({"success": False, "error": "No standards are present in the database. Contact linus@molteno.net"})
        
# get all the subjects and their ids
@server.route('/api/subjects', methods=['GET'])
def api_subjects():
    global conn
    if not conn:
        conn = DBManager()
    # get all subjects
    subjects = conn.get_subjects()
    if len(subjects) > 0:
        return jsonify({"success": True, "subjects": subjects})
    else:
        return jsonify({"success": False, "error": "No subjects are present in the database. Contact linus@molteno.net"})
    
# get the information about the structure of classification of the standards
# fields, subfields, domains
@server.route('/api/structure', methods=['GET'])
def api_structure():
    global conn
    if not conn:
        conn = DBManager()

    structure = conn.get_structure_info()
    if len(structure['fields'])        > 0 and len(structure['subfields']) > 0 and len(structure['domains'])   > 0:
        return jsonify({**{"success": True}, **structure}) # join the two dictionaries together
    else:
        return jsonify({"success": False, "error": "Structure information is not present in the database. Contact linus@molteno.net"})


if __name__ == '__main__':
    server.run(port=3000)
