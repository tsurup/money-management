# タスク貯金アプリ 開発指示書（v2：認証自前実装版）

## 1. プロジェクト概要

「タスクを実行することで資金を貯め、設定したアクションを実行することで資金を使用する」ライフログ兼ゲーミフィケーション型の資金管理Webアプリを開発する。

- ユーザーは「貯める項目」と「使う項目」を自由に作成できる（例：「ジョギングした → 100円貯金」「コンビニで無駄遣いしなかった → 50円貯金」「映画を見た → 1500円使用」）
- 項目には**アクション名**と**金額**を設定する
- ユーザーがその項目を「実行した」と記録するたびに、残高が増減する
- 実行履歴はログとして記録し、カレンダー表示・リスト表示の両方で閲覧できる
- ユーザーはユーザー名＋パスワードでアカウントを作成し、ログインする（**Supabase Authは使わず、自前で認証・セッション管理を行う**）
- ユーザーはユーザー名・パスワードの変更、アカウント削除ができる
- ユーザーは自分の記録・残高を他ユーザーに公開するかどうかを選べる

---

## 2. 技術スタック

| 項目 | 技術 |
|---|---|
| フロントエンド | Next.js（App Router）+ TypeScript |
| スタイリング | Tailwind CSS |
| データベース | Supabase（PostgreSQLのみ利用。Supabase Authは使用しない） |
| 認証・セッション管理 | 自前実装（bcryptによるパスワードハッシュ化 + JWTセッション） |
| ホスティング/デプロイ | Vercel |
| コード管理 | GitHub（Vercelと連携し、pushで自動デプロイ） |
| カレンダーUI | 任意のReact用カレンダーライブラリ（例：`react-calendar` や `FullCalendar`） |

---

## 3. 認証方式（方式B：自前実装）の設計方針

前回の指示書で比較した「方式A（Supabase Authをダミーメールで利用）」ではなく、**方式B（自前でユーザーテーブル・パスワード・セッションを管理する方式）を採用**する。コストが高くなる理由は主に「パスワード管理」「セッション管理」「アクセス制御（RLSの代替）」の3点を自作する必要があることだったため、以下の方針でそれぞれ対処する。

### 3.1 パスワード管理
- ライブラリ：`bcryptjs`（Vercelのサーバーレス環境でネイティブビルド不要のため推奨）
- 登録時：入力されたパスワードを bcrypt でハッシュ化し、`password_hash` カラムに保存（平文は一切保存しない）
- ログイン時：入力されたパスワードと `password_hash` を `bcrypt.compare()` で照合
- パスワードポリシー：8文字以上、簡単な強度チェック（数字+英字を推奨する程度のUIバリデーション）
- ログイン試行制限：同一ユーザー名に対する連続失敗を一定回数（例：10回/10分）でロックする簡易レート制限を実装（Supabase側に `login_attempts` テーブルを用意するか、Vercel KV等を利用）

### 3.2 セッション管理
- ライブラリ：`jose`（Vercelのエッジ/サーバーレス環境と相性が良いJWTライブラリ）
- ログイン成功時にサーバー側でJWT（ユーザーIDを含む）を発行し、**httpOnly・Secure・SameSite=Lax の Cookie**に保存する
- JWTの有効期限は短め（例：2週間）に設定し、期限切れ時は再ログインを求める
- ログアウト時はCookieを削除する
- JWTの署名鍵（`SESSION_SECRET`）は環境変数として Vercel に設定し、コードやリポジトリには含めない

### 3.3 データアクセス制御（RLSの代替）
Supabase Authを使わないため、PostgreSQLの `auth.uid()` によるRLS連携は使えない。そのため、以下の方針でアクセス制御を行う。

- **クライアント（ブラウザ）からSupabaseに直接アクセスさせない。** `anon key` はクライアントに公開しない、もしくは一切使わない
- すべてのデータ操作は **Next.jsのServer Actions / API Routes を経由**し、サーバー側から `service_role key` を使ってSupabaseにアクセスする
- 各Server Action / API Route の冒頭で、Cookie内のJWTを検証してログインユーザーを特定し、**アプリケーションコード側で「本人のデータか」「対象ユーザーが公開設定にしているか」を必ずチェックする**
- Supabase側のRLSは念のため全テーブルで有効化しつつ、「service_role以外からのアクセスを全拒否」するポリシーのみ設定する（多層防御。万が一anon keyが漏れても外部から直接DBを触られないようにする）

> ⚠️ 重要：方式Bでは「アクセス制御をアプリ側で徹底する」ことがセキュリティ上の生命線になる。Server Action / API Route を新規に追加するたびに、認可チェックのコードを必ず入れることをルール化する（チェックリスト化・共通ミドルウェア関数化を推奨）。

---

## 4. 機能要件

### 4.1 ユーザー管理（今回の追加・変更点）
- **新規登録**：ユーザー名、パスワード、（任意で表示名）を入力して登録
  - ユーザー名の重複チェック
  - パスワードは bcrypt でハッシュ化して保存
- **ログイン／ログアウト**：ユーザー名＋パスワードで認証し、JWTセッションを発行
- **ユーザー名変更**：ログイン中に新しいユーザー名へ変更（重複チェックあり、現在のパスワード入力で本人確認）
- **パスワード変更**：現在のパスワードを確認した上で新しいパスワードに変更
- **アカウント削除**：
  - 現在のパスワードを再入力させた上で削除を実行（誤操作防止）
  - 削除確認モーダル（「本当に削除しますか」）を表示
  - ユーザーに紐づく `actions`・`logs` も合わせて削除（DB上は外部キーに `ON DELETE CASCADE` を設定）
  - 削除後はセッションCookieを破棄し、トップページ（未ログイン状態）にリダイレクト
- **プロフィール設定**：表示名の変更、公開設定（ログ公開／残高公開）のON/OFF

### 4.2 項目（アクション）管理
- 「貯める項目」「使う項目」の2種類を作成できる
- 各項目には以下を設定
  - 項目名（例：「早起きした」）
  - 種別：貯める / 使う
  - 金額（円）
  - （任意）アイコンやカテゴリ、メモ
- 項目の編集・削除・一覧表示ができる

### 4.3 実行記録（ログ）
- ユーザーは登録済みの項目一覧から「実行する」を選び、実行日時（デフォルトは現在時刻、任意で過去日を選択可）を記録する
- 実行すると、その項目に紐づく金額が残高に反映される（貯める→加算、使う→減算）
- ログの編集・削除も可能（削除・編集時は残高も再計算する）
- ログには実行日、項目名、種別、金額、（任意メモ）を保持する

### 4.4 表示機能
- **リスト表示**：ログを新しい順に一覧表示。フィルタ（期間、種別、項目名）機能を持たせる
- **カレンダー表示**：月表示カレンダー上に、その日に実行された項目をアイコンや金額付きで表示。日付をクリックすると詳細ログを表示
- **残高表示**：現在の資金残高をダッシュボードに常時表示
- **サマリー**：月間の貯めた合計／使った合計をグラフ等で表示（任意機能）

### 4.5 公開機能
- 他ユーザーの一覧・プロフィールを閲覧できる画面を用意
- 対象ユーザーが公開設定にしている場合のみ、そのユーザーのログ・残高を閲覧できる
- 非公開ユーザーの情報は一切表示しない（Server Action / API Route レベルでも取得不可にする）

---

## 5. データベース設計（Supabase / PostgreSQL）

### 5.1 テーブル定義

#### `users`（自前のユーザーテーブル。Supabase Authの `auth.users` は使わない）
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK, default gen_random_uuid()) | ユーザーID |
| username | text (unique, not null) | ユーザー名（ログインに使用） |
| password_hash | text (not null) | bcryptでハッシュ化したパスワード |
| display_name | text | 表示名 |
| is_log_public | boolean, default false | ログ公開設定 |
| is_balance_public | boolean, default false | 残高公開設定 |
| created_at | timestamptz, default now() | 作成日時 |
| updated_at | timestamptz, default now() | 更新日時（ユーザー名/パスワード変更時に更新） |

#### `login_attempts`（簡易レート制限用・任意）
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | ID |
| username | text | 試行対象のユーザー名 |
| attempted_at | timestamptz, default now() | 試行日時 |
| success | boolean | 成否 |

#### `actions`（ユーザーが作成する項目）
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 項目ID |
| user_id | uuid (FK→users.id, ON DELETE CASCADE) | 作成者 |
| name | text | 項目名 |
| type | text (check: 'save' or 'spend') | 貯める/使う |
| amount | integer | 金額（円、常に正の数で保持） |
| memo | text, nullable | メモ |
| is_active | boolean, default true | 有効/無効（削除の代わりに無効化も可） |
| created_at | timestamptz, default now() | 作成日時 |

#### `logs`（実行記録）
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | ログID |
| user_id | uuid (FK→users.id, ON DELETE CASCADE) | 実行者 |
| action_id | uuid (FK→actions.id, ON DELETE SET NULL) | 対象項目 |
| amount | integer | 実行時点の金額（項目の金額変更に影響されないようスナップショット保持） |
| type | text ('save' or 'spend') | スナップショット |
| memo | text, nullable | メモ |
| executed_at | timestamptz | 実行日時（ユーザーが指定可能） |
| created_at | timestamptz, default now() | レコード作成日時 |

#### 残高の扱い
残高はテーブルに保持せず、`logs`から都度計算（`sum(save) - sum(spend)`）する方式を推奨。

```sql
create view balances as
select
  user_id,
  coalesce(sum(case when type = 'save' then amount else -amount end), 0) as balance
from logs
group by user_id;
```

### 5.2 Row Level Security（RLS）方針（方式B用）

Supabase Authの `auth.uid()` は使えないため、RLSは「アプリケーション層での認可」を補完する**多層防御**として設定する。

```sql
-- 例：全テーブルでRLSを有効化し、service_role以外のアクセスを拒否
alter table users enable row level security;
alter table actions enable row level security;
alter table logs enable row level security;

-- service_role（サーバー側のみ）にはRLSが適用されないため、
-- anon/authenticated ロールに対して明示的な許可ポリシーを一切作らないことで
-- クライアントからの直接アクセスを実質的に封じる
```

- クライアントには `anon key` を渡さない（環境変数 `NEXT_PUBLIC_...` に含めない）
- Supabaseへのアクセスは必ずNext.jsのサーバー側（Server Actions / Route Handlers）から `service_role key` で行う
- `service_role key` は `SUPABASE_SERVICE_ROLE_KEY` としてVercelの環境変数に設定し、絶対にクライアントバンドルに含めない

---

## 6. 認証フローの実装イメージ

### 6.1 新規登録
1. クライアントからユーザー名・パスワードをServer Actionに送信
2. サーバー側で `username` の重複チェック
3. `bcrypt.hash(password, 10)` でハッシュ化
4. `users` テーブルにINSERT
5. JWT発行 → httpOnly Cookieにセット → ログイン状態にする

### 6.2 ログイン
1. ユーザー名・パスワードを受け取る
2. `users` テーブルから該当ユーザーを検索
3. `bcrypt.compare(password, password_hash)` で照合
4. 成功すればJWT発行 → Cookieセット／失敗すれば `login_attempts` に記録しエラーを返す

### 6.3 セッション検証（各Server Action共通処理）
1. Cookieから `session` JWTを取得
2. `jose` で検証・デコードし `userId` を取得
3. 取得できなければ未ログイン扱いでリダイレクト
4. 取得できたら、そのリクエストの認可チェック（自分のデータか、対象が公開設定か）を行う

### 6.4 ユーザー名／パスワード変更
1. 現在のパスワードを再入力させ、`bcrypt.compare` で本人確認
2. 変更後の値をバリデーション（ユーザー名の重複チェック／パスワード強度チェック）
3. `users` テーブルをUPDATE（`updated_at` も更新）

### 6.5 アカウント削除
1. 現在のパスワードを再入力させ、本人確認
2. 確認モーダルで最終確認
3. `users` テーブルからDELETE（`actions`・`logs` はCASCADEで自動削除）
4. セッションCookieを削除し、トップページへリダイレクト

---

## 7. 画面構成（ページ一覧）

| パス | 内容 |
|---|---|
| `/signup` | 新規登録 |
| `/login` | ログイン |
| `/` (ダッシュボード) | 残高表示、直近ログ、クイック実行ボタン |
| `/actions` | 項目一覧・作成・編集・削除 |
| `/logs` | ログ一覧（リスト表示、フィルタ機能） |
| `/calendar` | カレンダー表示 |
| `/settings` | プロフィール・公開設定変更 |
| `/settings/account` | ユーザー名変更・パスワード変更・アカウント削除 |
| `/users` | 公開中の他ユーザー一覧 |
| `/users/[username]` | 他ユーザーの公開ログ・残高閲覧 |

---

## 8. 開発・環境構築手順

1. **GitHubリポジトリ作成**
   - リポジトリを作成し、Next.jsプロジェクトをpush
2. **Supabaseプロジェクト作成**
   - Supabaseダッシュボードで新規プロジェクト作成
   - 上記テーブル（`users`, `login_attempts`, `actions`, `logs`）をSQL Editorまたはマイグレーションで作成
   - RLSを有効化し、クライアントロールへの許可ポリシーは作らない（service_role専用にする）
   - `project URL` と `service_role key` を控える（**service_role keyは厳重に管理し、GitHubにコミットしない**）
3. **Next.jsプロジェクト設定**
   - `@supabase/supabase-js`、`bcryptjs`、`jose` を導入
   - 環境変数（`.env.local`）に以下を設定
     ```
     SUPABASE_URL=xxx
     SUPABASE_SERVICE_ROLE_KEY=xxx
     SESSION_SECRET=xxx（JWT署名用のランダムな長い文字列）
     ```
   - これらは `NEXT_PUBLIC_` プレフィックスを付けず、サーバー専用の環境変数として扱う
4. **Vercel連携**
   - GitHubリポジトリをVercelにインポート
   - Vercel側の環境変数（Production/Preview/Development）にも同じ値を設定
   - mainブランチへのpushで自動デプロイされるよう設定
5. **開発順序（推奨）**
   1. `users`テーブル作成、bcrypt/jose導入
   2. 新規登録・ログイン・ログアウト（セッションCookie発行）
   3. ユーザー名変更・パスワード変更・アカウント削除
   4. 項目（actions）のCRUD
   5. ログ（logs）のCRUD＋残高計算
   6. リスト表示・カレンダー表示
   7. 公開設定・他ユーザー閲覧機能
   8. UI調整・グラフ等の追加機能

---

## 9. セキュリティ上の注意点（方式B特有）

- **service_role keyの漏洩は致命的**（RLSを全回避できる権限のため）。環境変数管理を徹底し、クライアントサイドのコードに絶対含めない
- 全てのDBアクセスをServer Action / Route Handler経由に限定し、**クライアントから直接Supabaseを叩けるコードを書かない**
- パスワードは平文でログ出力しない（エラーログ等にも注意）
- JWTの有効期限切れ・改ざん検知のハンドリングを必ず実装する
- HTTPS通信はVercelが自動対応するため追加設定は不要
- 将来的にユーザー数が増えた場合は、`login_attempts` を使ったレート制限に加え、CAPTCHA導入も検討する

---

## 10. 今後の拡張候補（任意）

- 月間目標金額の設定と達成率表示
- SNS的な「いいね」やコメント機能
- CSVエクスポート
- プッシュ通知（実行忘れリマインダー）
- 項目のカテゴリ分けとカテゴリ別集計
- 二段階認証（TOTP）の追加

---

## 11. 注意事項

- 金額はすべて整数（円単位）で扱い、小数は許容しない
- 項目の金額を後から変更しても、過去ログの金額は変わらない（ログ側にスナップショットを保持するため）
- 公開設定はプロフィール単位（ログ全体・残高全体）で管理し、項目単位・ログ単位の個別公開は初期スコープに含めない
- ユーザー名・パスワードの変更、アカウント削除は必ず「現在のパスワードによる本人確認」を挟む
