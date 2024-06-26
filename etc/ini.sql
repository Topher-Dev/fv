
-- Create a simple table for a person drop if exists person;
DROP TABLE IF EXISTS person;
CREATE TABLE person (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER,
    updated_by INTEGER,
    deleted_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);


-- Create a simple table for a person drop if exists person;
DROP TABLE IF EXISTS external_id;
CREATE TABLE external_id (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,
    internal_id INTEGER,
    id_type VARCHAR(50) NOT NULL,
    source VARCHAR(255),

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER,
    updated_by INTEGER,
    deleted_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create a unique constraint on the external_id and internal_id and id_type
ALTER TABLE external_id ADD CONSTRAINT unique_external_id_internal_id_id_type UNIQUE (external_id, internal_id, id_type);