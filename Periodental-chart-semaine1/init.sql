CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chart_exams (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    exam_type VARCHAR(50) CHECK (exam_type IN ('initial', 'reevaluation')),
    practitioner VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tooth_sites (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    exam_id INT REFERENCES chart_exams(id) ON DELETE CASCADE,
    tooth_number INT NOT NULL,        -- FDI (11 to 48)
    site_position VARCHAR(10) NOT NULL, -- e.g. 'a', 'b', 'c', 'b-a'
    pd INT,
    gm INT,
    cal INT,
    bop BOOLEAN DEFAULT FALSE,
    plaque BOOLEAN DEFAULT FALSE,
    mobility INT DEFAULT 0,
    furcation INT DEFAULT 0,
    implant BOOLEAN DEFAULT FALSE,
    prognosis VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertion de données de test
INSERT INTO patients (id, first_name, last_name, date_of_birth) VALUES
(1, 'Jean', 'Dupont', '1980-05-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chart_exams (id, patient_id, exam_date, exam_type, practitioner) VALUES
(1, 1, CURRENT_DATE, 'initial', 'Dr. Martin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tooth_sites (patient_id, exam_id, tooth_number, site_position, pd, gm, cal, bop) VALUES
(1, 1, 18, 1, 3, 0, 3, false),
(1, 1, 18, 2, 4, 1, 5, true),
(1, 1, 18, 3, 2, 0, 2, false),
(1, 1, 11, 1, 2, 0, 2, false),
(1, 1, 11, 2, 2, 0, 2, false),
(1, 1, 11, 3, 2, 0, 2, false)
ON CONFLICT (id) DO NOTHING;
