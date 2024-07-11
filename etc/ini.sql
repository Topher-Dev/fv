
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


DROP TABLE IF EXISTS ufc_event;
CREATE TABLE ufc_event (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    web_url VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_fmid',
    fmid INTEGER UNIQUE,
    data JSONB,
    main_card TIMESTAMP,
    prelims_card TIMESTAMP,
    timezone VARCHAR(10),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER,
    updated_by INTEGER,
    deleted_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);



DROP TABLE IF EXISTS ufc_fight;
CREATE TABLE ufc_fight (

    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    fmid INTEGER NOT NULL,
    fighter_1_id INTEGER,
    fighter_2_id INTEGER,
    fighter_1_url VARCHAR(255) NOT NULL,
    fighter_2_url VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_data',

    data JSONB,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER,
    updated_by INTEGER,
    deleted_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP

);

--add foreign key constraints
ALTER TABLE ufc_fight ADD CONSTRAINT fk_ufc_fight_event_id FOREIGN KEY (event_id) REFERENCES ufc_event(id);


DROP TABLE IF EXISTS ufc_fighter;
CREATE TABLE ufc_fighter (

    id SERIAL PRIMARY KEY,
    fmid INTEGER UNIQUE,
    data JSONB,
    web_url VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_imgs',

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER,
    updated_by INTEGER,
    deleted_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);