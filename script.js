// --- 1. DATA AWAL (Simulasi Database) ---
const itemsData = [
    { 
        id: 1, type: 'lost', title: 'Tas Ransel Eiger', category: 'Tas', 
        location: 'Gedung Anwar Musaddad', date: '2024-01-15', 
        img: 'https://placehold.co/400x300/1e40af/white?text=Tas+Hilang', 
        status: 'lost', desc: 'Tas warna biru navy, gantungan kunci anime One Piece.' 
    },
    { 
        id: 2, type: 'found', title: 'iPhone 13 Pro', category: 'Elektronik', 
        location: 'FST Lantai 2', date: '2024-01-20', 
        img: 'https://placehold.co/400x300/333/white?text=iPhone', 
        status: 'unclaimed', finder: 'Rizky (Ilkom)', 
        desc: 'iPhone warna space gray dengan casing bening. Ditemukan di meja.' 
    },
    { 
        id: 3, type: 'found', title: 'Jam Tangan Emas', category: 'Aksesoris', 
        location: 'Kantin Ma\'had', date: '2024-01-14', 
        img: 'https://placehold.co/400x300/f59e0b/white?text=Jam+Tangan', 
        status: 'pending', finder: 'Budi Santoso', desc: 'Jam tangan vintage tali kulit coklat.' 
    }
];

// Variables State
let currentFilter = 'all';
let currentType = 'all';
let reportTypeVal = 'lost'; // Default status saat buka form pelaporan

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
    navTo('home');
});

// --- 2. FUNGSI NAVIGASI (SPA) ---
function navTo(page) {
    // Update Nav Link Active
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    // Hide All Sections
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

    // Logic Switch Halaman
    if(page === 'home') {
        document.getElementById('home').classList.add('active');
        document.getElementById('nav-home').classList.add('active');
        renderCards(itemsData.slice(0,3), 'recent-items-grid');
    
    } else if (page === 'lost') {
        document.getElementById('listing').classList.add('active');
        document.getElementById('nav-lost').classList.add('active');
        document.getElementById('listing-title').innerText = 'Barang Hilang (Dicari)';
        currentType = 'lost';
        resetFilterUI();
        filterItems();
    
    } else if (page === 'found') {
        document.getElementById('listing').classList.add('active');
        document.getElementById('nav-found').classList.add('active');
        document.getElementById('listing-title').innerText = 'Barang Ditemukan';
        currentType = 'found';
        resetFilterUI();
        filterItems();
    
    } else if (page === 'report') {
        document.getElementById('report').classList.add('active');
    }
    window.scrollTo(0,0);
}

// --- 3. FUNGSI RENDER KARTU ---
function renderCards(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; 

    if (items.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--secondary);">Tidak ada data barang.</p>';
        return;
    }

    items.forEach(item => {
        let badgeClass = item.type === 'lost' ? 'lost' : (item.status === 'pending' ? 'pending' : 'found');
        let badgeText = item.type === 'lost' ? 'Dicari' : (item.status === 'pending' ? 'Pending' : 'Ditemukan');
        let btnText = item.type === 'lost' ? 'Hubungi Pemilik' : (item.status === 'pending' ? 'Proses...' : 'Klaim Barang');
        let btnAction = item.type === 'found' && item.status !== 'pending' ? `onclick="openClaimModal('${item.title}', '${item.finder}')"` : '';

        const card = `
            <div class="card">
                <div class="card-img">
                    <img src="${item.img}" alt="${item.title}" loading="lazy">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${item.title}</h3>
                    <div class="card-meta"><i class="fa-solid fa-location-dot"></i> ${item.location}</div>
                    <div class="card-meta"><i class="fa-regular fa-calendar"></i> ${item.date}</div>
                    <p class="card-desc">${item.desc}</p>
                    <div class="card-footer">
                        <button class="btn-outline full-width" ${btnAction} ${item.status === 'pending' ? 'disabled' : ''}>${btnText}</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// --- 4. FILTER SYSTEM ---
function resetFilterUI() {
    document.getElementById('searchInput').value = '';
    currentFilter = 'all';
    document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
    document.querySelector('.cat-pill').classList.add('active');
}

function setCategory(cat, element) {
    currentFilter = cat;
    document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    filterItems();
}

function filterItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = itemsData.filter(item => {
        const matchType = currentType === 'all' ? true : item.type === currentType;
        const matchCat = currentFilter === 'all' ? true : item.category === currentFilter;
        const matchSearch = item.title.toLowerCase().includes(searchTerm) || item.location.toLowerCase().includes(searchTerm);
        return matchType && matchCat && matchSearch;
    });
    renderCards(filtered, 'listing-grid');
}

// --- 5. LOGIKA INPUT FORM (LENGKAP DENGAN GAMBAR) ---
function toggleReportType(type) {
    reportTypeVal = type;
    document.getElementById('btn-lost').classList.toggle('active', type === 'lost');
    document.getElementById('btn-found').classList.toggle('active', type === 'found');
}

function handleReportSubmit(e) {
    e.preventDefault();

    // 1. Ambil Data Form
    const title = document.getElementById('input-title').value;
    const category = document.getElementById('input-category').value;
    const date = document.getElementById('input-date').value;
    const location = document.getElementById('input-location').value;
    const desc = document.getElementById('input-desc').value;
    const imageInput = document.getElementById('input-image');

    // 2. Tentukan Status
    let statusItem = reportTypeVal === 'lost' ? 'lost' : 'unclaimed';
    let finderName = reportTypeVal === 'found' ? 'Anda (User)' : '-';

    // 3. Proses Upload Gambar
    const file = imageInput.files[0];
    const reader = new FileReader();

    reader.onloadend = function() {
        // Jika tidak ada gambar, pakai placeholder default
        const imageUrl = file ? reader.result : 'https://placehold.co/400x300/e2e8f0/808080?text=No+Image';

        // 4. Buat Object Baru
        const newItem = {
            id: Date.now(),
            type: reportTypeVal,
            title: title,
            category: category,
            location: location,
            date: date,
            img: imageUrl,
            status: statusItem,
            desc: desc,
            finder: finderName
        };

        // 5. Masukkan ke Array Utama (Paling Atas)
        itemsData.unshift(newItem);

        // 6. Reset & Notifikasi
        alert(`Laporan "${title}" berhasil ditambahkan!`);
        document.querySelector('form').reset();
        
        // 7. Pindah ke halaman list untuk melihat hasil
        navTo(reportTypeVal);
    };

    if (file) {
        reader.readAsDataURL(file); // Baca file gambar
    } else {
        reader.onloadend(); // Tetap jalan meski tanpa gambar
    }
}

// --- 6. MODAL SYSTEM ---
function openClaimModal(itemName, finderName) {
    document.getElementById('claimModal').classList.add('show');
    document.getElementById('modal-item-name').innerText = itemName;
    document.getElementById('modal-finder').innerText = finderName;
}

function closeModal() {
    document.getElementById('claimModal').classList.remove('show');
}

window.onclick = function(event) {
    if (event.target == document.getElementById('claimModal')) closeModal();
}

function handleClaimSubmit(e) {
    e.preventDefault();
    alert('Klaim diajukan! Penemu akan menerima notifikasi.');
    closeModal();
}