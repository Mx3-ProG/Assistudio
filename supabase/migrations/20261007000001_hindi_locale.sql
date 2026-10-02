-- Hindi (hi) becomes a supported locale: sales content, contract templates and
-- client dossiers may now be authored in it. Other locale columns are free text.
alter table public.sales_content drop constraint if exists sales_content_locale_check;
alter table public.sales_content add constraint sales_content_locale_check
  check (locale in ('en', 'fr', 'de', 'es', 'pt', 'it', 'nl', 'ar', 'hi'));

alter table public.contract_templates drop constraint if exists contract_templates_locale_check;
alter table public.contract_templates add constraint contract_templates_locale_check
  check (locale in ('en', 'fr', 'de', 'es', 'pt', 'it', 'nl', 'ar', 'hi'));

alter table public.commercial_dossiers drop constraint if exists commercial_dossiers_locale_check;
alter table public.commercial_dossiers add constraint commercial_dossiers_locale_check
  check (locale in ('en', 'fr', 'de', 'es', 'pt', 'it', 'nl', 'ar', 'hi'));
