create table if not exists openai_usage (
  id serial primary key,
  user_id int,
  model text,
  prompt_tokens int,
  completion_tokens int,
  cost numeric,
  created_at timestamp default now()
);