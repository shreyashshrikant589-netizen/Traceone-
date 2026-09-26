# TraceOne Supabase Schema Export Guide

This guide is for obtaining schema metadata from the Supabase Dashboard without reading application rows or modifying the database.

The current repository cannot perform remote schema introspection because the Supabase CLI, PostgreSQL client tools, backend credentials, and local migrations are unavailable.

## Safety

- Run these queries in the Supabase Dashboard SQL Editor.
- The queries below read PostgreSQL metadata only.
- They do not read application table rows.
- They do not write, alter, delete, truncate, drop, or recreate anything.
- Do not paste keys, passwords, access tokens, JWTs, or row data into the repository.
- Return the result tables or a sanitized export to the backend developer.

## Target tables

The metadata queries cover these requested tables when they exist:

```text
profiles
cases
case_members
case_invites
zones
search_sessions
volunteer_locations
search_expansions
evidence
witness_reports
reports
ai_search_priorities
evidence_graph_nodes
evidence_graph_edges
possible_matches
case_publications
notifications
police_notifications
case_timeline
case_settings
device_sessions
sync_queue
audit_logs
missing_persons
```

## Option A: SQL Editor

Open the Supabase Dashboard for the project, open **SQL Editor**, and run each read-only query separately.

### 1. Tables and columns

Returns existing `public` tables from the target list, including exact PostgreSQL type metadata, nullability, defaults, and ordinal position.

```sql
WITH target_tables(table_name) AS (
  VALUES
    ('profiles'),
    ('cases'),
    ('case_members'),
    ('case_invites'),
    ('zones'),
    ('search_sessions'),
    ('volunteer_locations'),
    ('search_expansions'),
    ('evidence'),
    ('witness_reports'),
    ('reports'),
    ('ai_search_priorities'),
    ('evidence_graph_nodes'),
    ('evidence_graph_edges'),
    ('possible_matches'),
    ('case_publications'),
    ('notifications'),
    ('police_notifications'),
    ('case_timeline'),
    ('case_settings'),
    ('device_sessions'),
    ('sync_queue'),
    ('audit_logs'),
    ('missing_persons')
)
SELECT
  c.table_schema,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_schema,
  c.udt_name,
  c.domain_schema,
  c.domain_name,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.datetime_precision
FROM information_schema.columns AS c
JOIN target_tables AS t ON t.table_name = c.table_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
```

### 2. Existing tables

This distinguishes a table that exists from one that has no metadata row.

```sql
WITH target_tables(table_name) AS (
  VALUES
    ('profiles'), ('cases'), ('case_members'), ('case_invites'), ('zones'),
    ('search_sessions'), ('volunteer_locations'), ('search_expansions'),
    ('evidence'), ('witness_reports'), ('reports'), ('ai_search_priorities'),
    ('evidence_graph_nodes'), ('evidence_graph_edges'), ('possible_matches'),
    ('case_publications'), ('notifications'), ('police_notifications'),
    ('case_timeline'), ('case_settings'), ('device_sessions'), ('sync_queue'),
    ('audit_logs'), ('missing_persons')
)
SELECT
  t.table_name,
  (to_regclass(format('public.%I', t.table_name)) IS NOT NULL) AS table_exists
FROM target_tables AS t
ORDER BY t.table_name;
```

### 3. Primary keys and unique constraints

```sql
SELECT
  ns.nspname AS table_schema,
  cls.relname AS table_name,
  con.conname AS constraint_name,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
  END AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint AS con
JOIN pg_class AS cls ON cls.oid = con.conrelid
JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND con.contype IN ('p', 'u')
ORDER BY cls.relname, con.conname;
```

### 4. Foreign keys

```sql
SELECT
  source_ns.nspname AS source_schema,
  source_table.relname AS source_table,
  constraint_obj.conname AS constraint_name,
  target_ns.nspname AS target_schema,
  target_table.relname AS target_table,
  pg_get_constraintdef(constraint_obj.oid, true) AS definition
FROM pg_constraint AS constraint_obj
JOIN pg_class AS source_table ON source_table.oid = constraint_obj.conrelid
JOIN pg_namespace AS source_ns ON source_ns.oid = source_table.relnamespace
JOIN pg_class AS target_table ON target_table.oid = constraint_obj.confrelid
JOIN pg_namespace AS target_ns ON target_ns.oid = target_table.relnamespace
WHERE source_ns.nspname = 'public'
  AND constraint_obj.contype = 'f'
ORDER BY source_table.relname, constraint_obj.conname;
```

### 5. Check constraints

```sql
SELECT
  ns.nspname AS table_schema,
  cls.relname AS table_name,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint AS con
JOIN pg_class AS cls ON cls.oid = con.conrelid
JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND con.contype = 'c'
ORDER BY cls.relname, con.conname;
```

### 6. Indexes

```sql
SELECT
  schemaname AS table_schema,
  tablename AS table_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 7. RLS enabled status

```sql
SELECT
  ns.nspname AS table_schema,
  cls.relname AS table_name,
  cls.relrowsecurity AS rls_enabled,
  cls.relforcerowsecurity AS rls_forced
FROM pg_class AS cls
JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relkind IN ('r', 'p')
ORDER BY cls.relname;
```

### 8. RLS policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 9. PostGIS geometry/geography metadata

This reports type metadata only. It does not select any location values.

```sql
SELECT
  ns.nspname AS table_schema,
  cls.relname AS table_name,
  attr.attname AS column_name,
  format_type(attr.atttypid, attr.atttypmod) AS formatted_type,
  type_ns.nspname AS type_schema,
  type_obj.typname AS type_name,
  attr.attnotnull AS not_null
FROM pg_attribute AS attr
JOIN pg_class AS cls ON cls.oid = attr.attrelid
JOIN pg_namespace AS ns ON ns.oid = cls.relnamespace
JOIN pg_type AS type_obj ON type_obj.oid = attr.atttypid
JOIN pg_namespace AS type_ns ON type_ns.oid = type_obj.typnamespace
WHERE ns.nspname = 'public'
  AND cls.relkind IN ('r', 'p')
  AND attr.attnum > 0
  AND NOT attr.attisdropped
  AND type_obj.typname IN ('geometry', 'geography')
ORDER BY cls.relname, attr.attnum;
```

`formatted_type` is the metadata field to preserve for values such as a point/polygon subtype and SRID when PostgreSQL exposes them through the column typmod.

## Option B: Generated Supabase database types

If the project supports generated database types, use the Supabase Dashboard or Supabase CLI to generate types from the linked project.

### Dashboard

1. Open the project in the Supabase Dashboard.
2. Open the project API or database types area.
3. Generate/download the database types for the `public` schema.
4. Save the generated file outside secrets and row data.
5. Provide the generated type file to the backend developer as the schema source.

### CLI

On a machine where the Supabase CLI is already installed and authenticated, run a non-destructive type-generation command from the repository root:

```text
supabase gen types typescript --project-id <project-ref> > database.types.ts
```

Do not add access tokens or service-role keys to the command, shell history, or repository. If the project is linked locally, the project reference may be omitted according to the installed CLI version. Type generation reads schema metadata and writes a local type file; it does not modify the remote database.

The current machine has no Supabase CLI, so this option is documentation for a separately authenticated development machine.

## Returning the result safely

Return either:

- The result grids from the metadata queries above, or
- The generated database type file

Do not return:

- Any table rows
- User profiles
- Case evidence
- Coordinates
- Tokens or credentials
- SQL editor secrets

After the metadata is supplied, update `docs/database-schema.md` and mark each item `VERIFIED FROM SUPABASE` only when directly supported by the returned metadata.
