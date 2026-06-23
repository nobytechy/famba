-- ============================================================================
-- Famba Fleet — Supabase schema + demo seed.
-- Idempotent and re-runnable: paste into Supabase Studio → SQL Editor → Run.
-- All tables are namespaced `famba_` so they can share a project safely.
-- ============================================================================

create table if not exists famba_drivers (
  id              text primary key,
  name            text not null,
  phone           text,
  score           int  default 80,
  license_expiry  date
);

create table if not exists famba_vehicles (
  id          text primary key,
  reg         text not null,
  make        text,
  model       text,
  type        text,            -- Truck | Van | Pickup
  route       text,            -- key into the app's route map
  driver_id   text references famba_drivers(id),
  fuel_pct    numeric default 60,
  odo_km      numeric default 0,
  tank_l      numeric default 100
);

create table if not exists famba_jobs (
  id          text primary key,
  ref         text not null,
  client      text,
  pickup      text,
  dropoff     text,
  cargo       text,
  vehicle_id  text references famba_vehicles(id),
  driver_id   text references famba_drivers(id),
  status      text default 'Pending',   -- Pending | Assigned | In Transit | Delivered
  eta_min     int  default 0,
  created_at  timestamptz default now()
);

create table if not exists famba_fuel_logs (
  id          text primary key,
  vehicle_id  text references famba_vehicles(id),
  date        date,
  litres      numeric,
  odo_km      numeric,
  cost_usd    numeric,
  kmpl        numeric
);

create table if not exists famba_compliance (
  id           text primary key,
  vehicle_id   text references famba_vehicles(id),
  vehicle_reg  text,
  type         text,            -- ZINARA Licence | Insurance | Vehicle Fitness | ZIMRA Route Permit
  ref          text,
  expiry       date
);

create table if not exists famba_maintenance (
  id                   text primary key,
  vehicle_id           text references famba_vehicles(id),
  service_interval_km  numeric default 10000,
  last_service_odo     numeric default 0,
  last_service_date    date
);

-- Skips — the steel waste containers hired out (waste / skip-hire vertical).
-- Tracked through their lifecycle; dwell time vs free_days drives demurrage.
create table if not exists famba_skips (
  id           text primary key,
  code         text not null,            -- skip number, e.g. SKP-01
  size         text,                     -- 6 m³ | 8 m³ | 12 m³ | 14 m³
  status       text default 'In Yard',   -- In Yard | Deployed | Full | In Transit
  client       text,
  site         text,
  deployed_at  date,                     -- when dropped at site (starts dwell clock)
  daily_rate   numeric default 8,        -- rental $/day
  free_days    int default 3             -- included days before demurrage
);

-- Live GPS pings from the driver phone app (the backend also keeps these).
create table if not exists famba_pings (
  id          bigint generated always as identity primary key,
  vehicle_id  text references famba_vehicles(id),
  lat         double precision,
  lng         double precision,
  speed_kmh   numeric,
  ts          timestamptz default now()
);

-- Staff logins with role-based access (admin | operator | driver | staff).
create table if not exists famba_staff (
  id          text primary key,
  name        text not null,
  role        text not null default 'operator',
  pin         text not null,
  phone       text,
  driver_id   text references famba_drivers(id),
  active      boolean default true
);

-- Trips run by drivers (history + live).
create table if not exists famba_trips (
  id            text primary key,
  driver_id     text references famba_drivers(id),
  driver_name   text,
  vehicle_id    text references famba_vehicles(id),
  vehicle_reg   text,
  route         text,
  date          date,
  distance_km   numeric default 0,
  duration_min  numeric default 0,
  status        text default 'Completed',   -- In Progress | Completed
  note          text
);

-- Live alerts (driver backgrounded/closed app, escalations) for the console.
create table if not exists famba_alerts (
  id           bigint generated always as identity primary key,
  kind         text,
  driver_id    text,
  driver_name  text,
  vehicle_id   text,
  vehicle_reg  text,
  severity     text default 'warning',
  message      text,
  created_at   timestamptz default now()
);

-- Fault / damage reports raised by drivers, worked by the workshop.
create table if not exists famba_fault_reports (
  id           text primary key,
  vehicle_id   text references famba_vehicles(id),
  vehicle_reg  text,
  driver_id    text references famba_drivers(id),
  driver_name  text,
  category     text,
  severity     text,            -- Low | Medium | High
  note         text,
  status       text default 'Open',   -- Open | Acknowledged | Resolved
  created_at   date default current_date
);

-- Expenses (general or vehicle-related). vehicle_id set when category = Vehicle.
create table if not exists famba_expenses (
  id           text primary key,
  kind         text default 'General',   -- General | Vehicle
  category     text,
  vehicle_id   text references famba_vehicles(id),
  vehicle_reg  text,
  amount_usd   numeric default 0,
  note         text,
  recorded_by  text,
  created_at   timestamptz default now()
);

-- Invoices & quotes.
create table if not exists famba_invoices (
  id          text primary key,
  ref         text,
  type        text default 'Invoice',   -- Invoice | Quote
  client      text,
  items       jsonb default '[]',
  total       numeric default 0,
  status      text default 'Draft',
  created_at  timestamptz default now()
);

-- Proof-of-delivery fields on jobs.
alter table famba_jobs add column if not exists pod_to        text;
alter table famba_jobs add column if not exists pod_time      timestamptz;
alter table famba_jobs add column if not exists pod_photo     text;
alter table famba_jobs add column if not exists pod_signature text;

-- Optional odometer photo on fuel logs (anti-fraud).
alter table famba_fuel_logs add column if not exists odo_photo text;

-- Enable realtime for the alerts stream (ignore if already added).
do $$ begin
  begin execute 'alter publication supabase_realtime add table famba_alerts';
  exception when others then null; end;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security. NOTE: these policies are deliberately permissive so the
-- PIN-gated demo (which uses the anon key, not Supabase Auth) can read & write.
-- Tighten to authenticated-only before handling a real client's live data.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'famba_drivers','famba_vehicles','famba_jobs','famba_fuel_logs',
    'famba_compliance','famba_maintenance','famba_skips','famba_pings',
    'famba_staff','famba_trips','famba_fault_reports','famba_alerts','famba_expenses','famba_invoices'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "demo_all" on %I', t);
    execute format('create policy "demo_all" on %I for all using (true) with check (true)', t);
  end loop;
end $$;

-- ============================================================================
-- DEMO SEED  (re-runnable via ON CONFLICT). Dates are relative to today so the
-- expired / near-expiry alerts always look current.
-- ============================================================================

insert into famba_drivers (id, name, phone, score, license_expiry) values
  ('drv-1','Tendai Moyo',    '263771234501', 92, current_date + 240),
  ('drv-2','Farai Chikomo',  '263771234502', 88, current_date + 18),
  ('drv-3','Blessing Ncube', '263771234503', 75, current_date + 410),
  ('drv-4','Kudzai Marira',  '263771234504', 81, current_date - 4),
  ('drv-5','Rumbidzai Phiri','263771234505', 95, current_date + 120),
  ('drv-6','Tapiwa Sibanda', '263771234506', 67, current_date + 55)
on conflict (id) do update set
  name=excluded.name, phone=excluded.phone, score=excluded.score, license_expiry=excluded.license_expiry;

insert into famba_vehicles (id, reg, make, model, type, route, driver_id, fuel_pct, odo_km, tank_l) values
  ('veh-1','AEX 1234','Isuzu','FVR Truck','Truck','msasa','drv-1',62,184320,200),
  ('veh-2','AFG 5821','Toyota','Hiace','Van','airport','drv-2',28,96540,70),
  ('veh-3','ACD 9087','Nissan','UD Truck','Truck','chitungwiza','drv-3',81,233110,200),
  ('veh-4','AEB 4410','Toyota','Hilux','Pickup','norton','drv-5',45,142870,80),
  ('veh-5','AGH 2299','Mercedes','Sprinter','Van','borrowdale','drv-6',90,51240,75)
on conflict (id) do update set
  reg=excluded.reg, make=excluded.make, model=excluded.model, type=excluded.type,
  route=excluded.route, driver_id=excluded.driver_id, odo_km=excluded.odo_km;

insert into famba_jobs (id, ref, client, pickup, dropoff, cargo, vehicle_id, driver_id, status, eta_min) values
  ('job-1','FMB-2041','Halsted Builders','Graniteside Depot','Belgravia','Cement 12t','veh-1','drv-1','In Transit',22),
  ('job-2','FMB-2042','OK Mart Distribution','Msasa Yard','Chitungwiza Town','Beverages 4t','veh-2','drv-2','In Transit',41),
  ('job-3','FMB-2043','Delta Beverages','Workington','Norton Centre','Retail mixed','veh-3','drv-3','Assigned',0),
  ('job-4','FMB-2044','Schweppes ZW','Belgravia','Borrowdale Village','Hardware 2t','veh-4','drv-5','Pending',0),
  ('job-5','FMB-2045','TM Pick n Pay','Chitungwiza Town','Graniteside Depot','Spares','veh-5','drv-6','Delivered',0)
on conflict (id) do update set status=excluded.status, vehicle_id=excluded.vehicle_id;

insert into famba_compliance (id, vehicle_id, vehicle_reg, type, ref, expiry) values
  ('doc-1','veh-1','AEX 1234','ZINARA Licence','ZINARA-10001', current_date + 200),
  ('doc-2','veh-1','AEX 1234','Insurance','INSURANCE-10002', current_date + 80),
  ('doc-3','veh-1','AEX 1234','Vehicle Fitness','VEHICLE-10003', current_date + 150),
  ('doc-4','veh-1','AEX 1234','ZIMRA Route Permit','ZIMRA-10004', current_date + 45),
  ('doc-5','veh-2','AFG 5821','ZINARA Licence','ZINARA-10005', current_date + 9),
  ('doc-6','veh-2','AFG 5821','Insurance','INSURANCE-10006', current_date + 30),
  ('doc-7','veh-2','AFG 5821','Vehicle Fitness','VEHICLE-10007', current_date - 10),
  ('doc-8','veh-2','AFG 5821','ZIMRA Route Permit','ZIMRA-10008', current_date + 120),
  ('doc-9','veh-3','ACD 9087','ZINARA Licence','ZINARA-10009', current_date + 140),
  ('doc-10','veh-3','ACD 9087','Insurance','INSURANCE-10010', current_date + 410),
  ('doc-11','veh-3','ACD 9087','Vehicle Fitness','VEHICLE-10011', current_date + 60),
  ('doc-12','veh-3','ACD 9087','ZIMRA Route Permit','ZIMRA-10012', current_date + 5),
  ('doc-13','veh-4','AEB 4410','ZINARA Licence','ZINARA-10013', current_date - 3),
  ('doc-14','veh-4','AEB 4410','Insurance','INSURANCE-10014', current_date + 12),
  ('doc-15','veh-4','AEB 4410','Vehicle Fitness','VEHICLE-10015', current_date + 220),
  ('doc-16','veh-4','AEB 4410','ZIMRA Route Permit','ZIMRA-10016', current_date + 90),
  ('doc-17','veh-5','AGH 2299','ZINARA Licence','ZINARA-10017', current_date + 64),
  ('doc-18','veh-5','AGH 2299','Insurance','INSURANCE-10018', current_date + 300),
  ('doc-19','veh-5','AGH 2299','Vehicle Fitness','VEHICLE-10019', current_date + 18),
  ('doc-20','veh-5','AGH 2299','ZIMRA Route Permit','ZIMRA-10020', current_date + 240)
on conflict (id) do update set expiry=excluded.expiry, vehicle_reg=excluded.vehicle_reg;

insert into famba_maintenance (id, vehicle_id, service_interval_km, last_service_odo, last_service_date) values
  ('mnt-1','veh-1',15000,170520, current_date - 70),
  ('mnt-2','veh-2',10000, 92340, current_date - 24),
  ('mnt-3','veh-3',15000,223510, current_date - 51),
  ('mnt-4','veh-4',10000,135770, current_date - 38),
  ('mnt-5','veh-5',10000, 49740, current_date - 12)
on conflict (id) do update set last_service_odo=excluded.last_service_odo, last_service_date=excluded.last_service_date;

-- Skips: a mix of idle (yard), deployed within free period, and over-rental
-- (demurrage) so the revenue insight has something to recover.
insert into famba_skips (id, code, size, status, client, site, deployed_at, daily_rate, free_days) values
  ('skip-1','SKP-01','6 m³', 'Deployed',  'Halsted Builders',  'Borrowdale — Pomona build', current_date - 9,  8,  3),
  ('skip-2','SKP-02','8 m³', 'Full',      'Avondale Hardware', 'Avondale — shop refit',     current_date - 5,  9,  3),
  ('skip-3','SKP-03','12 m³','Deployed',  'Delta Beverages',   'Graniteside depot',         current_date - 2,  12, 5),
  ('skip-4','SKP-04','6 m³', 'In Yard',   null, null, null, 8,  3),
  ('skip-5','SKP-05','8 m³', 'In Yard',   null, null, null, 9,  3),
  ('skip-6','SKP-06','14 m³','Full',      'City of Harare',    'Workington factory yard',   current_date - 11, 14, 5),
  ('skip-7','SKP-07','12 m³','In Transit','OK Mart',           'Chitungwiza — Unit L',      current_date - 1,  12, 5),
  ('skip-8','SKP-08','6 m³', 'Deployed',  'Mr Chideya',        'Mt Pleasant residence',     current_date - 4,  6,  7),
  ('skip-9','SKP-09','8 m³', 'In Yard',   null, null, null, 9,  3)
on conflict (id) do update set
  status=excluded.status, client=excluded.client, site=excluded.site,
  deployed_at=excluded.deployed_at, daily_rate=excluded.daily_rate, free_days=excluded.free_days;

-- Fuel logs: a healthy spread plus one deliberate anomaly on veh-3 (theft demo).
insert into famba_fuel_logs (id, vehicle_id, date, litres, odo_km, cost_usd, kmpl) values
  ('fuel-s1','veh-1', current_date - 4,  150, 184100, 237.0, 2.55),
  ('fuel-s2','veh-1', current_date - 8,  148, 183710, 233.8, 2.60),
  ('fuel-s3','veh-2', current_date - 4,   45,  96420,  71.1, 8.10),
  ('fuel-s4','veh-2', current_date - 8,   47,  96050,  74.3, 8.00),
  ('fuel-s5','veh-3', current_date - 4,  155, 232900, 244.9, 2.58),
  ('fuel-s6','veh-3', current_date - 8,  280, 232480, 442.4, 1.43),  -- << ANOMALY
  ('fuel-s7','veh-4', current_date - 4,   42, 142700,  66.4, 9.05),
  ('fuel-s8','veh-5', current_date - 4,   38,  51100,  60.0, 9.20)
on conflict (id) do update set litres=excluded.litres, kmpl=excluded.kmpl, date=excluded.date;

-- Staff logins (role-based). PINs: admin 1975 · operator 2200 · workshop 3300 ·
-- drivers 1001-1006.
insert into famba_staff (id, name, role, pin, phone, driver_id, active) values
  ('usr-1','Rumbidzai Admin','admin',   '1975','263772110571', null,   true),
  ('usr-2','Patience Dube',  'operator','2200','263772110572', null,   true),
  ('usr-3','Workshop Desk',  'staff',   '3300','263772110573', null,   true),
  ('usr-4','Tendai Moyo',    'driver',  '1001','263771234501','drv-1', true),
  ('usr-5','Farai Chikomo',  'driver',  '1002','263771234502','drv-2', true),
  ('usr-6','Blessing Ncube', 'driver',  '1003','263771234503','drv-3', true),
  ('usr-7','Kudzai Marira',  'driver',  '1004','263771234504','drv-4', true),
  ('usr-8','Rumbidzai Phiri','driver',  '1005','263771234505','drv-5', true),
  ('usr-9','Tapiwa Sibanda', 'driver',  '1006','263771234506','drv-6', true)
on conflict (id) do update set
  name=excluded.name, role=excluded.role, pin=excluded.pin,
  phone=excluded.phone, driver_id=excluded.driver_id, active=excluded.active;

-- A little trip history per driver.
insert into famba_trips (id, driver_id, driver_name, vehicle_id, vehicle_reg, route, date, distance_km, duration_min, status, note) values
  ('trip-1','drv-1','Tendai Moyo',    'veh-1','AEX 1234','CBD → Msasa Industrial',     current_date - 2,  64, 95,  'Completed',''),
  ('trip-2','drv-1','Tendai Moyo',    'veh-1','AEX 1234','CBD → Borrowdale',            current_date - 4,  41, 58,  'Completed','heavy traffic on Borrowdale road'),
  ('trip-3','drv-2','Farai Chikomo',  'veh-2','AFG 5821','CBD → R.G. Mugabe Airport',   current_date - 1,  38, 47,  'Completed',''),
  ('trip-4','drv-2','Farai Chikomo',  'veh-2','AFG 5821','CBD → Chitungwiza',           current_date - 3,  52, 66,  'Completed','reported soft brakes'),
  ('trip-5','drv-3','Blessing Ncube', 'veh-3','ACD 9087','CBD → Chitungwiza',           current_date - 1,  49, 70,  'Completed','diesel smell near tank'),
  ('trip-6','drv-5','Rumbidzai Phiri','veh-4','AEB 4410','CBD → Norton',                current_date - 2,  88, 110, 'Completed',''),
  ('trip-7','drv-6','Tapiwa Sibanda', 'veh-5','AGH 2299','CBD → Borrowdale',            current_date - 2,  31, 44,  'Completed','')
on conflict (id) do update set status=excluded.status, note=excluded.note;

-- Open fault reports for the workshop (one ties to the fuel anomaly).
insert into famba_fault_reports (id, vehicle_id, vehicle_reg, driver_id, driver_name, category, severity, note, status, created_at) values
  ('flt-1','veh-2','AFG 5821','drv-2','Farai Chikomo', 'Brakes','High',  'Brake pedal soft, pulls left under braking.',         'Open',         current_date - 2),
  ('flt-2','veh-3','ACD 9087','drv-3','Blessing Ncube','Fuel',  'High',  'Smell of diesel near tank, gauge dropping fast.',     'Open',         current_date - 1),
  ('flt-3','veh-4','AEB 4410','drv-5','Rumbidzai Phiri','Body',  'Low',   'Windscreen chip on passenger side.',                  'Acknowledged', current_date - 5),
  ('flt-4','veh-1','AEX 1234','drv-1','Tendai Moyo',    'Tyres', 'Medium','Front-left tyre wearing on the inside edge.',          'Resolved',     current_date - 8)
on conflict (id) do update set status=excluded.status, note=excluded.note;

-- Vehicle friendly name (shown as the always-on map label).
alter table famba_vehicles add column if not exists name text;
update famba_vehicles set name = 'Truck 1'  where id = 'veh-1' and name is null;
update famba_vehicles set name = 'Van 1'    where id = 'veh-2' and name is null;
update famba_vehicles set name = 'Truck 2'  where id = 'veh-3' and name is null;
update famba_vehicles set name = 'Pickup 1' where id = 'veh-4' and name is null;
update famba_vehicles set name = 'Van 2'    where id = 'veh-5' and name is null;

-- Driver profile extras (documents + next of kin). Added non-destructively.
alter table famba_drivers add column if not exists photo_url     text;
alter table famba_drivers add column if not exists license_url   text;
alter table famba_drivers add column if not exists id_url        text;
alter table famba_drivers add column if not exists nok_name      text;
alter table famba_drivers add column if not exists nok_phone     text;

update famba_drivers set nok_name = 'Maria Moyo',     nok_phone = '263772990001' where id = 'drv-1' and nok_name is null;
update famba_drivers set nok_name = 'Grace Chikomo',  nok_phone = '263772990002' where id = 'drv-2' and nok_name is null;
update famba_drivers set nok_name = 'Peter Ncube',    nok_phone = '263772990003' where id = 'drv-3' and nok_name is null;

-- Seed some expenses (general + vehicle-related).
insert into famba_expenses (id, kind, category, vehicle_id, vehicle_reg, amount_usd, note, recorded_by, created_at) values
  ('exp-1','Vehicle','Service',     'veh-1','AEX 1234', 180,  'Full service + oil',       'Patience Dube', now() - interval '2 day'),
  ('exp-2','Vehicle','Tyres',       'veh-3','ACD 9087', 320,  '2 rear tyres',             'Patience Dube', now() - interval '5 day'),
  ('exp-3','Vehicle','ZINARA tolls','veh-2','AFG 5821', 24,   'Harare-Chitungwiza tolls', 'Patience Dube', now() - interval '1 day'),
  ('exp-4','Vehicle','Repairs',     'veh-4','AEB 4410', 95,   'Brake pads front',         'Patience Dube', now() - interval '8 day'),
  ('exp-5','General','Salaries',     null,  null,       1450, 'Driver wages - week',      'Patience Dube', now() - interval '3 day'),
  ('exp-6','General','Utilities',    null,  null,       68,   'Yard electricity',         'Patience Dube', now() - interval '6 day'),
  ('exp-7','General','Marketing',    null,  null,       40,   'Flyers & airtime',         'Patience Dube', now() - interval '10 day')
on conflict (id) do update set amount_usd=excluded.amount_usd, note=excluded.note;

-- Seed invoices / quotes.
insert into famba_invoices (id, ref, type, client, items, total, status, created_at) values
  ('inv-1','INV-1001','Invoice','Halsted Builders','[{"desc":"Cement delivery — 12t","qty":1,"price":240}]',240,'Paid', now() - interval '4 day'),
  ('inv-2','INV-1002','Invoice','OK Mart Distribution','[{"desc":"Beverage run x3","qty":3,"price":85}]',255,'Sent', now() - interval '2 day'),
  ('inv-3','QTE-1003','Quote','Delta Beverages','[{"desc":"Monthly distribution contract","qty":1,"price":4200}]',4200,'Draft', now() - interval '1 day'),
  ('inv-4','INV-1004','Invoice','TM Pick n Pay','[{"desc":"Retail mixed load","qty":2,"price":130}]',260,'Sent', now() - interval '6 day')
on conflict (id) do update set status=excluded.status, total=excluded.total;

-- Done. Verify in Table Editor that the famba_* tables are populated.
