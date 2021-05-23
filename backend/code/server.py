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
        self.cursor = self.connection.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor)

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

    def get_standard_info(self, standard_number):
        get_basic = """SELECT standard_number,
                        title,
                        internal,
                        standard_types.name AS type,
                        version,
                        level,
                        credits,
                        fields.name AS field,
                        subfields.name AS subfield,
                        domains.name AS domain
                        FROM standards
                        LEFT JOIN standard_types ON standard_types.type_id = standards.type_id
                        LEFT JOIN fields ON fields.field_id = standards.field_id
                        LEFT JOIN subfields ON subfields.subfield_id = standards.subfield_id
                        LEFT JOIN domains on domains.domain_id = standards.domain_id
                        WHERE standard_number = %s;"""
        get_subjects = """SELECT subjects.subject_id AS subject_id, name, display_name FROM subjects
                          INNER JOIN standard_subject ON subjects.subject_id = standard_subject.subject_id
                          WHERE standard_subject.standard_number = %s;"""
        get_ncea_litnum = "SELECT literacy, numeracy FROM ncea_litnum WHERE standard_number = %s;"
        get_ue_literacy = "SELECT reading, writing FROM ue_literacy WHERE standard_number = %s;"
        # later, add achivement standard year, etc. post-the-big-scrape
        outdict = {}
        # get basic info`
        self.cursor.execute(get_basic, (standard_number,))
        outdict['basic_info'] = self.cursor.fetchone()
        # get subjects that the standard is associated with
        self.cursor.execute(get_subjects, (standard_number,))
        outdict['subjects'] = self.cursor.fetchall()
        # get literacy/numeracy status
        self.cursor.execute(get_ncea_litnum, (standard_number,))
        outdict['ncea_litnum'] = self.cursor.fetchone()
        # get reading/writing status
        self.cursor.execute(get_ue_literacy, (standard_number,))
        outdict['ue_literacy'] = self.cursor.fetchone()

        return outdict

    def get_multiple_standard_info(self, standard_numbers):
        information = []
        for standard_number in standard_numbers:
            information.append(self.get_standard_info(standard_number))

        return information

    def get_resources(self, standard_number):
        sql = """SELECT standard_number,
                        year,
                        title,
                        resource_categories.name AS category,
                        nzqa_url,
                        filepath FROM resources
                 INNER JOIN resource_categories 
                 ON resource_categories.category_id = resources.category
                 WHERE standard_number = %s;"""
        self.cursor.execute(sql, (standard_number,))
        resources = self.cursor.fetchall()
        return resources

    def get_content(self, subject_id):
        sql = """SELECT level,
                        html FROM custom_content
                WHERE subject_id = %s;"""
        self.cursor.execute(sql, (subject_id,))
        content = self.cursor.fetchall()
        return content


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
        subject_id = request.args['subject']
        try:
            subject_id = int(subject_id)
        except ValueError:  # they didn't provide an integer
            return jsonify({"success": False, "error": "You must provide an integer subject_id"})

        standards = conn.get_standards_from_subject(subject_id)
        if len(standards) > 0:
            return jsonify({"success": True, "standards": standards})
        else:
            return jsonify({"success": False, "error": "No standards exist for that subject"})

    elif 'number' in request.args:  # check if there's a specific standard they're asking for (or set of standards)
        standard_numbers = request.args['number'].split('.') # full stop separated standards
        try:
            standard_numbers = list(map(int, standard_numbers))
        except ValueError:
            return jsonify({"success": False, "error": "You must provide an integer standard number"})
        
        if len(standard_numbers) == 1:
            standard_number = standard_numbers[0]

            info = conn.get_standard_info(standard_number)
            # every standard that exists is associated with at least one subject
            if len(info['subjects']) > 0:
                # merge the success: true with the info provided from the connection
                return jsonify({'success': True} | info)
            else:
                return jsonify({'success': False, "error": "This standard does not appear to be in the database"})

        elif len(standard_numbers) > 1:
            info = conn.get_multiple_standard_info(standard_numbers)
            if len(info) > 0: # success!
                return jsonify({'success' : True, 'standards': info})
            else:
                return jsonify({'success': False, "error": "These standards do not appear to be in the database"})

        elif len(standard_numbers) == 0:
            return jsonify({"success": False, "error": "No standards were provided"})

    else:  # get all standards
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


@server.route('/api/resources', methods=['GET'])
def api_resources():
    global conn
    if not conn:
        conn = DBManager()
    # get all resources for a standard
    if 'number' in request.args:
        standard_number = request.args['number']
        try:
            standard_number = int(standard_number)
        except ValueError:
            return jsonify({"success": False, "error": "You must provide an integer standard number"})

        resources = conn.get_resources(standard_number)
        return jsonify({"success": True, "resources": resources})
        #26
        #if len(resources) > 0:
        #    return jsonify({"success": True, "resources": resources})
        #else:
        #    return jsonify({"success": False, "error": "No resources seem to be available for this standard. If this seems wrong, contact linus@molteno.net"})
    else:
        return jsonify({"success": False, "error": "You must provide a standard number in the request arguments"})

# get the information about the structure of classification of the standards
# fields, subfields, domains
@server.route('/api/structure', methods=['GET'])
def api_structure():
    global conn
    if not conn:
        conn = DBManager()

    structure = conn.get_structure_info()
    if len(structure['fields']) > 0 and len(structure['subfields']) > 0 and len(structure['domains']) > 0:
        # join the two dictionaries together
        return jsonify({**{"success": True}, **structure})
    else:
        return jsonify({"success": False, "error": "Structure information is not present in the database. Contact linus@molteno.net"})

@server.route('/api/content', methods=['GET'])
def api_content():
    global conn
    if not conn:
        conn = DBManager() # initialise if not there

    content = conn.get_content(request.args['id']) # get content for subject
    return jsonify({'success': True, 'content': content})

if __name__ == '__main__':
    server.run(port=3000)
