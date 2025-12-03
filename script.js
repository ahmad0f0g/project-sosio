/* ------------------------------
   TemuSini - script.js (API-ready)
   ------------------------------ */

/* --- 0. CONFIG --- */
// Set window.API_BASE sebelum memuat script.js di HTML, mis:
// <script>window.API_BASE = "https://your-backend.com/api"</script>
// Jika tidak diset, default ke same-origin /api
const API_BASE = (window.API_BASE && window.API_BASE.replace(/\/+$/,'')) || (location.origin + '/api');

// Local demo data (fallback jika backend mati)
const itemsData = [
    { id: 1, type: 'lost', title: 'Tas Ransel Eiger', category: 'Tas', location: 'Gedung Anwar Musaddad', date: '2024-01-15', img: 'https://placehold.co/400x300/1e40af/white?text=Tas+Hilang', status: 'lost', desc: 'Tas warna biru navy, gantungan kunci anime One Piece.' },
    { id: 2, type: 'found', title: 'iPhone 13 Pro', category: 'Elektronik', location: 'FST Lantai 2', date: '2024-01-20', img: 'https://placehold.co/400x300/333/white?text=iPhone', status: 'unclaimed', finder: 'Rizky (Ilkom)', desc: 'iPhone warna space gray dengan casing bening. Ditemukan di meja.' },
    { id: 3, type: 'found', title: 'Jam Tangan Emas', category: 'Aksesoris', location: "Kantin Ma'had", date: '2024-01-14', img: 'https://placehold.co/400x300/f59e0b/white?text=Jam+Tangan', status: 'pending', finder: 'Budi Santoso', desc: 'Jam tangan vintage tali kulit coklat.' }
];

// State
let currentFilter = 'all';
let currentType = 'all';
let reportTypeVal = 'lost'; // 'lost' or 'found'

// Utility header for language (optional)
const defaultLang = localStorage.getItem('lang') || 'id';
const defaultHeaders = { 'Accept-Language': defaultLang };

/* --- Init --- */
document.addEventListener('DOMContentLoaded', () => {
    navTo('home');
    fetchAndRenderRecent();
});

/* ----------------------
   RENDER + NAVIGATION
   ---------------------- */
function navTo(page) {
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

    if(page === 'home') {
        document.getElementById('home').classList.add('active');
        document.getElementById('nav-home').classList.add('active');
        fetchAndRenderRecent();
    } else if (page === 'lost') {
        document.getElementById('listing').classList.add('active');
        document.getElementById('nav-lost').classList.add('active');
        document.getElementById('listing-title').innerText = 'Barang Hilang (Dicari)';
        currentType = 'lost';
        resetFilterUI();
        fetchAndRenderListing();
    } else if (page === 'found') {
        document.getElementById('listing').classList.add('active');
        document.getElementById('nav-found').classList.add('active');
        document.getElementById('listing-title').innerText = 'Barang Ditemukan';
        currentType = 'found';
        resetFilterUI();
        fetchAndRenderListing();
    } else if (page === 'report') {
        document.getElementById('report').classList.add('active');
    }
    window.scrollTo(0,0);
}

/* --- Render Cards (works for both API results and local demo objects) --- */
function renderCards(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--secondary);">Tidak ada data barang.</p>';
        return;
    }

    items.forEach(item => {
        // support both backend (_id) and local (id)
        const itemId = item._id || item.id;
        const badgeClass = item.type === 'lost' ? 'lost' : (item.status === 'pending' ? 'pending' : 'found');
        const badgeText = item.type === 'lost' ? 'Dicari' : (item.status === 'pending' ? 'Pending' : 'Ditemukan');
        const btnText = item.type === 'lost' ? 'Hubungi Pemilik' : (item.status === 'pending' ? 'Proses...' : 'Klaim Barang');
        const btnAction = item.type === 'found' && item.status !== 'pending' ? `onclick="openClaimModal('${escapeHtml(item.title)}', '${escapeHtml(item.finder || item.finderName || 'Penemu')}', '${itemId}')"` : '';

        const imageUrl = item.img || item.images?.[0]?.url || 'https://placehold.co/400x300/e2e8f0/808080?text=No+Image';

        const card = `
            <div class="card">
                <div class="card-img">
                    <img src="${imageUrl}" alt="${escapeHtml(item.title)}" loading="lazy">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <div class="card-meta"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.location || '')}</div>
                    <div class="card-meta"><i class="fa-regular fa-calendar"></i> ${escapeHtml(item.date || '')}</div>
                    <p class="card-desc">${escapeHtml(item.desc || '')}</p>
                    <div class="card-footer">
                        <button class="btn-outline full-width" ${btnAction} ${item.status === 'pending' ? 'disabled' : ''}>${btnText}</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

/* ----------------------
   FILTER UI + SEARCH
   ---------------------- */
function resetFilterUI() {
    const s = document.getElementById('searchInput');
    if (s) s.value = '';
    currentFilter = 'all';
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(el => el.classList.remove('active'));
    if (pills[0]) pills[0].classList.add('active');
}

function setCategory(cat, element) {
    currentFilter = cat;
    document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    fetchAndRenderListing();
}

function filterItems() {
    // Keberadaan search box di listing page; kita gunakan untuk fetch
    fetchAndRenderListing();
}

/* ----------------------
   NETWORK: Fetch dari backend
   ---------------------- */
async function fetchAndRenderRecent() {
    // Ambil 3 terbaru
    try {
        const res = await fetch(`${API_BASE}/reports?limit=3`, { headers: defaultHeaders });
        if (!res.ok) throw new Error('Network response not ok');
        const json = await res.json();
        // Backend: return array di json.data atau json
        const items = json.data || json;
        renderCards(items, 'recent-items-grid');
    } catch (err) {
        // fallback ke local
        console.warn('fetchRecent failed, using local data', err);
        renderCards(itemsData.slice(0,3), 'recent-items-grid');
    }
}

async function fetchAndRenderListing() {
    // Compose query params
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const params = new URLSearchParams();
    if (currentType && currentType !== 'all') params.append('type', currentType);
    if (currentFilter && currentFilter !== 'all') params.append('category', currentFilter);
    if (searchTerm) params.append('search', searchTerm);

    try {
        const res = await fetch(`${API_BASE}/reports?${params.toString()}`, { headers: defaultHeaders });
        if (!res.ok) throw new Error('Network response not ok');
        const json = await res.json();
        const items = json.data || json;
        renderCards(items, 'listing-grid');
    } catch (err) {
        console.warn('fetchListing failed, using local filter', err);
        // fallback: filter local itemsData
        const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const filtered = itemsData.filter(item => {
            const matchType = currentType === 'all' ? true : item.type === currentType;
            const matchCat = currentFilter === 'all' ? true : item.category === currentFilter;
            const matchSearch = item.title.toLowerCase().includes(search) || item.location.toLowerCase().includes(search);
            return matchType && matchCat && matchSearch;
        });
        renderCards(filtered, 'listing-grid');
    }
}

/* ----------------------
   FORM: Create Report (uses FormData, uploads file to backend)
   ---------------------- */
async function handleReportSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('input-title').value.trim();
    const category = document.getElementById('input-category').value;
    const date = document.getElementById('input-date').value;
    const location = document.getElementById('input-location').value.trim();
    const desc = document.getElementById('input-desc').value.trim();
    const imageInput = document.getElementById('input-image');
    const file = imageInput && imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;

    // Simple validation
    if (!title || !location || !date) {
        alert('Mohon isi semua field wajib (Nama, Lokasi, Tanggal).');
        return;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('date', date);
    formData.append('location', location);
    formData.append('description', desc);
    formData.append('type', reportTypeVal); // backend expects "category" or "type" depending on impl

    // Backend in file routes expects images[] (upload.array("images",3))
    if (file) {
        formData.append('images', file); // name 'images' to match backend middleware
    }

    try {
        const res = await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: {
                // NOTE: do NOT set Content-Type when sending FormData; browser sets boundary
                'Accept-Language': defaultLang
            },
            body: formData
        });

        if (res.ok) {
            const json = await res.json();
            alert(json.message || 'Laporan berhasil dibuat.');
            document.querySelector('#report form').reset();
            // go to appropriate page
            navTo(reportTypeVal === 'lost' ? 'lost' : 'found');
            // refresh listing
            fetchAndRenderListing();
        } else {
            const err = await res.json().catch(()=>({ message: 'Unknown error' }));
            alert('Gagal mengirim laporan: ' + (err.message || res.statusText));
        }
    } catch (err) {
        console.error('submit report error', err);
        alert('Gagal mengirim laporan (network). Data disimpan sementara di local demo.');
        // fallback: keep in local array
        const fallbackItem = {
            id: Date.now(),
            type: reportTypeVal,
            title, category, date, location, img: file ? URL.createObjectURL(file) : 'https://placehold.co/400x300/e2e8f0/808080?text=No+Image',
            status: reportTypeVal === 'lost' ? 'lost' : 'unclaimed',
            desc, finder: reportTypeVal === 'found' ? 'Anda (User)' : '-'
        };
        itemsData.unshift(fallbackItem);
        document.querySelector('#report form').reset();
        navTo(reportTypeVal === 'lost' ? 'lost' : 'found');
        renderCards(itemsData, 'listing-grid');
    }
}

/* ----------------------
   CLAIM modal + submit
   ---------------------- */
let currentClaimingId = null;

function openClaimModal(itemName, finderName, itemId) {
    currentClaimingId = itemId;
    document.getElementById('claimModal').classList.add('show');
    document.getElementById('modal-item-name').innerText = itemName;
    document.getElementById('modal-finder').innerText = finderName || 'Penemu';
}

function closeModal() {
    currentClaimingId = null;
    document.getElementById('claimModal').classList.remove('show');
}

window.onclick = function(event) {
    if (event.target === document.getElementById('claimModal')) closeModal();
}

async function handleClaimSubmit(e) {
    e.preventDefault();
    // Grab fields inside modal (first two inputs)
    const modal = document.getElementById('claimModal');
    const inputs = modal.querySelectorAll('input, textarea');
    const name = (inputs[0]?.value || '').trim();
    const proof = (inputs[1]?.value || '').trim();

    if (!name || !proof) {
        alert('Mohon isi nama dan bukti kepemilikan.');
        return;
    }

    if (!currentClaimingId) {
        alert('Item ID tidak ditemukan.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/claims`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...defaultHeaders
            },
            body: JSON.stringify({
                reportId: currentClaimingId,
                name,
                phone: '', // optional — you can add input
                reason: proof
            })
        });

        if (res.ok) {
            const json = await res.json();
            alert(json.message || 'Klaim berhasil dikirim.');
            closeModal();
            // optional: refresh claims list or item status
            fetchAndRenderListing();
        } else {
            const err = await res.json().catch(()=>({message: res.statusText}));
            alert('Gagal mengirim klaim: ' + (err.message || res.statusText));
        }
    } catch (err) {
        console.error('claim submit error', err);
        alert('Gagal kirim klaim (network). Silakan coba lagi.');
    }
}

/* ----------------------
   HELPERS
   ---------------------- */
function toggleReportType(type) {
    reportTypeVal = type;
    document.getElementById('btn-lost').classList.toggle('active', type === 'lost');
    document.getElementById('btn-found').classList.toggle('active', type === 'found');
}

function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'", '&#39;');
}

/* ----------------------
   Attach global handlers that HTML expects
   (keperluan form onsubmit dll) - keep names
   ---------------------- */
window.navTo = navTo;
window.toggleReportType = toggleReportType;
window.handleReportSubmit = handleReportSubmit;
window.openClaimModal = openClaimModal;
window.closeModal = closeModal;
window.handleClaimSubmit = handleClaimSubmit;
window.setCategory = setCategory;
window.filterItems = filterItems;
