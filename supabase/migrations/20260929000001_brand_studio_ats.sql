-- =============================================================================
-- Brand rename (2026-09-25): "STUDIO" → "Studio ATS" in the names shown to
-- users (product name on sales and dashboards, commission rule labels on the
-- recurring book, setting descriptions in admin). Display text only: slugs,
-- lookup keys and ids are unchanged, and no rate or price is touched.
-- =============================================================================

update public.products set name = 'Studio ATS' where slug = 'studio' and name = 'STUDIO';

update public.commission_rules
   set name = regexp_replace(name, '^STUDIO\M', 'Studio ATS')
 where name ~ '^STUDIO\M';

update public.settings
   set description = regexp_replace(description, '\mSTUDIO\M', 'Studio ATS', 'g')
 where description ~ '\mSTUDIO\M';
