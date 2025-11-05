-- BUG-002 Diagnostic SQL Queries
-- Run these via: encore db shell db --write < scripts/check-bug-002.sql

\echo '=== BUG-002 Diagnostic ==='
\echo ''

\echo '1. Checking run_events schema...'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'run_events'
ORDER BY ordinal_position;

\echo ''
\echo '2. Checking for recent run_events...'
SELECT run_id, COUNT(*) as event_count
FROM run_events
GROUP BY run_id
ORDER BY MAX(created_at) DESC
LIMIT 5;

\echo ''
\echo '3. Checking event kinds in latest run...'
SELECT kind, COUNT(*) as count
FROM run_events
WHERE run_id = (SELECT run_id FROM run_events ORDER BY created_at DESC LIMIT 1)
GROUP BY kind
ORDER BY kind;

\echo ''
\echo '4. Checking if graph_projection_cursors exists...'
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'graph_projection_cursors'
) as table_exists;

\echo ''
\echo '5. Checking graph_projection_cursors data...'
SELECT run_id, next_seq, updated_at
FROM graph_projection_cursors
ORDER BY updated_at DESC
LIMIT 5;

\echo ''
\echo '6. Checking screens table...'
SELECT COUNT(*) as total_screens FROM screens;

\echo ''
\echo '7. Checking graph_persistence_outcomes...'
SELECT run_id, COUNT(*) as outcome_count
FROM graph_persistence_outcomes
GROUP BY run_id
ORDER BY run_id DESC
LIMIT 5;

\echo ''
\echo '=== Diagnostic Complete ==='

