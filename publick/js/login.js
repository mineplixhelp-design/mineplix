import { auth, provider, signInWithPopup, onAuthStateChanged } from './firebase.js';

// Cek apakah user sudah login, jika sudah langsung arahkan ke /panel
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = '/panel';
    }
});

// Event listener tombol login Google dengan penanganan aman
const googleLoginBtn = document.getElementById('googleLoginBtn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                window.location.href = '/panel';
            }
        } catch (error) {
            console.error("Gagal melakukan login Google:", error);
            alert("Terjadi kesalahan saat mencoba masuk. Silakan coba lagi.");
        }
    });
}