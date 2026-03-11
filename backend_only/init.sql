-- Table temporaire pour les patients (pour referencer la FK)
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table temporaire pour les docteurs (pour referencer la FK)
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Table 1 : periodontal_charts
CREATE TYPE chart_status AS ENUM ('draft', 'finalized');

CREATE TABLE IF NOT EXISTS periodontal_charts (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status chart_status DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2 : periodontal_teeth
CREATE TABLE IF NOT EXISTS periodontal_teeth (
    id SERIAL PRIMARY KEY,
    chart_id INT REFERENCES periodontal_charts(id) ON DELETE CASCADE,
    tooth_number INT NOT NULL CHECK (tooth_number BETWEEN 11 AND 48),
    mobility INT DEFAULT 0 CHECK (mobility BETWEEN 0 AND 3),
    furcation INT DEFAULT 0 CHECK (furcation BETWEEN 0 AND 3),
    UNIQUE(chart_id, tooth_number)
);

-- Table 3 : periodontal_sites
CREATE TABLE IF NOT EXISTS periodontal_sites (
    id SERIAL PRIMARY KEY,
    tooth_id INT REFERENCES periodontal_teeth(id) ON DELETE CASCADE,
    site_position INT NOT NULL CHECK (site_position BETWEEN 1 AND 6),
    pd INT CHECK (pd >= 0),
    gm INT,
    bop BOOLEAN DEFAULT FALSE,
    pi BOOLEAN DEFAULT FALSE,
    UNIQUE(tooth_id, site_position)
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_charts_patient ON periodontal_charts(patient_id);
CREATE INDEX IF NOT EXISTS idx_teeth_chart ON periodontal_teeth(chart_id);
CREATE INDEX IF NOT EXISTS idx_sites_tooth ON periodontal_sites(tooth_id);

-- Données mock pour tester (QA)
INSERT INTO patients (id, first_name, last_name) VALUES (1, 'Jean', 'Dupont') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, name) VALUES (1, 'Dr. Martin') ON CONFLICT DO NOTHING;
