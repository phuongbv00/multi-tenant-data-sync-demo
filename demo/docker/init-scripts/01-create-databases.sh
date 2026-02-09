#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE consumer_db;
    GRANT ALL PRIVILEGES ON DATABASE consumer_db TO $POSTGRES_USER;
    
    -- Also grant connect to app_user if exists (might be created later by migration but good to prepare)
    -- We can't grant to app_user here if it doesn't exist yet, so skipping that part. 
    -- The migration script will handle role creation if needed or we can do it here.
EOSQL
