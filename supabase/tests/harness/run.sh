#!/usr/bin/env bash
# Runs the SQL test suites against a throwaway local Postgres cluster:
#   stub (auth schema, roles) → every migration in order → seed → every *_test.sql.
# Nothing touches a real database. Requires a local Postgres ≥ 15 (initdb, pg_ctl, psql).
#
#   npm run db:test:local
#   KEEP_DB=1 npm run db:test:local   # leave the cluster running for inspection
set -euo pipefail
export LC_ALL=C LANG=C

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/studio-pg.XXXXXX")"
PORT="${PGTEST_PORT:-54329}"
export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres

cleanup() {
  if [[ -z "${KEEP_DB:-}" ]]; then
    pg_ctl -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true
    rm -rf "$TMP"
  else
    echo "Cluster kept ($TMP): psql -h 127.0.0.1 -p $PORT -U postgres"
  fi
}
trap cleanup EXIT

initdb -D "$TMP/data" -U postgres --auth=trust --locale=C --encoding=UTF8 >/dev/null
pg_ctl -D "$TMP/data" -o "-p $PORT -k '' -c listen_addresses=127.0.0.1 -c fsync=off -c wal_level=logical" -l "$TMP/log" -w start >/dev/null

PSQL=(psql -X -q -v ON_ERROR_STOP=1)
"${PSQL[@]}" -f "$ROOT/supabase/tests/harness/supabase_stub.sql" >/dev/null

for m in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate  $(basename "$m")"
  "${PSQL[@]}" -f "$m" >/dev/null
done

echo "seed     seed.sql"
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql" >/dev/null

failed=0
for t in "$ROOT"/supabase/tests/*_test.sql; do
  echo "test     $(basename "$t")"
  if ! out="$("${PSQL[@]}" -f "$t" 2>&1)"; then
    echo "$out" | grep -E "ok |ERROR|ASSERTION|CONTEXT" | tail -20
    failed=1
  else
    echo "$out" | grep -c "ok " | xargs -I{} echo "         {} assertions passed"
  fi
done
exit $failed
