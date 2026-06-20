// ============================================================
// app.js — Dashboard Kemiskinan Indonesia 2007–2025
// ============================================================

const state = {
  year:     '2025',
  periode:  'sept',
  wilayah:  'total',
  tampil:   '10',
};

// ============================================================
// HELPERS
// ============================================================

function getAvailableYears() {
  return Object.keys(dataByYear).sort((a, b) => parseInt(b) - parseInt(a));
}

function isAllYear() {
  return state.year === 'all';
}

// Cek apakah data tersedia untuk satu tahun + periode + wilayah
function isDataAvailableFor(year) {
  const nas = dataByYear[year]?.nasional;
  if (!nas) return false;
  const v = nas[`${state.wilayah}_${state.periode}`];
  return v !== null && v !== undefined;
}

function isDataAvailable() {
  if (isAllYear()) {
    // Tersedia kalau minimal 1 tahun punya data
    return getAvailableYears().some(y => isDataAvailableFor(y));
  }
  return isDataAvailableFor(state.year);
}

// Ambil nilai dari row sesuai state
function getNilai(row) {
  const v = row[`${state.wilayah}_${state.periode}`];
  return (v === undefined || v === null) ? null : v;
}

// Rata-rata provinsi lintas semua tahun yang punya data
function getDataAllYears() {
  const years = getAvailableYears().filter(y => isDataAvailableFor(y));
  if (years.length === 0) return [];

  // Kumpulkan semua nama provinsi unik
  const provinsiSet = new Set();
  years.forEach(y => {
    (dataByYear[y]?.provinsi || []).forEach(d => provinsiSet.add(d.provinsi));
  });

  // Rata-rata per provinsi dari tahun yang tersedia
  return Array.from(provinsiSet).map(provinsi => {
    const values = years
      .map(y => (dataByYear[y]?.provinsi || []).find(d => d.provinsi === provinsi))
      .filter(d => d && getNilai(d) !== null)
      .map(d => getNilai(d));

    if (values.length === 0) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { provinsi, _value: parseFloat(avg.toFixed(2)), _years: values.length };
  }).filter(d => d !== null);
}

// Ambil SEMUA provinsi (tidak terfilter dropdown "tampil")
// Dipakai untuk KPI & Doughnut yang harus hitung semua 38 provinsi
function getAllProvinsiData() {
  if (isAllYear()) {
    return getDataAllYears().map(d => ({ ...d, [`${state.wilayah}_${state.periode}`]: d._value }));
  }
  const prov = dataByYear[state.year]?.provinsi || [];
  return prov.filter(d => getNilai(d) !== null);
}

// Ambil data provinsi sesuai state (satu tahun atau semua tahun)
function getDataFiltered() {
  let data = getAllProvinsiData();
  data.sort((a, b) => getNilai(b) - getNilai(a));
  if (state.tampil === '10')       return data.slice(0, 10);
  if (state.tampil === 'bottom10') return data.slice(-10).reverse();
  return data;
}

function getNilaiNasional() {
  if (isAllYear()) {
    const years = getAvailableYears().filter(y => isDataAvailableFor(y));
    if (years.length === 0) return null;
    const values = years
      .map(y => dataByYear[y]?.nasional?.[`${state.wilayah}_${state.periode}`])
      .filter(v => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
  }
  const nas = dataByYear[state.year]?.nasional;
  if (!nas) return null;
  return getNilai(nas);
}

function getBarColor(nilai, alpha = 0.85) {
  const avg = getNilaiNasional();
  if (avg === null) return `rgba(93,194,181,${alpha})`;
  if (nilai > avg * 1.5) return `rgba(239,118,118,${alpha})`;
  if (nilai > avg)       return `rgba(242,201,76,${alpha})`;
  return `rgba(93,194,181,${alpha})`;
}

function labelPeriode() {
  if (state.periode === 'sept')    return 'September';
  if (state.periode === 'maret')   return 'Maret';
  if (state.periode === 'tahunan') return 'Tahunan';
  return '-';
}

function labelWilayah() {
  if (state.wilayah === 'total') return 'Kota+Desa';
  if (state.wilayah === 'kota')  return 'Perkotaan';
  return 'Perdesaan';
}

function labelYear() {
  return isAllYear() ? 'Semua Tahun (2007–2025)' : state.year;
}

function titleCase(str) {
  return str.toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Dki/g, 'DKI')
    .replace(/Di\b/g, 'DI');
}

// ============================================================
// DROPDOWN TAHUN
// ============================================================
function populateYearDropdown() {
  const sel = document.getElementById('filter-year');
  const years = getAvailableYears();
  sel.innerHTML =
    years.map(y => `<option value="${y}" ${y === state.year ? 'selected' : ''}>${y}</option>`).join('') +
    `<option value="all">📊 Semua Tahun (Rata-rata)</option>`;
}

// ============================================================
// FILTER INFO BANNER
// ============================================================
function renderFilterInfo() {
  const info = document.getElementById('filter-info');

  if (isAllYear()) {
    const availYears = getAvailableYears().filter(y => isDataAvailableFor(y));
    const skipYears  = getAvailableYears().filter(y => !isDataAvailableFor(y));

    if (skipYears.length > 0) {
      info.innerHTML = `ⓘ Rata-rata dari <strong>${availYears.length} tahun</strong> yang punya data ${labelPeriode()}. 
        Tahun tanpa data dilewati: <strong>${skipYears.join(', ')}</strong>`;
    } else {
      info.innerHTML = `ⓘ Rata-rata dari semua <strong>${availYears.length} tahun</strong> (${labelPeriode()})`;
    }
    info.style.display = 'block';
    return;
  }

  if (!isDataAvailable()) {
    info.textContent = `⚠ Data ${labelPeriode()} ${state.year} (${labelWilayah()}) tidak tersedia`;
    info.style.display = 'block';
  } else {
    info.textContent = '';
    info.style.display = 'none';
  }
}

// ============================================================
// NO DATA OVERLAY
// ============================================================
function showNoData(canvasId, message) {
  const canvas  = document.getElementById(canvasId);
  const wrapper = canvas.parentElement;
  const old = wrapper.querySelector('.no-data-overlay');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.className = 'no-data-overlay';
  overlay.innerHTML = `<div class="no-data-icon">📭</div><div class="no-data-text">${message}</div>`;
  wrapper.appendChild(overlay);
  canvas.style.opacity = '0.1';
}

function clearNoData(canvasId) {
  const canvas  = document.getElementById(canvasId);
  const wrapper = canvas.parentElement;
  const old = wrapper.querySelector('.no-data-overlay');
  if (old) old.remove();
  canvas.style.opacity = '1';
}

// ============================================================
// KPI CARDS
// ============================================================
function countUp(el, target, suffix = '', duration = 1000, decimals = 2) {
  if (target === null || isNaN(target)) { el.textContent = 'N/A'; return; }
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = (decimals === 0 ? Math.round(target * eased) : (target * eased).toFixed(decimals)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderKPI() {
  document.getElementById('kpi-nasional-label').textContent =
    isAllYear() ? 'Rata-rata Nasional (Semua Tahun)' : `Rata-rata Nasional ${state.year}`;
  document.getElementById('kpi-nasional-sub').textContent =
    `${labelWilayah()} · ${labelPeriode()}`;

  if (!isDataAvailable()) {
    ['kpi-nasional','kpi-tertinggi','kpi-terendah','kpi-diatas'].forEach(id => {
      document.getElementById(id).textContent = 'N/A';
    });
    document.getElementById('kpi-tertinggi-nama').textContent = '—';
    document.getElementById('kpi-terendah-nama').textContent  = '—';
    return;
  }

  const avg  = getNilaiNasional();
  const data = getAllProvinsiData();
  if (data.length === 0) return;

  const sorted    = [...data].sort((a, b) => getNilai(b) - getNilai(a));
  const tertinggi = sorted[0];
  const terendah  = sorted[sorted.length - 1];
  const diAtas    = data.filter(d => getNilai(d) > avg).length;

  countUp(document.getElementById('kpi-nasional'),  avg, '%');
  countUp(document.getElementById('kpi-tertinggi'), getNilai(tertinggi), '%');
  countUp(document.getElementById('kpi-terendah'),  getNilai(terendah), '%');
  countUp(document.getElementById('kpi-diatas'),    diAtas, '', 800, 0);

  document.getElementById('kpi-tertinggi-nama').textContent = titleCase(tertinggi.provinsi);
  document.getElementById('kpi-terendah-nama').textContent  = titleCase(terendah.provinsi);
}

// ============================================================
// CHART 1 — TREN NASIONAL (selalu semua tahun, render sekali)
// ============================================================
let chartTrend = null;

function renderTrendChart() {
  const years = getAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));

  function bestValue(year, wilayah) {
    const nas = dataByYear[year]?.nasional;
    if (!nas) return null;
    if (nas[`${wilayah}_sept`]    != null) return nas[`${wilayah}_sept`];
    if (nas[`${wilayah}_maret`]   != null) return nas[`${wilayah}_maret`];
    if (nas[`${wilayah}_tahunan`] != null) return nas[`${wilayah}_tahunan`];
    return null;
  }

  const config = {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        { label: 'Kota + Desa (Total)', data: years.map(y => bestValue(y, 'total')), borderColor: '#1E2A3A', backgroundColor: 'rgba(30,42,58,0.05)', pointBackgroundColor: '#1E2A3A', pointRadius: 4, pointHoverRadius: 7, borderWidth: 3, tension: 0.3, fill: false },
        { label: 'Perkotaan', data: years.map(y => bestValue(y, 'kota')), borderColor: '#6BA8E5', backgroundColor: 'rgba(107,168,229,0.10)', pointBackgroundColor: '#6BA8E5', pointRadius: 3, pointHoverRadius: 6, borderWidth: 2.5, tension: 0.3, fill: false },
        { label: 'Perdesaan', data: years.map(y => bestValue(y, 'desa')), borderColor: '#EF7676', backgroundColor: 'rgba(239,118,118,0.10)', pointBackgroundColor: '#EF7676', pointRadius: 3, pointHoverRadius: 6, borderWidth: 2.5, tension: 0.3, fill: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 1000 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', align: 'end', labels: { font: { size: 12, weight: '600' }, padding: 16, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: {
          backgroundColor: 'rgba(30,42,58,0.95)', padding: 12,
          titleFont: { size: 13, weight: '700' }, bodyFont: { size: 12 },
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(2) + '%' : 'N/A'}` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#8696AA' } },
        y: { beginAtZero: true, ticks: { callback: v => v + '%', font: { size: 11 }, color: '#8696AA' }, grid: { color: 'rgba(229,236,244,0.8)' } },
      },
    },
  };

  if (chartTrend) chartTrend.destroy();
  chartTrend = new Chart(document.getElementById('chartTrend'), config);
}

// ============================================================
// CHART 2 — BAR CHART
// ============================================================
let chartBar = null;

function renderBarChart() {
  const yearLabel = isAllYear() ? 'Rata-rata Semua Tahun' : state.year;
  document.getElementById('bar-title').textContent =
    `📊 Kemiskinan per Provinsi — ${yearLabel} (${labelWilayah()}, ${labelPeriode()})`;

  if (!isDataAvailable()) {
    if (chartBar) { chartBar.destroy(); chartBar = null; }
    showNoData('chartBar', `Data ${labelPeriode()} ${isAllYear() ? 'tidak tersedia untuk semua tahun' : state.year + ' tidak tersedia'}`);
    return;
  }
  clearNoData('chartBar');

  const data   = getDataFiltered();
  const labels = data.map(d => titleCase(d.provinsi));
  const values = data.map(d => getNilai(d));
  const colors = values.map(v => getBarColor(v));
  const avg    = getNilaiNasional();

  const config = {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Persentase Kemiskinan', data: values, backgroundColor: colors, borderColor: colors.map(c => c.replace('0.85','1')), borderWidth: 0, borderRadius: 8, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30,42,58,0.95)', padding: 12,
          titleFont: { size: 13, weight: '700' }, bodyFont: { size: 12 },
          callbacks: {
            label: ctx => ` ${ctx.parsed.y.toFixed(2)}%`,
            afterLabel: ctx => {
              if (avg === null) return '';
              const diff = (ctx.parsed.y - avg).toFixed(2);
              return ` ${diff >= 0 ? '+' : ''}${diff}% dari nasional (${avg.toFixed(2)}%)`;
            },
          },
        },
      },
      scales: {
        x: { ticks: { font: { size: 11 }, color: '#4A5A6E', maxRotation: 45, minRotation: 30 }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: v => v + '%', font: { size: 11 }, color: '#8696AA' }, grid: { color: 'rgba(229,236,244,0.8)' } },
      },
    },
  };

  if (chartBar) chartBar.destroy();
  chartBar = new Chart(document.getElementById('chartBar'), config);
}

// ============================================================
// CHART 3 — SCATTER
// ============================================================
let chartScatter = null;

function renderScatterChart() {
  const yearLabel = isAllYear() ? 'Rata-rata Semua Tahun' : state.year;
  document.getElementById('scatter-title').textContent =
    `🔵 Kota vs Desa — ${yearLabel} (${labelPeriode()})`;

  let rawData;
  if (isAllYear()) {
    const years = getAvailableYears().filter(y => isDataAvailableFor(y));
    const provinsiSet = new Set();
    years.forEach(y => (dataByYear[y]?.provinsi || []).forEach(d => provinsiSet.add(d.provinsi)));

    rawData = Array.from(provinsiSet).map(provinsi => {
      const kotaVals = [], desaVals = [];
      years.forEach(y => {
        const d = (dataByYear[y]?.provinsi || []).find(p => p.provinsi === provinsi);
        if (d) {
          const k = d[`kota_${state.periode}`]; const ds = d[`desa_${state.periode}`];
          if (k != null) kotaVals.push(k);
          if (ds != null) desaVals.push(ds);
        }
      });
      if (!kotaVals.length || !desaVals.length) return null;
      return {
        x: parseFloat((kotaVals.reduce((a,b)=>a+b,0)/kotaVals.length).toFixed(2)),
        y: parseFloat((desaVals.reduce((a,b)=>a+b,0)/desaVals.length).toFixed(2)),
        label: titleCase(provinsi),
      };
    }).filter(d => d !== null);
  } else {
    const prov = dataByYear[state.year]?.provinsi || [];
    rawData = prov.filter(d => d[`kota_${state.periode}`] != null && d[`desa_${state.periode}`] != null)
      .map(d => ({ x: d[`kota_${state.periode}`], y: d[`desa_${state.periode}`], label: titleCase(d.provinsi) }));
  }

  if (rawData.length === 0) {
    if (chartScatter) { chartScatter.destroy(); chartScatter = null; }
    showNoData('chartScatter', `Data ${labelPeriode()} ${isAllYear() ? 'tidak tersedia' : state.year + ' tidak tersedia'}`);
    return;
  }
  clearNoData('chartScatter');

  const avg = getNilaiNasional() ?? 10;

  const config = {
    type: 'scatter',
    data: {
      datasets: [{
        data: rawData.map(d => ({ x: d.x, y: d.y })),
        backgroundColor: rawData.map(d => d.x > avg && d.y > avg ? 'rgba(239,118,118,0.75)' : d.x < avg && d.y < avg ? 'rgba(93,194,181,0.75)' : 'rgba(107,168,229,0.75)'),
        borderColor: rawData.map(d => d.x > avg && d.y > avg ? '#EF7676' : d.x < avg && d.y < avg ? '#3FA89A' : '#6BA8E5'),
        borderWidth: 2, pointRadius: 7, pointHoverRadius: 11,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 800 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30,42,58,0.95)', padding: 12,
          callbacks: { label: ctx => { const d = rawData[ctx.dataIndex]; return [` ${d.label}`, ` Kota: ${d.x}%`, ` Desa: ${d.y}%`]; } },
        },
      },
      scales: {
        x: { title: { display: true, text: 'Kemiskinan Perkotaan (%)', font: { size: 11, weight: '600' }, color: '#4A5A6E' }, ticks: { callback: v => v + '%', color: '#8696AA' }, grid: { color: 'rgba(229,236,244,0.8)' } },
        y: { title: { display: true, text: 'Kemiskinan Perdesaan (%)', font: { size: 11, weight: '600' }, color: '#4A5A6E' }, ticks: { callback: v => v + '%', color: '#8696AA' }, grid: { color: 'rgba(229,236,244,0.8)' } },
      },
    },
  };

  if (chartScatter) chartScatter.destroy();
  chartScatter = new Chart(document.getElementById('chartScatter'), config);
}

// ============================================================
// CHART 4 — DOUGHNUT
// ============================================================
let chartDoughnut = null;

function renderDoughnutChart() {
  const yearLabel = isAllYear() ? 'Rata-rata Semua Tahun' : state.year;
  document.getElementById('doughnut-title').textContent =
    `🍩 Distribusi Kategori — ${yearLabel} (${labelWilayah()}, ${labelPeriode()})`;

  if (!isDataAvailable()) {
    if (chartDoughnut) { chartDoughnut.destroy(); chartDoughnut = null; }
    showNoData('chartDoughnut', `Data ${labelPeriode()} ${isAllYear() ? 'tidak tersedia' : state.year + ' tidak tersedia'}`);
    return;
  }
  clearNoData('chartDoughnut');

  const data = getAllProvinsiData();
  const kategori = {
    'Rendah (< 5%)':         { count: 0, color: '#5DC2B5' },
    'Sedang (5–10%)':        { count: 0, color: '#6BA8E5' },
    'Tinggi (10–20%)':       { count: 0, color: '#F2C94C' },
    'Sangat Tinggi (> 20%)': { count: 0, color: '#EF7676' },
  };

  data.forEach(d => {
    const v = getNilai(d);
    if (v === null) return;
    if (v < 5)       kategori['Rendah (< 5%)'].count++;
    else if (v < 10) kategori['Sedang (5–10%)'].count++;
    else if (v < 20) kategori['Tinggi (10–20%)'].count++;
    else             kategori['Sangat Tinggi (> 20%)'].count++;
  });

  const labels = Object.keys(kategori);
  const values = Object.values(kategori).map(k => k.count);
  const colors = Object.values(kategori).map(k => k.color);

  const config = {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 3, borderColor: '#fff', hoverOffset: 12 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900, animateRotate: true },
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11, weight: '500' }, padding: 14, usePointStyle: true, pointStyle: 'circle', color: '#4A5A6E' } },
        tooltip: {
          backgroundColor: 'rgba(30,42,58,0.95)', padding: 12,
          callbacks: { label: ctx => { const total = values.reduce((a,b)=>a+b,0); const pct = total > 0 ? ((ctx.parsed/total)*100).toFixed(1) : 0; return ` ${ctx.parsed} provinsi (${pct}%)`; } },
        },
      },
    },
  };

  if (chartDoughnut) chartDoughnut.destroy();
  chartDoughnut = new Chart(document.getElementById('chartDoughnut'), config);
}

// ============================================================
// MASTER RENDER & EVENTS
// ============================================================
function renderAll() {
  renderFilterInfo();
  renderKPI();
  renderBarChart();
  renderScatterChart();
  renderDoughnutChart();
}

function bindEvents() {
  document.getElementById('filter-year').addEventListener('change', e => { state.year = e.target.value; renderAll(); });
  document.getElementById('filter-periode').addEventListener('change', e => { state.periode = e.target.value; renderAll(); });
  document.getElementById('filter-wilayah').addEventListener('change', e => { state.wilayah = e.target.value; renderAll(); });
  document.getElementById('filter-tampil').addEventListener('change', e => { state.tampil = e.target.value; renderBarChart(); });
}

(function init() {
  if (typeof dataByYear === 'undefined') { console.error('data.js belum dimuat'); return; }
  populateYearDropdown();
  bindEvents();
  renderTrendChart();
  renderAll();
})();
