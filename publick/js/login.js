import { auth, provider, signInWithPopup, onAuthStateChanged, db } from './firebase.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

let isRedirecting = false;

async function checkAndRedirectUser(user) {
    if (isRedirecting) return;
    isRedirecting = true;

    const loginBtnText = document.getElementById('loginBtnText');
    if (loginBtnText) loginBtnText.textContent = "Memproses...";

    try {
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

        let role = 'user';

        if (!snapshot.exists()) {
            // Jika user baru pertama kali login, daftarkan sebagai 'user'
            await set(userRef, {
                name: user.displayName || 'Pengguna Mineplix',
                email: user.email,
                role: 'user',
                notifications: {
                    welcome: {
                        title: "Selamat Datang di Mineplix!",
                        desc: "Akun Anda berhasil terhubung melalui Google. Untuk melihat produk orderan silahkan klik orderan card yah!",
                        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                        read: false
                    }
                }
            });
        } else {
            const userData = snapshot.val();
            if (userData.role) {
                role = userData.role;
            }
        }
        
        // Cek Role: Jika admin masuk ke /panel, jika user kembali ke halaman sebelumnya
        if (role === 'admin') {
            window.location.replace('/panel');
        } else {
            if (window.history.length > 1 && document.referrer && !document.referrer.includes('/login')) {
                window.history.back();
            } else {
                window.location.replace('/');
            }
        }
    } catch (error) {
        console.error("Gagal mendeteksi database user:", error);
        window.location.replace('/');
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        checkAndRedirectUser(user);
    }
});

const googleLoginBtn = document.getElementById('googleLoginBtn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        if (isRedirecting) return;
        
        try {
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                await checkAndRedirectUser(result.user);
            }
        } catch (error) {
            console.error("Gagal melakukan login Google:", error);
            isRedirecting = false;
            const loginBtnText = document.getElementById('loginBtnText');
            if (loginBtnText) loginBtnText.textContent = "Masuk dengan Google";
            
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("Terjadi kesalahan saat mencoba masuk. Silakan coba lagi.");
            }
        }
    });
}
