import { auth, provider, signInWithPopup, onAuthStateChanged, db } from './firebase.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

async function checkAndRedirectUser(user) {
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
                        desc: "Akun Anda berhasil terhubung melalui Google. untuk melihat produk orderan silahkan klik orderan card yah!",
                        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                        read: false
                    }
                }
            });
            window.location.href = '/panel';
        } else {
            const userData = snapshot.val();
            if (userData.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/panel';
            }
        }
    } catch (error) {
        console.error("Gagal mendeteksi role database:", error);
        window.location.href = '/panel';
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
        try {
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                await checkAndRedirectUser(result.user);
            }
        } catch (error) {
            console.error("Gagal melakukan login Google:", error);
            alert("Terjadi kesalahan saat mencoba masuk. Silakan coba lagi.");
        }
    });
}
