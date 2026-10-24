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

        if (!snapshot.exists()) {
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
        }
        
        window.location.replace('/panel');
    } catch (error) {
        console.error("Gagal mendeteksi database user:", error);
        window.location.replace('/panel');
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
