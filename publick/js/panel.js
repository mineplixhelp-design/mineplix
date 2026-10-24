import { auth, signOut, onAuthStateChanged, db } from './firebase.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const panelLoader = document.getElementById('panelLoader');
let ordersListener = null;

function formatPrice(priceVal) {
    if (!priceVal) return 'Gratis';
    let strVal = String(priceVal).trim();

    if (strVal.includes('$') || strVal.includes('€') || strVal.includes('¥') || strVal.includes('£')) {
        return strVal;
    }

    if (strVal.includes('k') || strVal.includes('JT') || strVal.includes('Rp')) {
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

function renderOrders(ordersData) {
    const orderContentActive = document.getElementById('orderContentActive');
    const orderContentHistory = document.getElementById('orderContentHistory');

    if (!ordersData) {
        if (orderContentActive) {
            orderContentActive.innerHTML = `
                <div class="empty-state-card">
                    <h3>Belum Ada Orderan Aktif</h3>
                    <p>Anda belum memiliki pemesanan layanan yang sedang berjalan saat ini.</p>
                    <div class="btn-primary-panel" onclick="window.location.href='/produk'">Pesan Layanan Sekarang</div>
                </div>
            `;
        }
        if (orderContentHistory) {
            orderContentHistory.innerHTML = `
                <div class="empty-state-card">
                    <h3>Riwayat Pemesanan Kosong</h3>
                    <p>Belum ada riwayat transaksi atau layanan yang telah selesai sebelumnya.</p>
                </div>
            `;
        }
        return;
    }

    const activeOrders = [];
    const historyOrders = [];

    Object.keys(ordersData).forEach((key) => {
        const order = ordersData[key];
        order.orderKey = key;
        const statusLower = (order.status || '').toLowerCase();

        if (statusLower === 'completed' || statusLower === 'selesai' || statusLower === 'canceled' || statusLower === 'batal') {
            historyOrders.push(order);
        } else {
            activeOrders.push(order);
        }
    });

    activeOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    historyOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (orderContentActive) {
        if (activeOrders.length === 0) {
            orderContentActive.innerHTML = `
                <div class="empty-state-card">
                    <h3>Belum Ada Orderan Aktif</h3>
                    <p>Anda belum memiliki pemesanan layanan yang sedang berjalan saat ini.</p>
                    <div class="btn-primary-panel" onclick="window.location.href='/produk'">Pesan Layanan Sekarang</div>
                </div>
            `;
        } else {
            let activeHtml = `
                <div class="orders-table-container">
                    <table class="orders-table">
                        <thead>
                            <tr>
                                <th>Layanan</th>
                                <th>ID Pesanan</th>
                                <th>Harga</th>
                                <th>Status</th>
                                <th>Tanggal</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            activeOrders.forEach((item) => {
                const statusStr = item.status || 'Active';
                const statusBadgeClass = 'badge-' + statusStr.toLowerCase().replace(/\s+/g, '');
                
                activeHtml += `
                    <tr>
                        <td><strong>${item.title || 'Layanan Mineplix'}</strong></td>
                        <td><code>#${item.productId || item.orderKey.slice(-5)}</code></td>
                        <td>${formatPrice(item.harga)}</td>
                        <td><span class="status-badge ${statusBadgeClass}">${statusStr}</span></td>
                        <td>${formatDate(item.createdAt)}</td>
                        <td>
                            <button class="btn-detail-order" data-key="${item.orderKey}">Detail</button>
                        </td>
                    </tr>
                `;
            });

            activeHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            orderContentActive.innerHTML = activeHtml;
        }
    }

    if (orderContentHistory) {
        if (historyOrders.length === 0) {
            orderContentHistory.innerHTML = `
                <div class="empty-state-card">
                    <h3>Riwayat Pemesanan Kosong</h3>
                    <p>Belum ada riwayat transaksi atau layanan yang telah selesai sebelumnya.</p>
                </div>
            `;
        } else {
            let historyHtml = `
                <div class="orders-table-container">
                    <table class="orders-table">
                        <thead>
                            <tr>
                                <th>Layanan</th>
                                <th>ID Pesanan</th>
                                <th>Harga</th>
                                <th>Status</th>
                                <th>Tanggal</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            historyOrders.forEach((item) => {
                const statusStr = item.status || 'Completed';
                const statusBadgeClass = 'badge-' + statusStr.toLowerCase().replace(/\s+/g, '');

                historyHtml += `
                    <tr>
                        <td><strong>${item.title || 'Layanan Mineplix'}</strong></td>
                        <td><code>#${item.productId || item.orderKey.slice(-5)}</code></td>
                        <td>${formatPrice(item.harga)}</td>
                        <td><span class="status-badge ${statusBadgeClass}">${statusStr}</span></td>
                        <td>${formatDate(item.createdAt)}</td>
                        <td>
                            <button class="btn-detail-order" data-key="${item.orderKey}">Detail</button>
                        </td>
                    </tr>
                `;
            });

            historyHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            orderContentHistory.innerHTML = historyHtml;
        }
    }

    document.querySelectorAll('.btn-detail-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = e.currentTarget.getAttribute('data-key');
            if (ordersData[key]) {
                showOrderDetailModal(ordersData[key]);
            }
        });
    });
}

function showOrderDetailModal(order) {
    const modal = document.getElementById('orderModal');
    const modalTitle = document.getElementById('modalOrderTitle');
    const modalBody = document.getElementById('modalOrderBody');

    if (!modal || !modalBody) return;

    if (modalTitle) modalTitle.textContent = order.title || 'Detail Pemesanan';

    const statusStr = order.status || 'Active';
    const statusBadgeClass = 'badge-' + statusStr.toLowerCase().replace(/\s+/g, '');

    modalBody.innerHTML = `
        <div class="order-detail-group">
            <span class="detail-label">ID Pesanan</span>
            <span class="detail-val">#${order.productId || order.orderKey.slice(-5)}</span>
        </div>
        <div class="order-detail-group">
            <span class="detail-label">Nama Pemesan</span>
            <span class="detail-val">${order.userName || '-'}</span>
        </div>
        <div class="order-detail-group">
            <span class="detail-label">Email Pemesan</span>
            <span class="detail-val">${order.userEmail || '-'}</span>
        </div>
        <div class="order-detail-group">
            <span class="detail-label">Total Harga</span>
            <span class="detail-val" style="color: var(--primary-dark); font-weight: 700;">${formatPrice(order.harga)}</span>
        </div>
        <div class="order-detail-group">
            <span class="detail-label">Status saat ini</span>
            <span class="detail-val"><span class="status-badge ${statusBadgeClass}">${statusStr}</span></span>
        </div>
        <div class="order-detail-group">
            <span class="detail-label">Waktu Pemesanan</span>
            <span class="detail-val">${formatDate(order.createdAt)}</span>
        </div>
    `;

    modal.classList.add('show');
}

const closeOrderModalBtn = document.getElementById('closeOrderModalBtn');
const orderModal = document.getElementById('orderModal');

if (closeOrderModalBtn && orderModal) {
    closeOrderModalBtn.addEventListener('click', () => {
        orderModal.classList.remove('show');
    });

    orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            orderModal.classList.remove('show');
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace('/login/');
    } else {
        const userNameElem = document.getElementById('userName');
        const welcomeUserElem = document.getElementById('welcomeUserName');
        const userEmailElem = document.getElementById('userEmail');

        const name = user.displayName || 'Pengguna Mineplix';
        const email = user.email || '';

        if (userNameElem) userNameElem.textContent = name;
        if (welcomeUserElem) welcomeUserElem.textContent = name;
        if (userEmailElem) userEmailElem.textContent = email;

        if (panelLoader) {
            setTimeout(() => {
                panelLoader.classList.add('hidden');
            }, 400);
        }

        const notifRef = ref(db, 'users/' + user.uid + '/notifications');
        onValue(notifRef, (snapshot) => {
            const data = snapshot.val();
            const notifBody = document.getElementById('notifBody');
            const notifBadge = document.querySelector('.notif-badge');
            if (!notifBody) return;

            if (!data) {
                notifBody.innerHTML = '<div class="notif-item"><div class="notif-desc">Belum ada notifikasi</div></div>';
                if (notifBadge) notifBadge.style.display = 'none';
                return;
            }

            let html = '';
            let hasUnread = false;
            Object.keys(data).forEach((key) => {
                const item = data[key];
                if (!item.read) hasUnread = true;
                html += `
                    <div class="notif-item ${item.read ? '' : 'unread'}">
                        <div class="notif-title">${item.title || 'Notifikasi'}</div>
                        <div class="notif-desc">${item.desc || ''}</div>
                        <div class="notif-time">${item.time || ''}</div>
                    </div>
                `;
            });
            notifBody.innerHTML = html;
            if (notifBadge) {
                notifBadge.style.display = hasUnread ? 'block' : 'none';
            }
        });

        const userOrdersRef = ref(db, 'orders/' + user.uid);
        ordersListener = onValue(userOrdersRef, (snapshot) => {
            const ordersData = snapshot.val();
            renderOrders(ordersData);
        }, (error) => {
            console.error("Gagal mengambil data orderan:", error);
        });
    }
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        if (!auth.currentUser) {
            window.location.replace('/login/');
        } else {
            window.location.reload();
        }
    }
});

window.switchTab = function(tabName, updateHistory = true) {
    const menuDashboard = document.getElementById('menuDashboard');
    const menuOrder = document.getElementById('menuOrder');
    const contentDashboard = document.getElementById('contentDashboard');
    const contentOrder = document.getElementById('contentOrder');

    if (tabName === 'dashboard') {
        if (menuDashboard) menuDashboard.classList.add('active');
        if (menuOrder) menuOrder.classList.remove('active');
        if (contentDashboard) contentDashboard.classList.add('active');
        if (contentOrder) contentOrder.classList.remove('active');
        if (updateHistory) {
            history.pushState({ tab: 'dashboard' }, '', '/panel');
        }
    } else if (tabName === 'order') {
        if (menuOrder) menuOrder.classList.add('active');
        if (menuDashboard) menuDashboard.classList.remove('active');
        if (contentOrder) contentOrder.classList.add('active');
        if (contentDashboard) contentDashboard.classList.remove('active');
        if (updateHistory) {
            history.pushState({ tab: 'order' }, '', '/panel#order');
        }
    }

    if (window.innerWidth <= 768) {
        const panelSidebar = document.getElementById('panelSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (panelSidebar) panelSidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
};

window.addEventListener('popstate', (event) => {
    if (window.location.hash === '#order' || (event.state && event.state.tab === 'order')) {
        window.switchTab('order', false);
    } else {
        window.switchTab('dashboard', false);
    }
});

window.switchOrderSubtab = function(subtabName) {
    const subtabActive = document.getElementById('subtabActive');
    const subtabHistory = document.getElementById('subtabHistory');
    const orderContentActive = document.getElementById('orderContentActive');
    const orderContentHistory = document.getElementById('orderContentHistory');

    if (subtabName === 'active') {
        if (subtabActive) subtabActive.classList.add('active');
        if (subtabHistory) subtabHistory.classList.remove('active');
        if (orderContentHistory) orderContentHistory.classList.remove('active');
        setTimeout(() => {
            if (orderContentActive) orderContentActive.classList.add('active');
        }, 50);
    } else if (subtabName === 'history') {
        if (subtabHistory) subtabHistory.classList.add('active');
        if (subtabActive) subtabActive.classList.remove('active');
        if (orderContentActive) orderContentActive.classList.remove('active');
        setTimeout(() => {
            if (orderContentHistory) orderContentHistory.classList.add('active');
        }, 50);
    }
};

if (window.location.hash === '#order') {
    window.switchTab('order', false);
}

const burgerBtn = document.getElementById('burgerBtn');
const panelSidebar = document.getElementById('panelSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    if (!panelSidebar || !sidebarOverlay) return;
    panelSidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}

if (burgerBtn) {
    burgerBtn.addEventListener('click', toggleSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', toggleSidebar);
}

const notifBtn = document.getElementById('notifBtn');
const notifPopover = document.getElementById('notifPopover');
const settingBtn = document.getElementById('settingBtn');
const profilePopover = document.getElementById('profilePopover');

if (notifBtn && notifPopover) {
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (profilePopover) profilePopover.classList.remove('show');
        notifPopover.classList.toggle('show');
    });
}

if (settingBtn && profilePopover) {
    settingBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notifPopover) notifPopover.classList.remove('show');
        profilePopover.classList.toggle('show');
    });
}

document.addEventListener('click', (e) => {
    if (notifPopover && !notifPopover.contains(e.target) && !notifBtn.contains(e.target)) {
        notifPopover.classList.remove('show');
    }
    if (profilePopover && !profilePopover.contains(e.target) && !settingBtn.contains(e.target)) {
        profilePopover.classList.remove('show');
    }
});

const markReadBtn = document.getElementById('markReadBtn');
const notifBadge = document.querySelector('.notif-badge');

if (markReadBtn) {
    markReadBtn.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            const notifRef = ref(db, 'users/' + user.uid + '/notifications');
            onValue(notifRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const updates = {};
                    Object.keys(data).forEach((key) => {
                        updates[key + '/read'] = true;
                    });
                    update(notifRef, updates);
                }
            }, { onlyOnce: true });
        }
        document.querySelectorAll('.notif-item').forEach(item => {
            item.classList.remove('unread');
        });
        if (notifBadge) notifBadge.style.display = 'none';
    });
}

const serviceCards = document.querySelectorAll('.service-card');

serviceCards.forEach(card => {
    const ripple = card.querySelector('.ripple');

    const setRipplePos = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : rect.width / 2)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : rect.height / 2)) - rect.top;
        if (ripple) {
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
        }
    };

    card.addEventListener('pointerdown', (e) => {
        serviceCards.forEach(c => {
            if (c !== card) c.classList.remove('active-ripple');
        });
        setRipplePos(e);
        card.classList.add('active-ripple');
    });
});

document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.service-card')) {
        serviceCards.forEach(c => c.classList.remove('active-ripple'));
    }
});

const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.replace('/login/');
        } catch (error) {
            alert("Terjadi kesalahan saat keluar. Silakan coba lagi.");
        }
    });
}
