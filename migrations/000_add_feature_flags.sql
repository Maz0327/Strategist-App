create table if not exists feature_flags (
  name text primary key,
  enabled boolean not null default false,
  rollout_percent int default 0
);