/* ------------------------------
   TemuSini - script.js (API-ready - MODIFIKASI: HANYA FOUND/DITEMUKAN)
   ------------------------------ */

/* --- 0. CONFIG --- */
// Set window.API_BASE sebelum memuat script.js di HTML, mis:
// <script>window.API_BASE = "https://your-backend.com/api"</script>
// Jika tidak diset, default ke same-origin /api
const API_BASE = (window.API_BASE && window.API_BASE.replace(/\/+$/,'')) || (location.origin + '/api');

// Local demo data (hanya menyertakan data 'found' untuk konsistensi)
const itemsData = [
    // Data yang asalnya 'lost' (id: 1) telah dihapus atau diubah
    { id: 2, type: 'found', title: 'iPhone 13 Pro', category: 'Elektronik', location: 'FST Lantai 2', date: '2024-01-20', img: 'https://placehold.co/400x300/333/white?text=iPhone', status: 'unclaimed', finder: 'Rizky (Ilkom)', desc: 'iPhone warna space gray dengan casing bening. Ditemukan di meja.' },
    { id: 3, type: 'found', title: 'Jam Tangan Emas', category: 'Aksesoris', location: "Kantin Ma'had", date: '2024-01-14', img: 'https://placehold.co/400x300/f59e0b/white?text=Jam+Tangan', status: 'pending', finder: 'Budi Santoso', desc: 'Jam tangan vintage tali kulit coklat.' }
];

// State
let currentFilter = 'all';
let currentType = 'found'; // DEFAULT sekarang adalah 'found'
let reportTypeVal = 'found'; // DEFAULT laporan sekarang adalah 'found'

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
    } 
    // BLOK 'lost' DIHAPUS
    else if (page === 'found') {
        document.getElementById('listing').classList.add('active');
        document.getElementById('nav-found').classList.add('active');
        document.getElementById('listing-title').innerText = 'Barang Ditemukan';
        currentType = 'found'; // Tetap 'found'
        resetFilterUI();
        fetchAndRenderListing();
    } else if (page === 'report') {
        document.getElementById('report').classList.add('active');
        // Pastikan toggleReportType di-trigger agar form 'found' tampil
        toggleReportType('found'); 
    }
    window.scrollTo(0,0);
}

/* --- Render Cards (works for both API results and local demo objects) --- */
function renderCards(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Filter items: Hanya tampilkan 'found', abaikan 'lost' (jika ada data lama/baru yang terlewat)
    const foundItems = items.filter(item => item.type === 'found'); 

    foundItems.forEach(item => {
        const itemId = item._id || item.id;
        // Asumsi data reporter/finder dan phone sudah tersedia di objek item
        const reporterName = item.finder || item.finderName || 'Anonim'; // Barang ditemukan, jadi yang ada adalah Finder/Penemu
        const contactPhone = item.phone || ''; 

        // Karena hanya ada tipe 'found', logika badge lebih sederhana
        const badgeClass = item.status === 'pending' ? 'pending' : 'found';
        const badgeText = item.status === 'pending' ? 'Pending Verifikasi' : 'Ditemukan';
        // Tombol selalu mengarah ke klaim barang yang ditemukan
        const btnText = item.status === 'pending' ? 'Proses...' : 'Klaim Barang';
        
        let btnAction = '';
        let isDisabled = '';

        if (item.status === 'pending') {
             isDisabled = 'disabled';
        } else {
            // Gunakan openClaimModal untuk klaim barang ditemukan
            // Di sini kita kembali menggunakan modal klaim karena fokusnya adalah barang ditemukan (yang harus diklaim)
            btnAction = `onclick="openClaimModal('${escapeHtml(item.title)}', '${escapeHtml(reporterName)}', '${itemId}')"`;
        }
        
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
                        <button class="btn-outline full-width" ${btnAction} ${isDisabled}>${btnText}</button>
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

function toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    nav.classList.toggle('active');
}

function filterItems() {
    fetchAndRenderListing();
}

/* ----------------------
   NETWORK: Fetch dari backend
   ---------------------- */
async function fetchAndRenderRecent() {
    // Ambil 3 terbaru, filter hanya 'found'
    const params = new URLSearchParams();
    params.append('type', 'found'); // Paksa filter 'found' di API
    params.append('limit', 3);
    
    try {
        const res = await fetch(`${API_BASE}/reports?${params.toString()}`, { headers: defaultHeaders });
        if (!res.ok) throw new Error('Network response not ok');
        const json = await res.json();
        const items = json.data || json;
        renderCards(items, 'recent-items-grid');
    } catch (err) {
        // fallback ke local (sudah difilter hanya 'found' di itemsData)
        console.warn('fetchRecent failed, using local data', err);
        renderCards(itemsData.slice(0,3), 'recent-items-grid');
    }
}

async function fetchAndRenderListing() {
    // Compose query params
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const params = new URLSearchParams();
    params.append('type', 'found'); // PAKSA TYPE FOUND
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
            const matchType = item.type === 'found'; // Selalu true
            const matchCat = currentFilter === 'all' ? true : item.category === currentFilter;
            const matchSearch = item.title.toLowerCase().includes(search) || item.location.toLowerCase().includes(search);
            return matchType && matchCat && matchSearch;
        });
        renderCards(filtered, 'listing-grid');
    }
}

/* ----------------------
   FORM: Create Report (hanya untuk tipe 'found')
   ---------------------- */

async function handleReportSubmit(e) {
    e.preventDefault();
    const typeSuffix = '-found'; 

    // Ambil data dasar
    const title = document.getElementById('input-title').value.trim();
    const category = document.getElementById('input-category' + typeSuffix).value;
    const date = document.getElementById('input-date' + typeSuffix).value;
    const location = document.getElementById('input-location' + typeSuffix).value.trim();
    const desc = document.getElementById('input-desc' + typeSuffix).value.trim();
    const phone = document.getElementById('input-phone' + typeSuffix).value.trim();
    const reporter = document.getElementById('input-reporter').value.trim();
    const imageInput = document.getElementById('input-image');
    const file = imageInput && imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;

    // --- PERBAIKAN DI SINI (Hanya ambil 3 Secret) ---
    const secret1 = document.getElementById('input-secret-1').value.trim();
    const secret2 = document.getElementById('input-secret-2').value.trim();
    const secret3 = document.getElementById('input-secret-3').value.trim();
   
   
        
    if (!secret1 || !secret2) {
        alert('Mohon isi Ciri Rahasia 1 dan 2 untuk verifikasi klaim.');
        return;
    }
    if (!title || !location || !date || !phone || !reporter) {
        alert('Mohon isi semua field wajib.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('date', date);
    formData.append('location', location);
    formData.append('phone', phone);
    formData.append('reporter', reporter);
    formData.append('description', desc);
    formData.append('type', 'found');

    formData.append('secret1', secret1);
    formData.append('secret2', secret2);
    formData.append('secret3', secret3);

    if (file) { formData.append('images', file); }

    // ... (Sisa kode fetch sama seperti sebelumnya) ...
    try {
        const res = await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: { 'Accept-Language': defaultLang },
            body: formData
        });
        // ... (lanjutan handling response)
        if (res.ok) {
             const json = await res.json();
             alert(json.message || 'Laporan berhasil dibuat.');
             document.querySelector('#report form').reset();
             navTo('found');
             fetchAndRenderListing();
        } else {
             const err = await res.json().catch(()=>({ message: 'Unknown error' }));
             alert('Gagal mengirim laporan: ' + (err.message || res.statusText));
        }
    } catch (err) {
        console.error('Error', err);
        alert('Gagal mengirim laporan (network).');
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

    const nameInput = document.getElementById('claim-name');
    // --- PERBAIKAN: Ambil ID yang benar dari HTML Modal ---
    const ans1Input = document.getElementById('claim-secret-1');
    const ans2Input = document.getElementById('claim-secret-2');
    const ans3Input = document.getElementById('claim-secret-3');

    const name = nameInput ? nameInput.value.trim() : '';
    const ans1 = ans1Input ? ans1Input.value.trim() : '';
    const ans2 = ans2Input ? ans2Input.value.trim() : '';
    const ans3 = ans3Input ? ans3Input.value.trim() : '';

    if (!name || !ans1 || !ans2) {
        alert('Mohon isi nama dan minimal 2 jawaban ciri rahasia.');
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
            // --- PERBAIKAN: Kirim sebagai object 'answers' ---
            body: JSON.stringify({
                reportId: currentClaimingId,
                name: name,
                reason: "Verifikasi Ciri Rahasia", // Default reason
                answers: {
                    secret1: ans1,
                    secret2: ans2,
                    secret3: ans3
                }
            })
        });

        if (res.ok) {
            const json = await res.json();
            alert(json.message || 'Klaim berhasil dikirim.');
            closeModal();
            fetchAndRenderListing();
        } else {
            const err = await res.json().catch(()=>({message: res.statusText}));
            alert('Gagal mengirim klaim: ' + (err.message || res.statusText));
        }
    } catch (err) {
        console.error('claim submit error', err);
        alert('Gagal kirim klaim (network).');
    }
}


/* ----------------------
   HELPERS
   ---------------------- */
function toggleReportType(type) {
    // Abaikan semua kecuali 'found'
    if (type !== 'found') return; 

    reportTypeVal = 'found'; // Tetapkan sebagai 'found'

    // Asumsi tombol 'lost' sudah dihapus di HTML, hanya tombol 'found' yang relevan
    const btnFound = document.getElementById('btn-found');
    if (btnFound) btnFound.classList.add('active'); 
    
    const lostFields = document.getElementById('lost-form-fields');
    const foundFields = document.getElementById('found-form-fields');
    
    // Sembunyikan formulir Kehilangan (jika elemennya masih ada)
    if (lostFields) {
        lostFields.classList.remove('active-fields');
        lostFields.classList.add('hidden-fields');
        lostFields.style.display = 'none';
    }
    
    // Tampilkan formulir Ditemukan
    if (foundFields) {
        foundFields.classList.add('active-fields');
        foundFields.classList.remove('hidden-fields');
        foundFields.style.display = 'block';
    }
}

function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'", '&#39;');
}

/* --- Hapus fungsi showContactInfo dan contactOwner karena fokus ke klaim via modal --- */
// Fungsi ini tidak lagi relevan karena barang hanya 'found' dan perlu diverifikasi melalui klaim.

/* ----------------------
   Attach global handlers that HTML expects
   ---------------------- */
window.navTo = navTo;
window.toggleReportType = toggleReportType;
window.handleReportSubmit = handleReportSubmit;
window.openClaimModal = openClaimModal;
window.closeModal = closeModal;
window.handleClaimSubmit = handleClaimSubmit;
window.setCategory = setCategory;
window.filterItems = filterItems;
window.toggleMobileMenu = toggleMobileMenu;

// Pastikan fungsi yang dihapus tidak lagi terikat ke window
// window.showContactInfo = showContactInfo; // Dihapus
// window.contactOwner = contactOwner; // Dihapus