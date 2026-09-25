-- Country per buyer, and product weight in grams.
--
-- 1. applications.country / accounts.country (ISO 3166-1 alpha-2, e.g. 'GR', 'DE', 'CY').
--    Decides VAT: only buyers based in Greece are charged Greek VAT (see chargesGreekVat in
--    src/lib/tax.ts). Every existing row defaults to 'GR'. The one live account in Cyprus is
--    backfilled from its free-text store location so it is not suddenly charged Greek VAT.
--
-- 2. styles.weight_g replaces weight_oz on the storefront. The old column was never filled
--    in, so every product page printed "0 oz per pair". Backfilled with the owner's figures
--    (2026-09-25): winter shoes about 1 kg per pair, summer shoes about 600 g. Styles sold in
--    both seasons follow their category — boots, formal and sneakers are the heavier build.
--    weight_oz stays in place, unused, so nothing that still reads it breaks.

alter table applications add column if not exists country text not null default 'GR';
alter table accounts add column if not exists country text not null default 'GR';

update accounts set country = 'CY'
where store_location ~* '(cypr|κύπρ|larnac|λάρνακ|nicosia|λευκωσ|limassol|λεμεσ|paphos|πάφο)';
update applications set country = 'CY'
where store_location ~* '(cypr|κύπρ|larnac|λάρνακ|nicosia|λευκωσ|limassol|λεμεσ|paphos|πάφο)';

alter table styles add column if not exists weight_g integer
  check (weight_g is null or (weight_g > 0 and weight_g < 10000));

update styles set weight_g = case
  when season = 'winter' then 1000
  when season = 'summer' then 600
  when category in ('boots', 'formal', 'sneakers', 'anatomic') then 1000
  else 600
end
where weight_g is null;
