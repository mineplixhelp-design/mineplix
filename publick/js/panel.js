import { auth, signOut, onAuthStateChanged, db } from './firebase.js';
import { ref, onValue, update, push, set } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const panelLoader = document.getElementById('panelLoader');
let currentUserRole = 'user';
let activeSelectedOrderId = null;
let activeSelectedOrderUserId = null;

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

function renderOrderCards(ordersData, isViewerAdmin) {
    const container = document.getElementById('orderCardsContainer');
    if (!container) return;

    if (!ordersData) {
        container.innerHTML = `
            <div class="empty-state-card">
                <h3>Belum Ada Orderan</h3>
                <p>Belum ada data pemesanan saat ini.</p>
                ${!isViewerAdmin ? '<div class="btn-primary-panel" onclick="window.location.href=\'/produk\'">Pesan Layanan Sekarang</div>' : ''}
            </div>
        `;
        return;
    }

    let allOrdersList = [];

    if (isViewerAdmin) {
        Object.keys(ordersData).forEach((userId) => {
            const userOrders = ordersData[userId];
            if (userOrders) {
                Object.keys(userOrders).forEach((orderId) => {
                    allOrdersList.push({
                        userId: userId,
                        orderId: orderId,
                        ...userOrders[orderId]
                    });
                });
            }
        });
    } else {
        Object.keys(ordersData).forEach((orderId) => {
            allOrdersList.push({
                orderId: orderId,
                ...ordersData[orderId]
            });
        });
    }

    if (allOrdersList.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card">
                <h3>Belum Ada Orderan</h3>
                <p>Belum ada data pemesanan saat ini.</p>
                ${!isViewerAdmin ? '<div class="btn-primary-panel" onclick="window.location.href=\'/produk\'">Pesan Layanan Sekarang</div>' : ''}
            </div>
        `;
        return;
    }

    allOrdersList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    let html = '<div class="order-cards-grid">';

    allOrdersList.forEach((item) => {
        const status = item.status || 'Menunggu Konfirmasi';
        const formattedPrice = formatPrice(item.harga);
        const dateStr = formatDate(item.createdAt);
        const orderCode = item.productId || item.orderId.slice(-5);

        let statusBadgeClass = 'badge-pending';
        let stepInfoHtml = '';

        if (status.toLowerCase().includes('menunggu')) {
            statusBadgeClass = 'badge-pending';
            stepInfoHtml = `
                <div class="order-step-box info-box">
                    <strong>⏳ Status: Menunggu Konfirmasi Admin</strong>
                    <p>Pesanan Anda telah diterima dan sedang diperiksa oleh admin kami.</p>
                </div>
            `;
        } else if (status.toLowerCase().includes('qris') || status.toLowerCase().includes('bayar')) {
            statusBadgeClass = 'badge-qris';
            stepInfoHtml = `
                <div class="order-step-box qris-box">
                    <strong>📲 Silakan Lakukan Pembayaran QRIS</strong>
                    <p>Total Tagihan: <span style="font-weight:700; color:var(--primary-dark);">${formattedPrice}</span></p>
                    <div class="qris-preview-placeholder">[ QRIS Code / Informasi Rekening Mineplix ]</div>
                    <p style="font-size: 0.8rem; margin-top:4px;">Bayar sesuai dengan harga tertera agar dapat segera dikonfirmasi.</p>
                </div>
            `;
        } else if (status.toLowerCase().includes('pengerjaan') || status.toLowerCase().includes('diproses')) {
            statusBadgeClass = 'badge-process';
            stepInfoHtml = `
                <div class="order-step-box process-box">
                    <strong>⚙️ Pembayaran Dikonfirmasi & Pengerjaan</strong>
                    <p>Pembayaran diterima. Tim Mineplix sedang mengerjakan project Anda.</p>
                </div>
            `;
        } else if (status.toLowerCase().includes('selesai') || status.toLowerCase().includes('completed')) {
            statusBadgeClass = 'badge-completed';
            stepInfoHtml = `
                <div class="order-step-box done-box">
                    <strong>✅ Selesai</strong>
                    <p>Project telah selesai dikerjakan!</p>
                    ${item.productLink ? `<a href="${item.productLink}" target="_blank" class="btn-download-link">🔗 Akses / Download Link Produk</a>` : ''}
                </div>
            `;
        }

        let adminActionHtml = '';
        if (isViewerAdmin) {
            adminActionHtml = `
                <div class="admin-action-bar">
                    <span style="font-size:0.8rem; color:var(--text-muted);">Aksi Admin:</span>
                    <div class="admin-btn-group">
                        <button class="admin-step-btn" onclick="updateOrderStatus('${item.userId}', '${item.orderId}', 'Menunggu Pembayaran (QRIS)')">Kirim QRIS</button>
                        <button class="admin-step-btn" onclick="updateOrderStatus('${item.userId}', '${item.orderId}', 'Pengerjaan Berlangsung')">Proses / Pengerjaan</button>
                        <button class="admin-step-btn btn-done-action" onclick="openLinkModal('${item.userId}', '${item.orderId}')">Selesai & Kirim Link</button>
                    </div>
                </div>
            `;
        }

        html += `
            <div class="order-item-card">
                <div class="order-card-top-info">
                    <div>
                        <h3 class="order-item-title">${item.title || 'Layanan Mineplix'}</h3>
                        <span class="order-item-id">ID: #${orderCode} ${isViewerAdmin ? `| User: ${item.userEmail || item.userName || item.userId}` : ''}</span>
                    </div>
                    <span class="status-badge ${statusBadgeClass}">${status}</span>
                </div>
                <div class="order-card-middle">
                    <div class="order-meta-info">
                        <span>Harga: <strong>${formattedPrice}</strong></span>
                        <span>Waktu: ${dateStr}</span>
                    </div>
                    ${stepInfoHtml}
                </div>
                ${adminActionHtml}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

window.updateOrderStatus = async function(userId, orderId, newStatus) {
    try {
        const orderRef = ref(db, 'orders/' + userId + '/' + orderId);
        await update(orderRef, { status: newStatus });
        alert("Status order berhasil diperbarui menjadi: " + newStatus);
    } catch (error) {
        alert("Gagal memperbarui status: " + error.message);
    }
};

window.openLinkModal = function(userId, orderId) {
    activeSelectedUserId = userId;
    activeSelectedOrderId = orderId;
    const modal = document.getElementById('linkModal');
    const input = document.getElementById('productLinkInput');
    if (input) input.value = '';
    if (modal) modal.classList.add('show');
};

const closeLinkModalBtn = document.getElementById('closeLinkModalBtn');
const linkModal = document.getElementById('linkModal');
if (closeLinkModalBtn && linkModal) {
    closeLinkModalBtn.addEventListener('click', () => {
        linkModal.classList.remove('show');
    });
    linkModal.addEventListener('click', (e) => {
        if (e.target === linkModal) {
            linkModal.classList.remove('show');
        }
    });
}

const confirmDoneBtn = document.getElementById('confirmDoneBtn');
if (confirmDoneBtn) {
    confirmDoneBtn.addEventListener('click', async () => {
        const linkInput = document.getElementById('productLinkInput');
        const linkVal = linkInput ? linkInput.value.trim() : '';
        if (!linkVal) {
            alert("Masukkan link produk atau hasil pengerjaan terlebih dahulu.");
            return;
        }
        try {
            const orderRef = ref(db, 'orders/' + activeSelectedUserId + '/' + activeSelectedOrderId);
            await update(orderRef, {
                status: 'Selesai',
                productLink: linkVal
            });
            linkModal.classList.remove('show');
            alert("Pesanan diselesaikan dan link berhasil dikirim ke user!");
        } catch (error) {
            alert("Gagal menyelesaikan pesanan: " + error.message);
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

        const userRef = ref(db, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.role === 'admin') {
                currentUserRole = 'admin';
                const menuBroadcast = document.getElementById('menuBroadcast');
                if (menuBroadcast) menuBroadcast.style.display = 'flex';

                const orderHeaderTitle = document.getElementById('orderHeaderTitle');
                const orderHeaderDesc = document.getElementById('orderHeaderDesc');
                if (orderHeaderTitle) orderHeaderTitle.textContent = 'Kelola Semua Orderan (Admin)';
                if (orderHeaderDesc) orderHeaderDesc.textContent = 'Pantau dan perbarui langkah status pesanan dari seluruh pengguna.';

                const allOrdersRef = ref(db, 'orders');
                onValue(allOrdersRef, (orderSnap) => {
                    renderOrderCards(orderSnap.val(), true);
                });
            } else {
                currentUserRole = 'user';
                const userOrdersRef = ref(db, 'orders/' + user.uid);
                onValue(userOrdersRef, (orderSnap) => {
                    renderOrderCards(orderSnap.val(), false);
                });
            }

            if (panelLoader) {
                setTimeout(() => {
                    panelLoader.classList.add('hidden');
                }, 400);
            }
        }, { onlyOnce: true });

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
    }
});

const sendBroadcastBtn = document.getElementById('sendBroadcastBtn');
if (sendBroadcastBtn) {
    sendBroadcastBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('broadcastTitle');
        const descInput = document.getElementById('broadcastDesc');
        const title = titleInput ? titleInput.value.trim() : '';
        const desc = descInput ? descInput.value.trim() : '';

        if (!title || !desc) {
            alert("Judul dan isi notifikasi tidak boleh kosong.");
            return;
        }

        try {
            const usersRef = ref(db, 'users');
            onValue(usersRef, async (snapshot) => {
                const usersData = snapshot.val();
                if (!usersData) return;

                const timeStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                for (const uid of Object.keys(usersData)) {
                    const userNotifRef = ref(db, 'users/' + uid + '/notifications');
                    const newNotifRef = push(userNotifRef);
                    await set(newNotifRef, {
                        title: title,
                        desc: desc,
                        time: timeStr,
                        read: false
                    });
                }

                alert("Notifikasi broadcast berhasil dikirim ke semua pengguna!");
                if (titleInput) titleInput.value = '';
                if (descInput) descInput.value = '';
            }, { onlyOnce: true });
        } catch (error) {
            alert("Gagal mengirim broadcast: " + error.message);
        }
    });
}

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
    const menuBroadcast = document.getElementById('menuBroadcast');

    const contentDashboard = document.getElementById('contentDashboard');
    const contentOrder = document.getElementById('contentOrder');
    const contentBroadcast = document.getElementById('contentBroadcast');

    if (menuDashboard) menuDashboard.classList.remove('active');
    if (menuOrder) menuOrder.classList.remove('active');
    if (menuBroadcast) menuBroadcast.classList.remove('active');

    if (contentDashboard) contentDashboard.classList.remove('active');
    if (contentOrder) contentOrder.classList.remove('active');
    if (contentBroadcast) contentBroadcast.classList.remove('active');

    if (tabName === 'dashboard') {
        if (menuDashboard) menuDashboard.classList.add('active');
        if (contentDashboard) contentDashboard.classList.add('active');
        if (updateHistory) history.pushState({ tab: 'dashboard' }, '', '/panel');
    } else if (tabName === 'order') {
        if (menuOrder) menuOrder.classList.add('active');
        if (contentOrder) contentOrder.classList.add('active');
        if (updateHistory) history.pushState({ tab: 'order' }, '', '/panel#order');
    } else if (tabName === 'broadcast') {
        if (menuBroadcast) menuBroadcast.classList.add('active');
        if (contentBroadcast) contentBroadcast.classList.add('active');
        if (updateHistory) history.pushState({ tab: 'broadcast' }, '', '/panel#broadcast');
    }

    if (window.innerWidth <= 768) {
        const panelSidebar = document.getElementById('panelSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (panelSidebar) panelSidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
};

window.addEventListener('popstate', (event) => {
    if (window.location.hash === '#order') {
        window.switchTab('order', false);
    } else if (window.location.hash === '#broadcast') {
        window.switchTab('broadcast', false);
    } else {
        window.switchTab('dashboard', false);
    }
});

if (window.location.hash === '#order') {
    window.switchTab('order', false);
} else if (window.location.hash === '#broadcast') {
    window.switchTab('broadcast', false);
}

const burgerBtn = document.getElementById('burgerBtn');
const panelSidebar = document.getElementById('panelSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    if (!panelSidebar || !sidebarOverlay) return;
    panelSidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}

if (burgerBtn) burgerBtn.addEventListener('click', toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

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
