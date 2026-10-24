import { auth, signOut, onAuthStateChanged } from './firebase.js';

const panelLoader = document.getElementById('panelLoader');

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/login';
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
            }, 500);
        }
    }
});

window.switchTab = function(tabName, updateHistory = true) {
    const menuDashboard = document.getElementById('menuDashboard');
    const menuOrder = document.getElementById('menuOrder');
    const contentDashboard = document.getElementById('contentDashboard');
    const contentOrder = document.getElementById('contentOrder');

    if (tabName === 'dashboard') {
        menuDashboard.classList.add('active');
        menuOrder.classList.remove('active');
        contentDashboard.classList.add('active');
        contentOrder.classList.remove('active');
        if (updateHistory) {
            history.pushState({ tab: 'dashboard' }, '', '/panel');
        }
    } else if (tabName === 'order') {
        menuOrder.classList.add('active');
        menuDashboard.classList.remove('active');
        contentOrder.classList.add('active');
        contentDashboard.classList.remove('active');
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
        subtabActive.classList.add('active');
        subtabHistory.classList.remove('active');
        orderContentActive.classList.add('active');
        orderContentHistory.classList.remove('active');
    } else if (subtabName === 'history') {
        subtabHistory.classList.add('active');
        subtabActive.classList.remove('active');
        orderContentHistory.classList.add('active');
        orderContentActive.classList.remove('active');
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
            window.location.href = '/login';
        } catch (error) {
            console.error("Gagal melakukan logout:", error);
            alert("Terjadi kesalahan saat keluar. Silakan coba lagi.");
        }
    });
}