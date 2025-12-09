/* ------------------------------
   TemUIN - script.js (MODIFIKASI: Implementasi Modal Notifikasi Kustom & Fix Sensor WA)
   ------------------------------ */

/* --- 0. CONFIG --- */
const API_BASE = (window.API_BASE && window.API_BASE.replace(/\/+$/,'')) || (location.origin + '/api');

// Local demo data (hanya menyertakan data 'found' untuk konsistensi)
const itemsData = [
    { id: 2, type: 'found', title: 'iPhone 13 Pro', category: 'Elektronik', location: 'FST Lantai 2', date: '2024-01-20', img: 'https://placehold.co/400x300/333/white?text=iPhone', status: 'unclaimed', finder: 'Rizky (Ilkom)', desc: 'iPhone warna space gray dengan casing bening. Ditemukan di meja.' },
    { id: 3, type: 'found', title: 'Jam Tangan Emas', category: 'Aksesoris', location: "Kantin Ma'had", date: '2024-01-14', img: 'https://placehold.co/400x300/f59e0b/white?text=Jam+Tangan', status: 'pending', finder: 'Budi Santoso', desc: 'Jam tangan vintage tali kulit coklat.' }
];

// State
let currentFilter = 'all';
let currentType = 'found'; 
let reportTypeVal = 'found'; 

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
    else if (page === 'found') {
        document.getElementById('listing').classList.add('active');
        document.getElementById('nav-found').classList.add('active');
        document.getElementById('listing-title').innerText = 'Barang Ditemukan';
        currentType = 'found'; 
        resetFilterUI();
        fetchAndRenderListing();
    } else if (page === 'report') {
        document.getElementById('report').classList.add('active');
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
        const reporterName = item.finder || item.finderName || 'Anonim'; 
        const badgeClass = item.status === 'pending' ? 'pending' : 'found';
        const badgeText = item.status === 'pending' ? 'Pending Verifikasi' : 'Ditemukan';
        const btnText = item.status === 'pending' ? 'Proses...' : 'Klaim Barang';
        
        let btnAction = '';
        let isDisabled = '';

        if (item.status === 'pending') {
             isDisabled = 'disabled';
        } else {
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
    const phone = document.getElementById('input-phone-found').value.trim(); 
    const reporter = document.getElementById('input-reporter').value.trim();
    const imageInput = document.getElementById('input-image');
    const file = imageInput && imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;

    // Ambil 3 Secret
    const secret1 = document.getElementById('input-secret-1').value.trim();
    const secret2 = document.getElementById('input-secret-2').value.trim();
    const secret3 = document.getElementById('input-secret-3').value.trim();
   
   
        
    if (!secret1 || !secret2) {
        showNotification('Gagal!', 'Mohon isi Ciri Rahasia 1 dan 2 untuk verifikasi klaim.', 'warning');
        return;
    }
    if (!title || !location || !date || !phone || !reporter) {
        showNotification('Gagal!', 'Mohon isi semua field wajib.', 'warning');
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

    try {
        const res = await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: { 'Accept-Language': defaultLang },
            body: formData
        });
        
        if (res.ok) {
             const json = await res.json();
             showNotification('Berhasil!', json.message || 'Laporan berhasil dibuat.', 'success');
             document.querySelector('#report form').reset();
             navTo('found');
             fetchAndRenderListing();
        } else {
             const err = await res.json().catch(()=>({ message: 'Unknown error' }));
             showNotification('Gagal!', 'Gagal mengirim laporan: ' + (err.message || res.statusText), 'error');
        }
    } catch (err) {
        console.error('Error', err);
        showNotification('Error Jaringan!', 'Gagal mengirim laporan (network).', 'error');
    }
}

/* ----------------------
   CLAIM modal + submit (Modal Klaim Item)
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
    // Tambahkan penutup untuk modal cek klaim
    if (event.target === document.getElementById('checkClaimModal')) closeCheckClaimModal();
    if (event.target === document.getElementById('notificationModal')) closeNotificationModal();
}

async function handleClaimSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('claim-name');
    const ans1Input = document.getElementById('claim-secret-1');
    const ans2Input = document.getElementById('claim-secret-2');
    const ans3Input = document.getElementById('claim-secret-3');

    const name = nameInput ? nameInput.value.trim() : '';
    const ans1 = ans1Input ? ans1Input.value.trim() : '';
    const ans2 = ans2Input ? ans2Input.value.trim() : '';
    const ans3 = ans3Input ? ans3Input.value.trim() : '';

    // Validasi input ciri rahasia
    if (!name || !ans1 || !ans2) {
        showNotification('Gagal Klaim!', 'Mohon isi nama dan minimal 2 jawaban ciri rahasia.', 'warning');
        return;
    }

    if (!currentClaimingId) {
        showNotification('Error!', 'Item ID tidak ditemukan.', 'error');
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
                name: name,
                reason: "Verifikasi Ciri Rahasia", 
                answers: {
                    secret1: ans1,
                    secret2: ans2,
                    secret3: ans3
                }
                // PIN TIDAK DIKIRIMKAN DI SINI
            })
        });

        if (res.ok) {
            const json = await res.json();
            
            // LOGIKA BARU: Memberi tahu pengguna untuk CEK DI MENU BARU
            
            if (json.claimToken) {
                // Tampilkan TOKEN dengan jelas agar user menyalinnya
                showNotification('Klaim Diajukan!', 'Klaim berhasil diajukan.\nMohon CATAT/SCREENSHOT Token ini untuk cek status:\n👉 <b>' + json.claimToken + '</b>\n\n(Gunakan token ini di menu Cek Klaim Saya)', 'success', () => navTo('found'));
            } else {
                showNotification('Klaim Diajukan!', json.message || 'Klaim berhasil diajukan.', 'success', () => navTo('found'));
            }
            
            closeModal();
            fetchAndRenderListing();
        } else {
            const err = await res.json().catch(()=>({message: res.statusText}));
            showNotification('Gagal Klaim!', 'Gagal mengirim klaim: ' + (err.message || res.statusText), 'error');
        }
    } catch (err) {
        console.error('claim submit error', err);
        showNotification('Error Jaringan!', 'Gagal kirim klaim (network).', 'error');
    }
}


/* ----------------------------------
   NEW: CHECK CLAIMS STATUS (DENGAN MODAL KUSTOM)
   ---------------------------------- */

// 1. Fungsi yang dipanggil dari navbar (membuka modal)
function checkMyClaimsStatus() {
    openCheckClaimModal();
}

function openCheckClaimModal() {
    document.getElementById('checkClaimModal').classList.add('show');
    // Bersihkan input
    document.getElementById('input-claim-id-check').value = '';
}

function closeCheckClaimModal() {
    document.getElementById('checkClaimModal').classList.remove('show');
}


// 2. Fungsi untuk menangani submission dari modal cek klaim
async function handleCheckClaimSubmit(e) {
    e.preventDefault();
    
    const inputElement = document.getElementById('input-claim-id-check');
    const claimId = inputElement ? inputElement.value.trim() : '';
    
    if (!claimId) {
        return showNotification('Error!', 'Mohon masukkan ID Laporan atau Token Klaim.', 'warning');
    }

    try {
        const res = await fetch(`${API_BASE}/claims/check?id=${encodeURIComponent(claimId)}`, {
            method: 'GET',
            headers: defaultHeaders
        });

        if (res.ok) {
            const json = await res.json();
            
            // PASTIKAN DATA DARI API DIKEMBALIKAN DALAM OBJEK 'data'
            const { status, finderPhone, finderName, itemTitle } = json.data || json;
            let message = '';

            closeCheckClaimModal(); 

            if (status === 'confirmed' && finderPhone) {
                
                // Sanitasi dan format nomor telepon
                const cleanPhone = finderPhone.replace(/[^0-9]/g, '');
                let formattedPhone = cleanPhone;
                
                if (cleanPhone.startsWith('62')) {
                    formattedPhone = '0' + cleanPhone.substring(2); 
                } else if (cleanPhone.startsWith('8')) {
                    formattedPhone = '0' + cleanPhone; 
                } else {
                    formattedPhone = cleanPhone;
                }

                // Tampilkan pesan sukses dan kontak
                message = `🎉 SELAMAT! Klaim Anda untuk ${itemTitle || 'barang ini'} telah diverifikasi dan disetujui.\n\n`;
                message += `Silakan hubungi Penemu (${finderName || 'Anonim'}) di kontak berikut untuk berkoordinasi pengambilan:\n\n`;
                // FIX SENSOR: Menggunakan variabel formattedPhone
               message += `Nomor WhatsApp: ${formattedPhone}\n\n`;
                // Permintaan: TIDAK ADA PENGARAHAN KE WHATSAPP (baris dihapus)
                
                // Ganti alert dengan modal kustom, action: TUTUP (null)
                showNotification('Klaim Dikonfirmasi!', message, 'success', null); 
                
            } else if (status === 'pending') {
                message = `⏳ Status klaim untuk ${itemTitle || 'barang ini'} saat ini adalah **PENDING (Menunggu Verifikasi)**.\n\nAdmin atau Penemu sedang meninjau jawaban ciri rahasia Anda. Silakan cek kembali dalam waktu 1x24 jam.`;
                showNotification('Status Pending!', message, 'warning');
                
            } else if (status === 'rejected') {
                message = `❌ Status klaim untuk ${itemTitle || 'barang ini'} adalah **DITOLAK**.\n\nJawaban ciri rahasia yang Anda berikan tidak sesuai. Jika ini adalah barang Anda, silakan hubungi admin atau coba laporkan kembali dengan ciri-ciri yang lebih akurat.`;
                showNotification('Klaim Ditolak!', message, 'error');
                
            } else {
                 showNotification('Error!', json.message || `Status Klaim: ${status || 'Pending'}. Silakan coba lagi nanti.`, 'error');
            }
        } else {
            closeCheckClaimModal(); 
            const err = await res.json().catch(()=>({message: res.statusText}));
            showNotification('Error!', 'Gagal cek status klaim: ' + (err.message || res.statusText), 'error');
        }
    } catch (err) {
        closeCheckClaimModal();
        console.error('Error checking claim status', err);
        showNotification('Error Jaringan!', 'Gagal cek status klaim (network error).', 'error');
    }
}


/* ----------------------------------
   NEW: UNIVERSAL NOTIFICATION MODAL
   ---------------------------------- */
function showNotification(title, message, type = 'info', action = null) {
    const modal = document.getElementById('notificationModal');
    const iconDiv = document.getElementById('notification-icon');
    const titleEl = document.getElementById('notification-title');
    const messageEl = document.getElementById('notification-message');
    const buttonEl = document.getElementById('notification-button');
    
    // Set Title and Message
    titleEl.innerText = title;
    messageEl.innerHTML = message.replaceAll('\n', '<br>'); // Handle line breaks
    
    // Set Icon and Color based on type
    iconDiv.className = 'notification-icon'; // Reset classes
    
    if (type === 'success') {
        iconDiv.classList.add('success');
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    } else if (type === 'error') {
        iconDiv.classList.add('error');
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    } else if (type === 'warning') {
        iconDiv.classList.add('warning');
        iconDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else { // info
        iconDiv.classList.add('info');
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    }

    // Set Button Action
    buttonEl.innerText = 'Tutup'; // Reset teks tombol
    buttonEl.onclick = closeNotificationModal; 
    if (action && typeof action === 'function') {
        buttonEl.onclick = () => {
            closeNotificationModal();
            action();
        };
    }
    
    modal.classList.add('show');
}

function closeNotificationModal() {
    document.getElementById('notificationModal').classList.remove('show');
}

/* ----------------------
   HELPERS
   ---------------------- */
function toggleReportType(type) {
    // Abaikan semua kecuali 'found'
    if (type !== 'found') return; 

    reportTypeVal = 'found'; // Tetapkan sebagai 'found'

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

// Daftarkan fungsi baru (termasuk notification modal)
window.checkMyClaimsStatus = checkMyClaimsStatus;
window.closeCheckClaimModal = closeCheckClaimModal;
window.handleCheckClaimSubmit = handleCheckClaimSubmit;
window.showNotification = showNotification; 
window.closeNotificationModal = closeNotificationModal;