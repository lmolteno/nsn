CREATE TABLE subjects (
 subject_id INT PRIMARY KEY,
 name VARCHAR
);

CREATE TABLE assessment_types (
 type_id INT PRIMARY KEY,
 name VARCHAR
);

CREATE TABLE fields (
 fields_id INT PRIMARY KEY,
 name VARCHAR
);

CREATE TABLE subfields (
 subfield_id INT PRIMARY KEY,
 name VARCHAR
);

CREATE TABLE domains (
 domain_id INT PRIMARY KEY,
 name VARCHAR
);

CREATE TABLE assessments (
 assessment_number INT PRIMARY KEY,
 title VARCHAR NOT NULL,
 internal BOOL NOT NULL,
 type_id INT,
 version INT NOT NULL,
 level INT NOT NULL,
 credits INT NOT NULL,
 field_id INT,
 subfield_id INT,
 domain_id INT,
 CONSTRAINT fk_assessment_type
  FOREIGN KEY(type_id) 
   REFERENCES assessment_types(type_id),
 CONSTRAINT fk_assessment_field
  FOREIGN KEY(field_id) 
   REFERENCES fields(field_id),
 CONSTRAINT fk_assessment_subfield
  FOREIGN KEY(subfield_id) 
   REFERENCES subfields(subfield_id),
 CONSTRAINT fk_assessment_domain
  FOREIGN KEY(domain_id) 
   REFERENCES domains(domain_id)
);

CREATE TABLE asssessment_subject (
 assessment_id INT NOT NULL,
 subject_id INT NOT NULL,
 CONSTRAINT fk_assessment_subject
  FOREIGN KEY(assessment_id)
   REFERENCES assessments(assessment_id)
    ON DELETE CASCADE,
 CONSTRAINT fk_subject_assessment
  FOREIGN KEY(subject_id)
   REFERENCES subjects(subject)
    ON DELETE CASCADE
);
