-- ============================================================
-- タスク貯金アプリ 初期マイグレーション
-- Supabase Auth は使用せず、自前の users テーブルで管理
-- ============================================================

-- users テーブル
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,
  display_name  text,
  is_log_public     boolean not null default false,
  is_balance_public boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- login_attempts テーブル（レート制限用）
create table if not exists login_attempts (
  id           uuid primary key default gen_random_uuid(),
  username     text not null,
  attempted_at timestamptz not null default now(),
  success      boolean not null
);

create index if not exists login_attempts_username_idx on login_attempts (username, attempted_at);

-- actions テーブル（ユーザーが作成する項目）
create table if not exists actions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('save', 'spend')),
  amount     integer not null check (amount > 0),
  memo       text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists actions_user_id_idx on actions (user_id);

-- logs テーブル（実行記録）
create table if not exists logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  action_id   uuid references actions(id) on delete set null,
  amount      integer not null check (amount > 0),
  type        text not null check (type in ('save', 'spend')),
  memo        text,
  executed_at timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists logs_user_id_idx on logs (user_id, executed_at desc);

-- balances ビュー
create or replace view balances as
select
  user_id,
  coalesce(sum(case when type = 'save' then amount else -amount end), 0)::integer as balance
from logs
group by user_id;

-- ============================================================
-- RLS: 全テーブルを有効化し、service_role 専用にする
-- （anon / authenticated ロールに対して許可ポリシーを一切作らない）
-- ============================================================
alter table users           enable row level security;
alter table login_attempts  enable row level security;
alter table actions         enable row level security;
alter table logs            enable row level security;
