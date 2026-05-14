// Fungsi Utama Memulai Musik
function startMusic() {
    const music = document.getElementById('bgMusic');
    const control = document.getElementById('music-control');
    if (music && music.paused) {
        music.play().then(() => {
            if (control) control.classList.add('playing');
        }).catch(err => console.log("Menunggu interaksi nyata untuk memutar musik..."));
    }
}

// Fungsi Scroll & Musik
function scrollToNext() {
    // Aktifkan scroll
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
    
    // Pastikan musik berputar
    startMusic();
    
    // Beri sedikit jeda agar browser merender ulang overflow sebelum scroll
    setTimeout(() => {
        const nextSection = document.querySelector('.prayer');
        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        }
    }, 50);
}

// Toggle Play/Pause Musik
function toggleMusic() {
    const music = document.getElementById('bgMusic');
    const control = document.getElementById('music-control');
    
    if (music.paused) {
        music.play();
        control.classList.add('playing');
        control.classList.remove('paused');
    } else {
        music.pause();
        control.classList.remove('playing');
        control.classList.add('paused');
    }
}

// Countdown Timer
const targetDate = new Date("Jun 5, 2026 14:00:00").getTime();

setInterval(() => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    document.getElementById("days").innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
    document.getElementById("hours").innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    document.getElementById("minutes").innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
}, 1000);

// Animasi Fade-in berurutan (Stagger) menggunakan Intersection Observer
document.addEventListener("DOMContentLoaded", () => {
    const pages = document.querySelectorAll('.page');
    
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, observerOptions);

    // Otomatis mencari semua elemen teks & karakter penting di tiap halaman
    pages.forEach(page => {
        const elements = page.querySelectorAll('h1, h2, h3, p, button, .time-box, .story-item, .person, .ampersand, .event-card, .bank-card, hr, a, .rsvp-form');
        elements.forEach((el, index) => {
            // Khusus untuk foto mempelai, gunakan animasi zoom-in
            if (el.classList.contains('person')) {
                const photo = el.querySelector('.couple-photo');
                if (photo) {
                    photo.classList.add('zoom-in');
                    observer.observe(photo);
                }
            }
            
            el.classList.add('fade-in');
            el.style.transitionDelay = `${index * 0.15}s`;
            observer.observe(el);
        });
    });
});

// Google Sheets RSVP Form Submission
const scriptURL = 'https://script.google.com/macros/s/AKfycbyUFBoXohmFTNQYVJnJg4oAk-pO6NtYHpLQoE19r_NlbvEdVCw04IbSesN9oNNtLPADiw/exec';
const rsvpForm = document.getElementById('rsvpForm');
const submitBtn = document.getElementById('submitBtn');

if (rsvpForm) {
    rsvpForm.addEventListener('submit', e => {
        e.preventDefault();
        
        // Ubah state tombol saat loading
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Mengirim...';
        submitBtn.disabled = true;

        fetch(scriptURL, { method: 'POST', body: new FormData(rsvpForm)})
            .then(response => {
                console.log('Success!', response);
                alert('Terima kasih! RSVP Anda telah berhasil dikirim.');
                
                // Tambahkan komentar secara dinamis ke tampilan
                const formData = new FormData(rsvpForm);
                const nama = formData.get('nama');
                const kehadiran = formData.get('kehadiran');
                const pesan = formData.get('pesan');
                
                if (pesan && pesan.trim() !== '') {
                    const commentsContainer = document.getElementById('commentsContainer');
                    const newComment = document.createElement('div');
                    newComment.className = 'comment-box fade-in visible';
                    
                    const badgeText = kehadiran === 'hadir' ? 'Hadir' : (kehadiran === 'tidak' ? 'Tidak Hadir' : 'Pending');
                    
                    newComment.innerHTML = `
                        <p class="comment-name">${nama || 'Tamu'} <span class="comment-badge">${badgeText}</span></p>
                        <p class="comment-text">${pesan}</p>
                    `;
                    
                    // Masukkan di urutan paling atas
                    commentsContainer.insertBefore(newComment, commentsContainer.firstChild);
                }

                rsvpForm.reset();
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error!', error.message);
                alert('Maaf, terjadi kesalahan saat mengirim RSVP. Silakan coba lagi.');
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            });
    });
}

// Ambil data komentar dari Google Sheet saat halaman dimuat (selalu ambil yang terbaru)
fetch(scriptURL + "?t=" + new Date().getTime())
    .then(response => response.json())
    .then(data => {
        const commentsContainer = document.getElementById('commentsContainer');
        // Hapus teks loading
        const loadingText = document.getElementById('loadingComments');
        if (loadingText) loadingText.remove();
        
        if (Array.isArray(data) && data.length > 0) {
            // Tampilkan dari yang terbaru (asumsi baris terbaru ada di bawah/akhir array)
            data.reverse().forEach(item => {
                // Antisipasi perbedaan huruf besar/kecil dari header spreadsheet
                const guestName = item.nama || item.Nama || item.NAMA || 'Tamu';
                
                // Cari pesan di kolom pesan, komentar, atau jumlah (jika urutan kolom terbalik)
                let guestMessage = item.pesan || item.komentar || item.Pesan || item.Komentar || '';
                if (!guestMessage && item.jumlah && isNaN(item.jumlah)) {
                    guestMessage = item.jumlah; // Menangkap error urutan kolom di mana teks masuk ke 'jumlah'
                }
                
                const guestPresence = item.kehadiran || item.Kehadiran || item.KEHADIRAN || '';
                
                if (guestMessage.trim() !== '') {
                    const newComment = document.createElement('div');
                    newComment.className = 'comment-box fade-in visible';
                    
                    let badgeText = 'Pending';
                    if (guestPresence.toLowerCase() === 'hadir') badgeText = 'Hadir';
                    else if (guestPresence.toLowerCase() === 'tidak' || guestPresence.toLowerCase() === 'tidak hadir') badgeText = 'Tidak Hadir';
                    
                    newComment.innerHTML = `
                        <p class="comment-name">${guestName} <span class="comment-badge">${badgeText}</span></p>
                        <p class="comment-text">${guestMessage}</p>
                    `;
                    commentsContainer.appendChild(newComment);
                }
            });
        }
        
        // Jika tidak ada komentar sama sekali setelah difilter
        if (commentsContainer.children.length === 0) {
            commentsContainer.innerHTML = '<p style="text-align: center; font-size: 0.9em; opacity: 0.7;">Jadilah yang pertama memberikan ucapan!</p>';
        }
    })
    .catch(error => {
        console.log("Info: Gagal mengambil data komentar. Pastikan Google Script Anda memiliki fungsi doGet() yang mengembalikan JSON.", error);
        const loadingText = document.getElementById('loadingComments');
        if (loadingText) {
            loadingText.innerText = 'Belum ada komentar (atau Google Script belum diatur untuk menampilkan data).';
        }
    });

// Fitur Kepada Yth: Menampilkan Nama Tamu dari URL dan mengisi otomatis di form RSVP
// Contoh penggunaan link saat membagikan undangan: index.html?to=Budi%20Santoso
const urlParams = new URLSearchParams(window.location.search);
const guestNameFromUrl = urlParams.get('to') || urlParams.get('nama');

if (guestNameFromUrl) {
    // 1. Tampilkan di Halaman Cover
    const guestNameDisplay = document.getElementById('guestNameDisplay');
    if (guestNameDisplay) {
        guestNameDisplay.innerText = guestNameFromUrl;
    }
    
    // 2. Isi otomatis di form RSVP
    const rsvpNamaInput = document.getElementById('rsvpNama');
    if (rsvpNamaInput) {
        rsvpNamaInput.value = guestNameFromUrl;
        // Opsional: Tambahkan kode di bawah jika nama ingin dikunci (tidak bisa diedit)
        // rsvpNamaInput.readOnly = true; 
    }
}

// Fungsi untuk menyalin nomor rekening (Wedding Gift)
function copyRekening(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btnElement.innerText;
        btnElement.innerText = 'Berhasil Disalin!';
        btnElement.style.backgroundColor = '#2a2a2a'; // Sesuai tema gelap
        btnElement.style.color = '#ffffff';
        
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.backgroundColor = '#ffffff';
            btnElement.style.color = '#000000';
        }, 2000);
    }).catch(err => {
        console.error('Gagal menyalin teks: ', err);
        alert('Gagal menyalin nomor rekening. Silakan salin manual.');
    });
}

// Fitur Sembunyikan Menu Bawah di Halaman Cover
const bottomMenu = document.querySelector('.bottom-menu');
const coverSection = document.querySelector('.cover');

if (bottomMenu && coverSection) {
    // Gunakan IntersectionObserver agar lebih akurat mendeteksi perpindahan halaman (terutama pada scroll-snap)
    const menuObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Jika halaman cover sudah tidak mendominasi layar (kurang dari 10% terlihat)
            if (!entry.isIntersecting) {
                bottomMenu.classList.add('show');
            } else {
                bottomMenu.classList.remove('show');
            }
        });
    }, { 
        threshold: 0.1 // Pemicu saat hanya 10% halaman cover yang tersisa di layar
    });

    menuObserver.observe(coverSection);
}

// Mencoba Autoplay Musik saat halaman dimuat
window.addEventListener('load', () => {
    const music = document.getElementById('bgMusic');
    if (music) {
        console.log("Mencoba memulai musik...");
        music.play().then(() => {
            console.log("Autoplay berhasil!");
            document.getElementById('music-control').classList.add('playing');
        }).catch(err => {
            console.warn("Autoplay diblokir browser, menunggu interaksi user.");
        });
        
        const interactionStart = () => {
            startMusic();
            ['click', 'touchstart', 'mousedown', 'keydown', 'scroll'].forEach(e => document.removeEventListener(e, interactionStart));
        };
        ['click', 'touchstart', 'mousedown', 'keydown', 'scroll'].forEach(e => document.addEventListener(e, interactionStart));
    }
});