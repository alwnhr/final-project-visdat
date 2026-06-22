# Dashboard Kemiskinan Indonesia 2007–2025

> Visualisasi interaktif persentase penduduk miskin (P0) Indonesia berdasarkan data resmi BPS dari tahun 2007 sampai 2025.

🌐 **Demo:** https://presentase-kemiskinan-indonesia.vercel.app

---

## Isi Dashboard

- **Chart 1 — Line Chart Tren 18 Tahun:** Tren kemiskinan nasional 2007–2025 (Total, Perkotaan, Perdesaan)
- **Chart 2 — Bar Chart:** Persentase kemiskinan per provinsi (Top 10 / Semua / Bottom 10), warna otomatis menunjukkan di atas/bawah rata-rata nasional
- **Chart 3 — Scatter Plot:** Hubungan antara kemiskinan perkotaan vs perdesaan tiap provinsi
- **Chart 4 — Doughnut Chart:** Distribusi proporsi provinsi berdasarkan kategori tingkat kemiskinan
- **4 KPI Cards** dengan animasi count-up
- **Fitur interaktif:** 4 filter dropdown (Tahun / Periode / Wilayah / Tampilan), tooltip semua chart, toggle legend
- **Animasi:** Entrance Chart.js, count-up KPI, CSS fade-in card
- **Smart fallback:** Otomatis memilih periode terbaik kalau data tidak tersedia (mis. 2007–2011 hanya punya data tahunan)

---

## Sumber Data

- **Nama dataset:** Persentase Penduduk Miskin (P0) Menurut Provinsi dan Daerah
- **URL sumber:** https://www.bps.go.id/id/statistics-table/2/MTkyIzI=/persentase-penduduk-miskin--september-2025.html
- **Penerbit:** Badan Pusat Statistik (BPS) — Statistics Indonesia
- **Periode:** 2007–2025 (19 tahun)
- **Cakupan:** 38 Provinsi Indonesia
- **Satuan:** Persen (%)
- **Catatan struktur data:**
  - 2007–2011: hanya data tahunan
  - 2012–2022, 2024–2025: tersedia data Maret & September
  - 2023: hanya data Maret

---

## Cara Jalankan di Lokal

Buka `index.html` langsung di browser, atau gunakan **Live Server** di VS Code (klik kanan `index.html` → Open with Live Server).

Tidak memerlukan instalasi apapun — semua dependensi dimuat dari CDN.

---

## Teknologi

- **Chart.js v4.4.0** — visualisasi data interaktif (CDN)
- **HTML5 + CSS3 + Vanilla JavaScript** — frontend static
- **Vercel** — deployment platform

---

## Struktur Folder

```
Tubes Visdat/
├── index.html   ← halaman utama
├── style.css    ← desain clean fintech
├── app.js       ← logika chart & interaktivitas
├── data.js      ← data BPS 2007–2025 (dari CSV resmi)
└── README.md    ← dokumentasi
```

---

## Anggota Kelompok
- Mazmur Bryan Dimu Heo (103012300001)
- Muhammad Alwan Hutama Rabbani (103012300189)
- M Naufal Ramadhan (103012300266)
- Rafif Baltirus Budiman (1301204443)
