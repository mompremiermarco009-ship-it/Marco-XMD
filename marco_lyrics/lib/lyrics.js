// marco_lyrics/lib/lyrics.js — Recherche via YouTube + lyrics.ovh + lrclib
const axios = require('axios');
const yts = require('yt-search');

// Normalise une chaîne (sans accents, minuscules)
function normalizeText(str) {
    return String(str)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/gi, '')
        .trim();
}

// Génère des variantes de titre
function generateVariants(query) {
    const variants = new Set();
    const q = query.trim();
    variants.add(q);
    variants.add(normalizeText(q));
    variants.add(q.replace(/\b(the|la|le|les|un|une|de|du|des)\b/gi, '').trim());
    variants.add(normalizeText(q.replace(/\b(the|la|le|les|un|une|de|du|des)\b/gi, '').trim()));
    return [...variants].filter(Boolean);
}

// ─── ÉTAPE 1 : Recherche YouTube pour trouver titre + artiste réels ───
async function searchYouTube(query) {
    try {
        const { videos } = await yts(query);
        if (!videos || videos.length === 0) return null;

        const video = videos[0];
        const rawTitle = video.title || '';
        const author = video.author?.name || '';

        // Essayer d'extraire l'artiste et le titre réel
        // Patterns courants : "Artiste - Titre", "Titre (Official Video)", "Artiste – Titre"
        let artist = author;
        let title = rawTitle;

        // Nettoyer les suffixes courants
        const cleanSuffixes = [
            /\s*\(official\s*(music\s*)?video\)/gi,
            /\s*\(official\s*audio\)/gi,
            /\s*\(lyrics?\s*video\)/gi,
            /\s*\(lyric\s*video\)/gi,
            /\s*\(audio\)/gi,
            /\s*\(video\s*clip\)/gi,
            /\s*\[official\s*video\]/gi,
            /\s*\[lyrics\]/gi,
            /\s*\(clip\s*officiel\)/gi,
            /\s*\[clip\s*officiel\]/gi,
            /\s*\(paroles\)/gi,
            /\s*\[paroles\]/gi,
            /\s*ft\.\s*/gi,
            /\s*feat\.\s*/gi,
            /\s*hd\s*$/gi,
            /\s*4k\s*$/gi,
        ];

        for (const re of cleanSuffixes) {
            title = title.replace(re, '');
        }

        // Si "Artiste - Titre" dans le titre
        const dashMatch = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
        if (dashMatch) {
            // Si le premier segment ressemble à un artiste
            if (dashMatch[1].length < 60 && dashMatch[2].length < 80) {
                artist = dashMatch[1].trim();
                title = dashMatch[2].trim();
            }
        }

        title = title.trim();
        artist = artist.trim();

        console.log(`🎬 YouTube: "${title}" par "${artist}"`);

        return {
            title,
            artist,
            originalTitle: rawTitle,
            thumbnail: video.thumbnail || '',
            duration: video.timestamp || '',
            views: video.views || 0,
            url: video.url || '',
            authorChannel: author
        };
    } catch (err) {
        console.error('⚠️  Erreur YouTube:', err.message);
        return null;
    }
}

// ─── ÉTAPE 2 : Recherche de paroles ───
async function searchLyricsOvh(title, artist = '') {
    const titleVariants = generateVariants(title);
    const artistVariants = artist ? [artist, normalizeText(artist)] : [''];

    for (const art of artistVariants) {
        for (const tit of titleVariants) {
            const url = art
                ? `https://api.lyrics.ovh/v1/${encodeURIComponent(art)}/${encodeURIComponent(tit)}`
                : `https://api.lyrics.ovh/v1/${encodeURIComponent(tit)}`;
            try {
                const res = await axios.get(url, { timeout: 12000 });
                if (res.data && res.data.lyrics && res.data.lyrics.trim().length > 20) {
                    return res.data.lyrics.trim();
                }
            } catch {}
        }
    }
    return null;
}

async function searchLrclib(title, artist = '') {
    const titleVariants = generateVariants(title);
    const artistVariants = artist ? [artist, normalizeText(artist)] : [''];

    const queries = [];
    for (const art of artistVariants) {
        for (const tit of titleVariants) {
            if (art && tit) queries.push(`https://lrclib.net/api/search?q=${encodeURIComponent(`${art} ${tit}`)}`);
            queries.push(`https://lrclib.net/api/search?q=${encodeURIComponent(tit)}`);
        }
    }

    const uniqueQueries = [...new Set(queries)];

    for (const url of uniqueQueries) {
        try {
            const res = await axios.get(url, { timeout: 12000 });
            if (Array.isArray(res.data) && res.data.length > 0) {
                const best = res.data[0];
                if (best.plainLyrics && best.plainLyrics.length > 20) return best.plainLyrics;
                if (best.syncedLyrics && best.syncedLyrics.length > 20) {
                    return best.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '').trim();
                }
            }
        } catch {}
    }
    return null;
}

// ─── Fonction principale ───
async function search(query) {
    if (!query || !query.trim()) throw new Error('Requête vide');

    console.log(`🔍 Recherche: "${query}"`);

    // 1. Recherche YouTube pour le vrai titre/artiste
    const yt = await searchYouTube(query);
    let searchTitle = query;
    let searchArtist = '';
    let videoInfo = null;

    if (yt) {
        searchTitle = yt.title;
        searchArtist = yt.artist;
        videoInfo = {
            title: yt.title,
            artist: yt.artist,
            thumbnail: yt.thumbnail,
            duration: yt.duration,
            views: yt.views,
            url: yt.url
        };
    }

    // 2. Recherche paroles : lrclib → lyrics.ovh → requête brute
    let lyrics = null;
    let source = null;

    // Avec titre + artiste extraits de YouTube
    if (searchArtist && searchTitle) {
        lyrics = await searchLrclib(searchTitle, searchArtist);
        if (lyrics) source = 'lrclib';

        if (!lyrics) {
            lyrics = await searchLyricsOvh(searchTitle, searchArtist);
            if (lyrics) source = 'lyrics.ovh';
        }
    }

    // Fallback : juste le titre
    if (!lyrics && searchTitle) {
        lyrics = await searchLrclib(searchTitle);
        if (lyrics) source = 'lrclib';

        if (!lyrics) {
            lyrics = await searchLyricsOvh(searchTitle);
            if (lyrics) source = 'lyrics.ovh';
        }
    }

    // Fallback : requête brute originale
    if (!lyrics) {
        lyrics = await searchLrclib(query);
        if (lyrics) source = 'lrclib';

        if (!lyrics) {
            lyrics = await searchLyricsOvh(query);
            if (lyrics) source = 'lyrics.ovh';
        }
    }

    // Ne plus throw : on renvoie null si pas trouvé (le frontend gère)
    if (lyrics) {
        console.log(`✅ Paroles (${lyrics.length} chars, source: ${source})`);
    } else {
        console.log(`⚠️  Paroles introuvables pour "${query}"`);
    }

    return {
        lyrics: lyrics || null,
        source: source || null,
        videoInfo: videoInfo || {
            title: query,
            artist: '',
            thumbnail: '',
            duration: '',
            views: 0,
            url: ''
        }
    };
}

// Export pour la route (au cas où)
async function searchYouTubeOnly(query) {
    return await searchYouTube(query);
}

module.exports = { search, searchYouTubeOnly };
