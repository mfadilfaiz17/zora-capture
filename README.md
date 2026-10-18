# ZORA CAPTURE

ZORA CAPTURE adalah web photobooth dengan tema web 8-bit. Pengguna dapat memilih empat atau enam foto, memilih timer, mengambil gambar, meninjau dan mengulang foto tertentu, memilih frame, lalu mengunduh collage akhir.

## Fitur

- Tema visual pixel/arcade yang responsif untuk desktop dan mobile.
- Landing page dengan panel Home, FAQ, Privacy Policy, dan Contact.
- Music picker dengan tiga pilihan lagu.
- Mode pengambilan empat dan enam foto.
- Countdown 3, 5, dan 10 detik.
- Halaman review dengan retake satu foto atau semua foto.
- Pemilihan frame bawaan dan upload frame custom.
- Mode kamera browser untuk Netlify/HTTPS.
- Mode kamera Flask/OpenCV untuk penggunaan lokal.

## Teknologi

- HTML5
- CSS3 Flexbox/Grid dan media query responsif
- Vanilla JavaScript
- Flask 3
- OpenCV
- Pillow
- NumPy
- Google Fonts: `Press Start 2P`

## Struktur proyek

```text
.
├── index.html
├── DESIGN_SYSTEM.md
├── ARCHITECTURE.md
├── TODO.md
└── diy_photoboth/
    ├── app.py
    ├── requirements.txt
    ├── frames/
    │   ├── frames.json
    │   └── *.png
    └── static/
        ├── style.css
        ├── script.js
        ├── music/
        │   └── *.mp3
        └── results/
```

## Menjalankan secara lokal dengan Flask dan OpenCV

Backend lokal diperlukan untuk mode kamera Python/OpenCV.

### Windows PowerShell

```powershell
cd "D:\faiz\Web Photoboth Zora\diy_photoboth"
py -m venv photobooth_env
.\photobooth_env\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Buka alamat berikut:

```text
http://127.0.0.1:5000
```

Jika PowerShell memblokir aktivasi environment, jalankan executable Python secara langsung:

```powershell
.\photobooth_env\Scripts\python.exe app.py
```

Pada Windows, aplikasi menggunakan backend OpenCV DirectShow jika tersedia. Tutup aplikasi lain yang sedang menggunakan kamera.

## Menjalankan static site secara lokal

Membuka `index.html` langsung melalui `file://` tidak sama dengan menjalankan Flask dan dapat menyebabkan API kamera atau path asset tidak berjalan.

Frontend saat ini menganggap `localhost`, `127.0.0.1`, dan `::1` sebagai mode Flask/OpenCV. Karena itu, static server biasa di localhost tetap mengharapkan endpoint Flask. Untuk menguji mode kamera browser saja, gunakan URL Netlify HTTPS atau ubah aturan runtime mode di `script.js` sebagai konfigurasi development yang disengaja.

## Deploy ke Netlify

Netlify harus menyajikan frontend static. Netlify tidak menjalankan proses Flask/OpenCV dan tidak dapat mengakses kamera komputer pribadi yang terhubung ke server lain.

### Melalui Netlify UI

1. Push atau upload repository ke GitHub, GitLab, atau Bitbucket.
2. Di Netlify, pilih **Add new site** lalu import repository.
3. Atur base directory ke root repository.
4. Kosongkan build command.
5. Atur publish directory ke `.` atau root repository.
6. Jalankan deploy.
7. Buka URL hasil deploy melalui HTTPS.
8. Izinkan akses kamera saat masuk ke photobooth.

File berikut wajib ada dalam deployment:

- `index.html`
- `diy_photoboth/static/style.css`
- `diy_photoboth/static/script.js`
- `diy_photoboth/frames/frames.json`
- seluruh file dalam `diy_photoboth/frames/`
- seluruh file dalam `diy_photoboth/static/music/`

Jangan mengatur Netlify untuk menjalankan `python app.py`; mode tersebut hanya untuk Flask/OpenCV lokal.

## Alur pemilihan frame

Setelah review selesai dan collage dibuat:

1. Panel `CHOOSE FRAME` selalu terlihat setelah collage dibuat.
2. Pada desktop, hasil collage berada di kiri dan panel frame berada di kanan.
3. Pada mobile, panel frame otomatis berada di bawah hasil collage.
4. Pilih frame bawaan untuk langsung menerapkannya.
5. Untuk frame sendiri, pilih `UPLOAD CUSTOM FRAME`, lalu tekan `APPLY CUSTOM FRAME`.

Frame bawaan yang tampil disesuaikan dengan mode empat atau enam foto. Frame custom diproses secara lokal di browser dan tidak dikirim ke server.

## Frame dan musik

Ukuran frame berdasarkan mode:

- Empat foto: `1280x960`
- Enam foto: `1280x1440`

Untuk Netlify, daftarkan setiap frame di `diy_photoboth/frames/frames.json`. Untuk Flask lokal, frame difilter berdasarkan dimensinya.

File musik saat ini:

```text
diy_photoboth/static/music/Otherside.mp3
diy_photoboth/static/music/Thief Theme.mp3
diy_photoboth/static/music/Ward.mp3
```

Nama file dan nama yang tampil diatur dalam `diy_photoboth/static/script.js`.

## Catatan browser dan privasi

- Mode browser membutuhkan HTTPS atau localhost serta izin kamera.
- Pada mode browser, foto dikomposisi di browser dan tidak dikirim ke Flask.
- Pada mode Flask lokal, frame kamera dikirim ke proses Python lokal.
- Backend lokal saat ini menyimpan capture sementara di memory proses.
- Hasil lokal ditulis ke `diy_photoboth/static/results/` dan di-ignore oleh Git.

## Checklist verifikasi

Sebelum mempublikasikan perubahan:

1. Jalankan `node --check diy_photoboth/static/script.js`.
2. Jalankan `git diff --check`.
3. Jalankan Flask dan uji alur OpenCV dengan 4 dan 6 foto.
4. Uji Netlify melalui HTTPS dengan izin kamera browser.
5. Uji retake satu foto dan `RETAKE ALL`.
6. Uji music picker dan `MUSIC OFF`.
7. Uji layout pada desktop dan layar mobile yang sempit.