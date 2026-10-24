const menuToggle = document.getElementById('menuToggle');
const mobileDrawer = document.getElementById('mobileDrawer');

function toggleMobileMenu() {
    if (!mobileDrawer || !menuToggle) return;
    const isOpen = mobileDrawer.classList.toggle('active');
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        menuToggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
    } else {
        document.body.style.overflow = '';
        menuToggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2z"/></svg>`;
    }
}

if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });
}

const mobileLayananToggle = document.getElementById('mobileLayananToggle');
const mobileLayananMenu = document.getElementById('mobileLayananMenu');

if (mobileLayananToggle && mobileLayananMenu) {
    mobileLayananToggle.addEventListener('click', () => {
        mobileLayananMenu.classList.toggle('show');
        mobileLayananToggle.classList.toggle('active');
    });
}

const faqQuestions = document.querySelectorAll('.faq-q');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
            }
        });

        faqItem.classList.toggle('active');
    });
});

const serviceCards = document.querySelectorAll('.card');

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
    if (!e.target.closest('.card')) {
        serviceCards.forEach(c => c.classList.remove('active-ripple'));
    }
});

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observerInstance.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-up, .fade-in, .scale-in, .slide-line').forEach(element => {
    observer.observe(element);
});
