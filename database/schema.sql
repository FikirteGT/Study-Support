CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    section_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL REFERENCES students(id),
    student_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 3,
    activities JSONB NOT NULL,
    section_references JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);