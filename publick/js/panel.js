import { auth, signOut, onAuthStateChanged, db } from './firebase.js';
import { ref, get, set, push, remove, onValue, update } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const panelLoader = document.getElementById('panelLoader');
let currentCategory = 'frontend';
let cachedProducts = {};

function showCustomModal(title, desc, showCancel = false, onConfirm = null) {
    const overlay = document.getElementById('customModalOverlay');
    const titleElem = document.getElementById('customModalTitle');
    const descElem = document.getElementById('customModalDesc');
    const cancelBtn = document.getElementById('customModalCancel');
    const confirmBtn = document.getElementById('customModalConfirm');

    titleElem.textContent = title;
    descElem.textContent = desc;

    if (showCancel) {
        cancelBtn.style.display = 'block';
    } else {
        cancelBtn.style.display = 'none';
    }

    overlay.classList.add('show');

    const handleConfirm = () => {
        overlay.classList.remove('show');
        cleanup();
        if (onConfirm) onConfirm(true);
    };

    const handleCancel = () => {
        overlay.classList.remove('show');
        cleanup();
        if (onConfirm) onConfirm(false);
    };

    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        overlay.removeEventListener('click', handleOverlayClick);
    };

    const handleOverlayClick = (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            cleanup();
            if (onConfirm) onConfirm(false);
        }
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlayClick);
}

function formatPrice(priceVal) {
    if (!priceVal) return 'Gratis';
    let strVal = String(priceVal).trim();

    if (strVal.includes('$') || strVal.includes('€') || strVal.includes('¥') || strVal.includes('£') || strVal.includes('k') || strVal.includes('JT') || strVal.includes('Rp')) {
        return strVal;
    }

    const num = parseFloat(strVal.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return strVal;

    if (num >= 1000000) {
        const jtVal = num / 1000000;
        return (jtVal % 1 === 0 ? jtVal : jtVal.toFixed(1)) + ' JT';
    } else if (num >= 1000) {
        const kVal = num / 1000;
        return (kVal % 1 === 0 ? kVal.toLocaleString('id-ID') : kVal.toFixed(1)) + 'k';
    }
    return 'Rp ' + num.toLocaleString('id-ID');
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace('/login/');
        return;
    }

    try {
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (!snapshot.exists() || snapshot.val().role !== 'admin') {
            showCustomModal("Akses Ditolak", "Halaman ini khusus untuk Admin.", false, () => {
                window.location.replace('/');
            });
            return;
        }

        const userNameElem = document.getElementById('userName');
        const userEmailElem = document.getElementById('userEmail');
        if (userNameElem) userNameElem.textContent = user.displayName || 'Admin Mineplix';
        if (userEmailElem) userEmailElem.textContent = user.email || '';

        if (panelLoader) {
            setTimeout(() => { panelLoader.classList.add('hidden'); }, 300);
        }

        setupFormCatDropdown();
        loadAdminProducts(currentCategory);
        listenAllOrders();

    } catch (error) {
        window.location.replace('/');
    }
});

function setupFormCatDropdown() {
    const dropdown = document.getElementById('formCatDropdown');
    if (!dropdown) return;

    const toggle = dropdown.querySelector('.custom-dropdown-toggle');
    const label = document.getElementById('formCatLabel');
    const items = dropdown.querySelectorAll('.custom-dropdown-item');

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });

    items.forEach(item => {
        item.addEventListener('click', () => {
            const val = item.getAttribute('data-value');
            const txt = item.getAttribute('data-label');
            dropdown.setAttribute('data-value', val);
            label.textContent = txt;
            dropdown.classList.remove('open');
        });
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('open');
    });
}

function loadAdminProducts(category) {
    const grid = document.getElementById('adminProductGrid');
    const prodRef = ref(db, 'produk/' + category);

    onValue(prodRef, (snapshot) => {
        const data = snapshot.val();
        cachedProducts[category] = data;

        if (!data) {
            grid.innerHTML = `
                <div class="empty-state-card" style="grid-column: 1 / -1;">
                    <h3>Belum Ada Produk</h3>
                    <p>Gunakan tab Tambah Produk untuk menambahkan produk pada kategori ini.</p>
                </div>
            `;
            return;
        }

        let html = '';
        Object.keys(data).forEach((id) => {
            const item = data[id];
            html += `
                <div class="admin-prod-card">
                    <img src="${item.logo || '../publick/img/icon.png'}" alt="${item.title}" class="admin-prod-img">
                    <div class="admin-prod-body">
                        <h4>${item.title || 'Tanpa Judul'}</h4>
                        <div class="admin-prod-price">${formatPrice(item.harga)}</div>
                        <p class="admin-prod-desc">${item.desc || '-'}</p>
                    </div>
                    <div class="admin-prod-actions">
                        <button class="btn-icon-action btn-edit-prod" data-id="${id}" aria-label="Edit Produk">
                            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button class="btn-icon-action btn-delete-prod" data-id="${id}" aria-label="Hapus Produk">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;

        document.querySelectorAll('.btn-edit-prod').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                setupEditProduct(category, id, data[id]);
            });
        });

        document.querySelectorAll('.btn-delete-prod').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteProduct(category, id);
            });
        });
    });
}

const productForm = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const dropdown = document.getElementById('formCatDropdown');
    const category = dropdown.getAttribute('data-value') || 'frontend';
    const title = document.getElementById('prodTitle').value.trim();
    const harga = document.getElementById('prodPrice').value.trim();
    const logo = document.getElementById('prodLogo').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();

    const editCat = document.getElementById('editCategory').value;
    const editId = document.getElementById('editProductId').value;

    try {
        if (editId && editCat) {
            const targetRef = ref(db, `produk/${editCat}/${editId}`);
            await update(targetRef, { title, harga, logo, desc });
            showCustomModal("Sukses", "Produk berhasil diperbarui.");
        } else {
            const targetRef = ref(db, `produk/${category}`);
            const newRef = push(targetRef);
            await set(newRef, {
                title,
                harga,
                logo,
                desc,
                createdBy: user.email,
                createdAt: Date.now()
            });
            showCustomModal("Sukses", "Produk baru berhasil ditambahkan.");
        }

        resetForm();
        window.switchProdSubtab('list');
    } catch (error) {
        showCustomModal("Gagal", "Gagal menyimpan data produk: " + error.message);
    }
});

function setupEditProduct(category, id, item) {
    window.switchProdSubtab('add');

    formTitle.textContent = "Edit Produk";
    submitBtn.textContent = "Perbarui Produk";
    cancelEditBtn.style.display = "inline-block";

    document.getElementById('editCategory').value = category;
    document.getElementById('editProductId').value = id;

    const dropdown = document.getElementById('formCatDropdown');
    const label = document.getElementById('formCatLabel');
    dropdown.setAttribute('data-value', category);

    const matchItem = dropdown.querySelector(`.custom-dropdown-item[data-value="${category}"]`);
    if (matchItem) {
        label.textContent = matchItem.getAttribute('data-label');
    }

    document.getElementById('prodTitle').value = item.title || '';
    document.getElementById('prodPrice').value = item.harga || '';
    document.getElementById('prodLogo').value = item.logo || '';
    document.getElementById('prodDesc').value = item.desc || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    formTitle.textContent = "Tambah Produk Baru";
    submitBtn.textContent = "Simpan Produk";
    cancelEditBtn.style.display = "none";
    document.getElementById('editCategory').value = "";
    document.getElementById('editProductId').value = "";
    productForm.reset();
}

cancelEditBtn.addEventListener('click', resetForm);

async function deleteProduct(category, id) {
    showCustomModal("Konfirmasi", "Apakah Anda yakin ingin menghapus produk ini dari katalog?", true, async (confirmed) => {
        if (confirmed) {
            try {
                await remove(ref(db, `produk/${category}/${id}`));
                showCustomModal("Sukses", "Produk berhasil dihapus.");
            } catch (error) {
                showCustomModal("Gagal", "Gagal menghapus produk: " + error.message);
            }
        }
    });
}

document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-cat');
        loadAdminProducts(currentCategory);
    });
});

function listenAllOrders() {
    const ordersRef = ref(db, 'orders');
    onValue(ordersRef, (snapshot) => {
        const allOrders = snapshot.val();
        renderAdminOrders(allOrders);
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Konfirmasi': return 'badge-konfirmasi';
        case 'Pembayaran Terkonfirmasi': return 'badge-pembayaran';
        case 'Mengerjakan': return 'badge-mengerjakan';
        case 'Completed': return 'badge-completed';
        default: return 'badge-konfirmasi';
    }
}

function renderAdminOrders(allUsersOrders) {
    const orderContentActive = document.getElementById('orderContentActive');
    const orderContentHistory = document.getElementById('orderContentHistory');

    if (!allUsersOrders) {
        orderContentActive.innerHTML = '<div class="empty-state-card">Belum ada pesanan masuk.</div>';
        orderContentHistory.innerHTML = '<div class="empty-state-card">Belum ada pesanan yang selesai.</div>';
        return;
    }

    const activeOrders = [];
    const historyOrders = [];

    Object.keys(allUsersOrders).forEach(uid => {
        const userOrders = allUsersOrders[uid];
        Object.keys(userOrders).forEach(orderKey => {
            const item = userOrders[orderKey];
            item.uid = uid;
            item.orderKey = orderKey;
            
            const currentStatus = item.status || 'Konfirmasi';
            if (currentStatus === 'Completed') {
                historyOrders.push(item);
            } else {
                activeOrders.push(item);
            }
        });
    });

    activeOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    historyOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    orderContentActive.innerHTML = buildOrdersCardGrid(activeOrders);
    orderContentHistory.innerHTML = buildOrdersCardGrid(historyOrders);

    setupCustomDropdowns();
}

function setupCustomDropdowns() {
    document.querySelectorAll('.order-grid-card .custom-dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.custom-dropdown-toggle');
        const items = dropdown.querySelectorAll('.custom-dropdown-item');

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        });

        items.forEach(item => {
            item.addEventListener('click', async () => {
                const newStatus = item.getAttribute('data-value');
                const oldStatus = dropdown.getAttribute('data-current');
                const uid = dropdown.getAttribute('data-uid');
                const key = dropdown.getAttribute('data-key');

                dropdown.classList.remove('open');

                if (newStatus === oldStatus) return;

                showCustomModal("Konfirmasi", `Simpan status pesanan baru menjadi "${newStatus}" ke Firebase?`, true, async (confirmed) => {
                    if (confirmed) {
                        try {
                            await update(ref(db, `orders/${uid}/${key}`), { status: newStatus });
                            showCustomModal("Sukses", "Status pesanan berhasil disimpan.");
                        } catch (err) {
                            showCustomModal("Gagal", "Gagal memperbarui status: " + err.message);
                        }
                    }
                });
            });
        });
    });
}

function buildOrdersCardGrid(ordersList) {
    if (ordersList.length === 0) {
        return `<div class="empty-state-card">Tidak ada data pesanan.</div>`;
    }

    let html = `<div class="orders-cards-grid">`;

    ordersList.forEach(item => {
        const statusVal = item.status || 'Konfirmasi';
        const badgeClass = getStatusBadgeClass(statusVal);
        const orderIdShort = item.productId || item.orderKey.slice(-6);

        html += `
            <div class="order-grid-card">
                <div class="order-card-header">
                    <span class="order-id">ID: #${orderIdShort}</span>
                    <span class="status-pill ${badgeClass}">${statusVal}</span>
                </div>

                <div class="order-card-body">
                    <h4 class="order-item-title">${item.title || 'Layanan Digital'}</h4>
                    <div class="order-item-price">${formatPrice(item.harga)}</div>
                    
                    <div class="order-buyer-info">
                        <div class="info-row">
                            <span class="info-label">Pembeli:</span>
                            <span class="info-value">${item.userName || 'Pelanggan'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${item.userEmail || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Waktu:</span>
                            <span class="info-value">${formatDate(item.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div class="order-card-footer">
                    <span class="select-label">Ubah Status:</span>
                    <div class="custom-dropdown" data-uid="${item.uid}" data-key="${item.orderKey}" data-current="${statusVal}">
                        <div class="custom-dropdown-toggle">
                            <span>${statusVal}</span>
                            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        <div class="custom-dropdown-menu">
                            <div class="custom-dropdown-item" data-value="Konfirmasi">Konfirmasi</div>
                            <div class="custom-dropdown-item" data-value="Pembayaran Terkonfirmasi">Pembayaran Terkonfirmasi</div>
                            <div class="custom-dropdown-item" data-value="Mengerjakan">Mengerjakan</div>
                            <div class="custom-dropdown-item" data-value="Completed">Completed</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

window.switchTab = function(tabName) {
    const menuDashboard = document.getElementById('menuDashboard');
    const menuOrder = document.getElementById('menuOrder');
    const contentDashboard = document.getElementById('contentDashboard');
    const contentOrder = document.getElementById('contentOrder');

    if (tabName === 'dashboard') {
        menuDashboard.classList.add('active');
        menuOrder.classList.remove('active');
        contentDashboard.classList.add('active');
        contentOrder.classList.remove('active');
    } else {
        menuOrder.classList.add('active');
        menuDashboard.classList.remove('active');
        contentOrder.classList.add('active');
        contentDashboard.classList.remove('active');
    }
};

window.switchProdSubtab = function(subtabName) {
    const subtabAdd = document.getElementById('subtabAddProd');
    const subtabList = document.getElementById('subtabListProd');
    const contentAdd = document.getElementById('prodContentAdd');
    const contentList = document.getElementById('prodContentList');

    if (subtabName === 'add') {
        subtabAdd.classList.add('active');
        subtabList.classList.remove('active');
        contentList.classList.remove('active');
        contentAdd.classList.add('active');
    } else {
        subtabList.classList.add('active');
        subtabAdd.classList.remove('active');
        contentAdd.classList.remove('active');
        contentList.classList.add('active');
    }
};

window.switchOrderSubtab = function(subtabName) {
    const subtabActive = document.getElementById('subtabActive');
    const subtabHistory = document.getElementById('subtabHistory');
    const orderContentActive = document.getElementById('orderContentActive');
    const orderContentHistory = document.getElementById('orderContentHistory');

    if (subtabName === 'active') {
        subtabActive.classList.add('active');
        subtabHistory.classList.remove('active');
        orderContentHistory.classList.remove('active');
        orderContentActive.classList.add('active');
    } else {
        subtabHistory.classList.add('active');
        subtabActive.classList.remove('active');
        orderContentActive.classList.remove('active');
        orderContentHistory.classList.add('active');
    }
};

const burgerBtn = document.getElementById('burgerBtn');
const panelSidebar = document.getElementById('panelSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    if (panelSidebar) panelSidebar.classList.toggle('active');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
}

if (burgerBtn) burgerBtn.addEventListener('click', toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

const settingBtn = document.getElementById('settingBtn');
const profilePopover = document.getElementById('profilePopover');

if (settingBtn) {
    settingBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profilePopover.classList.toggle('show');
    });
}

document.addEventListener('click', (e) => {
    if (profilePopover && !profilePopover.contains(e.target) && !settingBtn.contains(e.target)) {
        profilePopover.classList.remove('show');
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.replace('/login/');
});
