CREATE TABLE subjects (
 subject_id INT PRIMARY KEY,
 name VARCHAR
);

CREATE TABLE standard_types (
 type_id INT PRIMARY KEY,
 name VARCHAR
);

CREATE TABLE fields (
 field_id INT PRIMARY KEY,
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

CREATE TABLE standards (
 standard_number INT PRIMARY KEY,
 title VARCHAR NOT NULL,
 internal BOOL NOT NULL,
 type_id INT,
 version INT NOT NULL,
 level INT NOT NULL,
 credits INT NOT NULL,
 field_id INT,
 subfield_id INT,
 domain_id INT,
 CONSTRAINT fk_standard_type
  FOREIGN KEY(type_id) 
   REFERENCES standard_types(type_id),
 CONSTRAINT fk_standard_field
  FOREIGN KEY(field_id) 
   REFERENCES fields(field_id),
 CONSTRAINT fk_standard_subfield
  FOREIGN KEY(subfield_id) 
   REFERENCES subfields(subfield_id),
 CONSTRAINT fk_standard_domain
  FOREIGN KEY(domain_id) 
   REFERENCES domains(domain_id)
);

CREATE TABLE standard_subject (
 standard_number INT NOT NULL,
 subject_id INT NOT NULL,
 CONSTRAINT fk_standard_subject
  FOREIGN KEY(standard_number)
   REFERENCES standards(standard_number)
    ON DELETE CASCADE,
 CONSTRAINT fk_subject_standard
  FOREIGN KEY(subject_id)
   REFERENCES subjects(subject_id)
    ON DELETE CASCADE
);
