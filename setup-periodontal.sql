-- SQL Script to initialize Periodontal Charting for My Prescription
-- Run this in your PostgreSQL database (e.g. 'periodontal')

-- Extension for enumerations (optional but clean)
DO $$ BEGIN
    CREATE TYPE chart_status AS ENUM ('draft', 'finalized');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main Exam Table
CREATE TABLE IF NOT EXISTS periodontal_charts (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(255) NOT NULL, -- Compatible with numeric or UUID strings
    doctor_id VARCHAR(255),
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status chart_status DEFAULT 'draft',
    notes TEXT,
    avg_pd DECIMAL(4,2),
    avg_cal DECIMAL(4,2),
    bop_pct INT,
    pi_pct INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster patient lookups
CREATE INDEX IF NOT EXISTS idx_perio_charts_patient_id ON periodontal_charts(patient_id);

-- Sites Data (Visual aspects: PD, GM, BoP, PI)
CREATE TABLE IF NOT EXISTS periodontal_sites (
    id SERIAL PRIMARY KEY,
    exam_id INT REFERENCES periodontal_charts(id) ON DELETE CASCADE,
    tooth_number INT NOT NULL,
    site_location VARCHAR(20) NOT NULL, -- e.g. 'a', 'b', 'c', 'b-a', 'b-b', 'b-c'
    probing_depth INT,
    gingival_margin INT,
    bleeding_on_probing BOOLEAN DEFAULT FALSE,
    plaque BOOLEAN DEFAULT FALSE,
    
    -- Tooth-level data stored alongside sites for simplicity in the batch approach
    mobility INT DEFAULT 0,
    furcation INT,
    furcation_p INT,
    furcation_p2 INT,
    implant BOOLEAN DEFAULT FALSE,
    prognosis TEXT,
    
    UNIQUE(exam_id, tooth_number, site_location)
);

-- Index for exam data retrieval
CREATE INDEX IF NOT EXISTS idx_perio_sites_exam_id ON periodontal_sites(exam_id);
