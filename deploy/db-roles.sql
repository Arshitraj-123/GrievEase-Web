-- GrievEase Least-Privilege PostgreSQL Database Roles Configuration

-- 1. Create Application Role (Standard REST API & Web BFF)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'grievease_app') THEN
    CREATE ROLE grievease_app WITH LOGIN PASSWORD 'change_in_production_app_pw';
  END IF;
END
$$;

-- Grant DML privileges on public schema
GRANT CONNECT ON DATABASE grievease_prod TO grievease_app;
GRANT USAGE ON SCHEMA public TO grievease_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO grievease_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO grievease_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO grievease_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO grievease_app;

-- 2. Create Read-Only Audit & Reporting Role
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'grievease_ro') THEN
    CREATE ROLE grievease_ro WITH LOGIN PASSWORD 'change_in_production_ro_pw';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE grievease_prod TO grievease_ro;
GRANT USAGE ON SCHEMA public TO grievease_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO grievease_ro;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO grievease_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO grievease_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO grievease_ro;

-- 3. Create Migration / DDL Deployment Role
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'grievease_migrator') THEN
    CREATE ROLE grievease_migrator WITH LOGIN CREATEDB PASSWORD 'change_in_production_migrator_pw';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE grievease_prod TO grievease_migrator;
GRANT ALL PRIVILEGES ON SCHEMA public TO grievease_migrator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO grievease_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO grievease_migrator;

