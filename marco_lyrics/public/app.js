// ═══════════════════════════════════════════════════════════
//  MARCO-XMD — Marco Lyrics
// ═══════════════════════════════════════════════════════════

let currentLyrics = null;

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('marco-theme', next);
}

function toast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.className = 'toast ' + type, 2500);
}

function quickSearch(query) {
    document.getElementById('searchInput').value = query;
    searchLyrics();
}

function formatViews(n) {
    if (!n || n < 0) return '';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B vues';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M vues';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K vues';
    return n + ' vues';
}

// Construit le texte final stylisé
function buildFormattedLyrics(data) {
    const v = data.video || {};
    const lines = [];

    lines.push('𝐌𝐚𝐫𝐜𝐨_𝐋𝐲𝐫𝐢𝐜𝐬');
    lines.push('');
    lines.push(`🎵 ${v.title || data.query}`);
    if (v.artist) lines.push(`👤 ${v.artist}`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    if (data.lyrics) {
        lines.push(data.lyrics);
    } else {
        lines.push('❌ Paroles introuvables pour cette chanson.');
        lines.push('');
        lines.push('Essayez avec un autre titre ou vérifiez l\'orthographe.');
    }
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('by Marco_Project');

    return lines.join('\n');
}

async function searchLyrics() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();
    if (!query) return toast('Entrez un titre de chanson', 'error');

    const btn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('lyricsResult');
    const errorBox = document.getElementById('errorBox');

    result.classList.remove('show');
    errorBox.classList.remove('show');
    loading.classList.add('show');
    btn.disabled = true;
    currentLyrics = null;

    try {
        const res = await fetch(`/api/lyrics/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Aucune parole trouvée');

        const v = data.video || {};

        // Sauvegarder pour copie/téléchargement/partage
        currentLyrics = {
            query: data.query,
            title: v.title || data.query,
            artist: v.artist || '',
            thumbnail: v.thumbnail || '',
            duration: v.duration || '',
            views: v.views || 0,
            url: v.url || '',
            lyrics: data.lyrics || '',
            hasLyrics: !!data.lyrics,
            source: data.source || '',
            formatted: buildFormattedLyrics(data)
        };

        // ── Affichage ──
        const thumbEl = document.getElementById('lyricsThumb');
        const thumbWrap = document.getElementById('lyricsThumbWrap');

        if (currentLyrics.thumbnail) {
            thumbEl.src = currentLyrics.thumbnail;
            thumbWrap.style.display = 'block';
        } else {
            thumbWrap.style.display = 'none';
        }

        document.getElementById('lyricsTitle').textContent = currentLyrics.title;
        document.getElementById('lyricsArtist').textContent = currentLyrics.artist || '—';

        // Meta vidéo (durée + vues)
        const metaVideo = document.getElementById('lyricsVideoMeta');
        const parts = [];
        if (currentLyrics.duration) parts.push(`⏱ ${currentLyrics.duration}`);
        if (currentLyrics.views) parts.push(`👀 ${formatViews(currentLyrics.views)}`);
        metaVideo.textContent = parts.join(' · ');
        metaVideo.style.display = parts.length ? 'block' : 'none';

        // Meta paroles
        if (currentLyrics.hasLyrics) {
            document.getElementById('lyricsMeta').textContent =
                `${currentLyrics.lyrics.length} caractères · ${currentLyrics.lyrics.split('\n').length} lignes`;
        } else {
            document.getElementById('lyricsMeta').textContent = '';
        }

        // Contenu paroles
        const lyricsContentEl = document.getElementById('lyricsContent');
        if (currentLyrics.hasLyrics) {
            lyricsContentEl.textContent = data.lyrics;
            lyricsContentEl.classList.remove('no-lyrics');
        } else {
            lyricsContentEl.innerHTML = `
                <div class="no-lyrics-msg">
                    <i class="fas fa-search-minus"></i>
                    <div class="no-lyrics-title">Paroles introuvables</div>
                    <div class="no-lyrics-text">
                        Nous n'avons pas trouvé les paroles pour cette chanson.<br>
                        Essayez avec un autre titre ou vérifiez l'orthographe.
                    </div>
                </div>`;
            lyricsContentEl.classList.add('no-lyrics');
        }

        result.classList.add('show');

        if (currentLyrics.hasLyrics) {
            toast('✅ Paroles trouvées !', 'success');
        } else {
            toast('⚠️ Chanson trouvée, paroles introuvables', 'error');
        }

        setTimeout(() => {
            result.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    } catch (err) {
        document.getElementById('errorMsg').textContent = err.message || 'Erreur inconnue';
        errorBox.classList.add('show');
        toast(err.message, 'error');
    } finally {
        loading.classList.remove('show');
        btn.disabled = false;
    }
}

function copyLyrics() {
    if (!currentLyrics) return;
    navigator.clipboard.writeText(currentLyrics.formatted).then(() => {
        toast('📋 Copié !', 'success');
    }).catch(() => toast('Impossible de copier', 'error'));
}

function downloadLyrics() {
    if (!currentLyrics) return;
    const blob = new Blob([currentLyrics.formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeName = currentLyrics.title.replace(/[^\w\s-]/g, '').substring(0, 50) || 'marco_lyrics';
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('📥 Téléchargement lancé...', 'success');
}

function shareWhatsApp() {
    if (!currentLyrics) return;
    const url = `https://wa.me/?text=${encodeURIComponent(currentLyrics.formatted)}`;
    window.open(url, '_blank');
    toast('📱 Ouverture de WhatsApp...', 'success');
}

// Recherche auto si ?q= dans l'URL
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
        document.getElementById('searchInput').value = q;
        setTimeout(searchLyrics, 300);
    }
});
