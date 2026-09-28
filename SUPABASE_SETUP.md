# Supabase cloud storage

Orbit memakai Supabase Free untuk menyimpan tugas dan jadwal lintas perangkat.

## 1. Buat project gratis

1. Buka https://supabase.com dan buat project baru.
2. Buka **SQL Editor**.
3. Salin seluruh isi `supabase-schema.sql`, lalu klik **Run**.

## 2. Aktifkan login Discord

1. Di Supabase buka **Authentication > Providers > Discord**.
2. Aktifkan provider Discord.
3. Di Discord Developer Portal, tambahkan callback URL berikut:

`https://<PROJECT-REF>.supabase.co/auth/v1/callback`

4. Salin Discord Client ID dan Client Secret ke pengaturan provider Discord di Supabase.
5. Di **Authentication > URL Configuration**, tambahkan URL GitHub Pages, misalnya:

`https://<USERNAME>.github.io/<REPOSITORY>/`

## 3. Isi konfigurasi aplikasi

Buka `config.js` dan isi nilai dari **Project Settings > API**:

```javascript
const SUPABASE_CONFIG = {
    URL: 'https://<PROJECT-REF>.supabase.co',
    ANON_KEY: '<SUPABASE-ANON-KEY>',
    ENABLED: true
};
```

`ANON_KEY` boleh dipakai di frontend. Jangan pernah memasukkan `service_role` key ke file ini.

## 4. Deploy

Commit dan push `config.js`, `supabase-schema.sql`, serta file aplikasi ke GitHub. Setelah GitHub Pages selesai build, login dengan Discord akan memakai Supabase Auth dan data akan tersinkron lintas browser/perangkat.

Akun demo tetap menggunakan localStorage dan tidak masuk ke database cloud.
