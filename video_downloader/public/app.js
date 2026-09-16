// ═══════════════════════════════════════════════════════════
//  MARCO-XMD — Video Downloader (Option C : temporaire)
// ═══════════════════════════════════════════════════════════

let currentVideo = null;
let currentDownload = null;

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

function detectPlatform(url) {
    if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
    if (/facebook\.com|fb\.watch/i.test(url)) return 'facebook';
    if (/instagram\.com/i.test(url)) return 'instagram';
    if (/tiktok\.com/i.test(url)) return 'tiktok';
    return null;
}

async function analyzeVideo() {
    const url = document.getElementById('videoUrl').value.trim();
    if (!url) return toast('Veuillez coller un lien', 'error');
    if (!detectPlatform(url)) return toast('Plateforme non supportée', 'error');

    // Cacher les résultats précédents
    document.getElementById('downloadResult').classList.remove('show');
    if (currentDownload) {
        fetch(`/api/video/${currentDownload.token}`, { method: 'DELETE' }).catch(() => {});
        currentDownload = null;
    }

    document.getElementById('loading').classList.add('show');
    document.getElementById('videoResult').classList.remove('show');
    document.getElementById('analyzeBtn').disabled = true;

    try {
        const res = await fetch(`/api/video/info?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Impossible d\'analyser la vidéo');
        }
        const data = await res.json();

        document.getElementById('videoThumb').style.display = '';
        document.getElementById('videoThumb').src = data.thumbnail || '';
        document.getElementById('videoTitle').textContent = data.title || 'Vidéo';
        document.getElementById('videoDuration').textContent = data.duration || '—';
        document.getElementById('videoViews').textContent = data.views || '—';
        document.getElementById('videoAuthor').textContent = data.author || '—';

        currentVideo = data;
        document.getElementById('videoResult').classList.add('show');
        toast('Vidéo analysée !', 'success');

        // Scroll vers le résultat
        setTimeout(() => {
            document.getElementById('videoResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    } catch (err) {
        toast(err.message, 'error');
    } finally {
        document.getElementById('loading').classList.remove('show');
        document.getElementById('analyzeBtn').disabled = false;
    }
}

async function downloadVideo(format, quality) {
    if (!currentVideo) return toast('Analysez d\'abord la vidéo', 'error');

    const url = document.getElementById('videoUrl').value.trim();

    // Afficher un message de chargement
    const dlResult = document.getElementById('downloadResult');
    dlResult.classList.remove('show');
    document.getElementById('loading').classList.add('show');
    document.querySelector('#loading p').textContent = `Téléchargement en cours (${format.toUpperCase()} ${quality})... Ceci peut prendre quelques instants.`;

    try {
        const res = await fetch(`/api/video/download?url=${encodeURIComponent(url)}&format=${format}&quality=${quality}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Échec du téléchargement');
        }
        const data = await res.json();

        currentDownload = {
            token: data.token,
            ext: data.ext,
            size: data.size,
            streamUrl: data.streamUrl,
            downloadUrl: data.downloadUrl,
            format
        };

        // Préparer le lecteur selon le format
        const playerWrap = document.getElementById('dlPlayerWrap');
        const sizeMb = (data.size / 1024 / 1024).toFixed(2);
        const isAudio = format === 'mp3';

        if (isAudio) {
            playerWrap.innerHTML = `<audio id="dlPlayer" controls preload="metadata" src="${data.streamUrl}"></audio>`;
        } else {
            playerWrap.innerHTML = `<video id="dlPlayer" controls playsinline preload="metadata" src="${data.streamUrl}"></video>`;
        }

        document.getElementById('dlMeta').textContent = `📁 ${sizeMb} MB · ${data.ext.toUpperCase()} · Fichier temporaire`;

        dlResult.classList.add('show');
        document.getElementById('loading').classList.remove('show');

        setTimeout(() => {
            dlResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);

        toast('✅ Téléchargement prêt !', 'success');
    } catch (err) {
        document.getElementById('loading').classList.remove('show');
        toast(err.message, 'error');
    }
}

function downloadFile() {
    if (!currentDownload) return;
    window.location.href = currentDownload.downloadUrl;
    toast('📥 Téléchargement vers votre appareil...', 'success');
}

function resetDownload() {
    // Supprimer le fichier du serveur
    if (currentDownload && currentDownload.token) {
        fetch(`/api/video/${currentDownload.token}`, { method: 'DELETE' }).catch(() => {});
    }

    const player = document.getElementById('dlPlayer');
    if (player) {
        player.pause();
        player.src = '';
    }

    currentDownload = null;
    currentVideo = null;

    document.getElementById('downloadResult').classList.remove('show');
    document.getElementById('videoResult').classList.remove('show');
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoUrl').focus();
}

// Nettoyage à la fermeture de la page
window.addEventListener('beforeunload', () => {
    if (currentDownload && currentDownload.token) {
        navigator.sendBeacon(`/api/video/${currentDownload.token}`);
    }
});

// ═══════════════════════════════════════════════════════════
//  AUTO-START depuis les paramètres URL
//  Ex: /video_downloader/?url=https://youtu.be/...&format=mp4&quality=720
// ═══════════════════════════════════════════════════════════
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    const format = params.get('format');
    const quality = params.get('quality');

    if (url) {
        const input = document.getElementById('videoUrl');
        if (input) {
            input.value = url;

            // Attendre 300ms pour que tout soit bien chargé
            setTimeout(async () => {
                await analyzeVideo();

                // Si format + quality fournis → lancer le téléchargement
                if (format && quality) {
                    setTimeout(() => {
                        downloadVideo(format, quality);
                    }, 1500);
                }
            }, 300);
        }
    }
});
