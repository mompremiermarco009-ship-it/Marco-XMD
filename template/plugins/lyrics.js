const axios = require("axios");

let GENIUS_TOKEN = "";
let MUSIXMATCH_API_KEY = "";

try {
    const apiKeys = require("../apiKeys.json");
    GENIUS_TOKEN = apiKeys.GENIUS_TOKEN || "";
    MUSIXMATCH_API_KEY = apiKeys.MUSIXMATCH_API_KEY || "";
} catch {}

GENIUS_TOKEN = process.env.GENIUS_TOKEN || GENIUS_TOKEN;
MUSIXMATCH_API_KEY = process.env.MUSIXMATCH_API_KEY || MUSIXMATCH_API_KEY;

// Supprime les accents et caractères spéciaux, et met en minuscules
function normalizeText(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, "").trim().toLowerCase();
}

// Génère des variantes de titre pour la recherche
function generateTitleVariants(query) {
    const variants = new Set();
    const q = query.trim();
    variants.add(q);
    variants.add(normalizeText(q));
    // Enlever les articles
    variants.add(q.replace(/\b(the|la|le|les|un|une|de|du|des)\b/gi, '').trim());
    variants.add(normalizeText(q.replace(/\b(the|la|le|les|un|une|de|du|des)\b/gi, '').trim()));
    // Remplacer colour/color
    const colourVariants = [q, q.replace(/colour/gi, 'color'), q.replace(/color/gi, 'colour')];
    colourVariants.forEach(v => variants.add(v));
    // Retourner tableau
    return [...variants].filter(Boolean);
}

async function getLyricsFromOvh(artist, title) {
    const attempts = [];
    const titleVariants = generateTitleVariants(title);
    const artistVariants = artist ? [artist, normalizeText(artist)] : [''];

    for (const art of artistVariants) {
        for (const tit of titleVariants) {
            attempts.push({ artist: art, title: tit });
        }
    }

    for (const attempt of attempts) {
        const artistPart = attempt.artist ? encodeURIComponent(attempt.artist) : "";
        const titlePart = encodeURIComponent(attempt.title);
        const url = artistPart
            ? `https://api.lyrics.ovh/v1/${artistPart}/${titlePart}`
            : `https://api.lyrics.ovh/v1/${titlePart}`;
        try {
            const res = await axios.get(url, { timeout: 15000 });
            if (res.data && res.data.lyrics) return res.data.lyrics;
        } catch (err) {
            // continue
        }
    }
    return null;
}

async function getLyricsFromLrclib(artist, title) {
    const queries = [];
    const titleVariants = generateTitleVariants(title || '');
    const artistVariants = artist ? [artist, normalizeText(artist)] : [''];

    for (const art of artistVariants) {
        for (const tit of titleVariants) {
            if (art && tit) queries.push(`https://lrclib.net/api/search?q=${encodeURIComponent(`${art} ${tit}`)}`);
            queries.push(`https://lrclib.net/api/search?q=${encodeURIComponent(tit)}`);
        }
    }

    // Dédupliquer les URLs
    const uniqueQueries = [...new Set(queries)];

    for (const url of uniqueQueries) {
        try {
            const res = await axios.get(url, { timeout: 15000 });
            if (Array.isArray(res.data) && res.data.length > 0) {
                const best = res.data[0];
                if (best.plainLyrics) return best.plainLyrics;
                if (best.syncedLyrics) return best.syncedLyrics;
            } else if (res.data && (res.data.plainLyrics || res.data.syncedLyrics)) {
                return res.data.plainLyrics || res.data.syncedLyrics;
            }
        } catch (err) {
            // continue
        }
    }
    return null;
}

function splitText(text, maxLength = 4000) {
    const chunks = [];
    let current = "";
    const lines = text.split("\n");
    for (const line of lines) {
        if (current.length + line.length + 1 > maxLength) {
            if (current.trim()) chunks.push(current.trim());
            current = line + "\n";
        } else {
            current += line + "\n";
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

module.exports = {
    name: "lyrics",
    alias: ["ly", "paroles"],
    category: "music",
    desc: "Recherche les paroles complètes d'une chanson",
    usage: "lyrics <nom de la chanson>",
    async execute(sock, message, args, cmd) {
        const cfg = sock.config;
        const prefix = cfg.prefix || ".";
        const jid = message.key.remoteJid;
        const query = args.join(" ").trim();

        if (!query) {
            return sock.sendMessage(jid, {
                text: `🎵 *𝐌𝐀𝐑𝐂𝐎-𝐌𝐈𝐍𝐈-𝐋𝐘𝐑𝐈𝐂𝐒*\n\nUtilisation :\n${prefix}lyrics nom de la chanson\n\nExemple :\n${prefix}lyrics Hoist the Colours`
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(jid, { react: { text: "🎵", key: message.key } });

            // 1. Recherche métadonnées (optionnelle)
            let genius = null;
            let musixmatch = null;
            try { genius = await searchGenius(query); } catch (e) {}
            try { musixmatch = await searchMusixmatch(query); } catch (e) {}

            let artist = "";
            let title = "";
            const song = genius || musixmatch;
            if (song) {
                artist = song.artist;
                title = song.title;
            } else {
                // Si pas de métadonnées, on utilise la requête comme titre
                title = query;
                artist = "";
            }

            // 2. Recherche des paroles avec les variantes
            let fullLyrics = null;

            // D'abord via lyrics.ovh, puis lrclib
            fullLyrics = await getLyricsFromOvh(artist, title);
            if (!fullLyrics) fullLyrics = await getLyricsFromLrclib(artist, title);

            // Si toujours rien, on essaie juste avec la requête brute (sans métadonnées)
            if (!fullLyrics && song) {
                fullLyrics = await getLyricsFromOvh("", query);
                if (!fullLyrics) fullLyrics = await getLyricsFromLrclib("", query);
            }

            if (fullLyrics) {
                const chunks = splitText(fullLyrics, 4000);
                const total = chunks.length;

                let header = `╭━━━〔 🎵 𝐌𝐀𝐑𝐂𝐎-𝐌𝐈𝐍𝐈-𝐋𝐘𝐑𝐈𝐂𝐒 〕━━━╮\n`;
                if (title) header += `┃ 🎶 Titre : ${title}\n`;
                if (artist) header += `┃ 👤 Artiste : ${artist}\n`;
                header += `╰━━━━━━━━━━━━━━━━━━╯\n\n`;

                if (total === 1) {
                    let text = header + chunks[0] + `\n\n> Powered by ©Mr Marco`;
                    await sock.sendMessage(jid, { text }, { quoted: message });
                } else {
                    await sock.sendMessage(jid, {
                        text: header + `📜 *Paroles complètes (${total} parties)*`
                    }, { quoted: message });

                    for (let i = 0; i < chunks.length; i++) {
                        let part = chunks[i];
                        if (i === chunks.length - 1) part += `\n\n> Powered by ©Mr Marco`;
                        await sock.sendMessage(jid, { text: part });
                    }
                }
            } else {
                let text = `╭━━━〔 🎵 𝐌𝐀𝐑𝐂𝐎-𝐌𝐈𝐍𝐈-𝐋𝐘𝐑𝐈𝐂𝐒 〕━━━╮\n`;
                if (title) text += `┃ 🎶 Titre : ${title}\n`;
                if (artist) text += `┃ 👤 Artiste : ${artist}\n`;
                text += `╰━━━━━━━━━━━━━━━━━━╯\n\n❌ Paroles introuvables pour cette chanson.\n> Powered by ©Mr Marco`;
                await sock.sendMessage(jid, { text }, { quoted: message });
            }
        } catch (error) {
            console.error("LYRICS ERROR:", error);
            await sock.sendMessage(jid, {
                text: "❌ Une erreur est survenue pendant la recherche.\n\n> Powered by ©Mr Marco"
            }, { quoted: message });
        }
    }
};

async function searchGenius(query) {
    if (!GENIUS_TOKEN) return null;
    const response = await axios.get("https://api.genius.com/search", {
        params: { q: query },
        headers: { Authorization: `Bearer ${GENIUS_TOKEN}` },
        timeout: 10000
    });
    const hits = response.data?.response?.hits || [];
    if (!hits.length) return null;
    const song = hits[0].result;
    return {
        title: song.title,
        artist: song.primary_artist?.name || "Inconnu",
        url: song.url,
        thumbnail: song.song_art_image_thumbnail_url
    };
}

async function searchMusixmatch(query) {
    if (!MUSIXMATCH_API_KEY) return null;
    const response = await axios.get("https://api.musixmatch.com/ws/1.1/track.search", {
        params: {
            apikey: MUSIXMATCH_API_KEY,
            q_track: query,
            page_size: 1,
            s_track_rating: "desc"
        },
        timeout: 10000
    });
    const tracks = response.data?.message?.body?.track_list || [];
    if (!tracks.length) return null;
    const track = tracks[0].track;
    return {
        title: track.track_name,
        artist: track.artist_name,
        album: track.album_name,
        url: track.track_share_url,
        hasLyrics: Boolean(track.has_lyrics)
    };
}
