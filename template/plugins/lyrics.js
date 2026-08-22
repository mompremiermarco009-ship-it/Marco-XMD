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

async function getLyricsFromOvh(artist, title) {
    try {
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
        const res = await axios.get(url, { timeout: 15000 });
        if (res.data && res.data.lyrics) return res.data.lyrics;
        return null;
    } catch (err) {
        console.log("lyrics.ovh error:", err.response?.data || err.message);
        return null;
    }
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

            let genius = null;
            let musixmatch = null;
            try { genius = await searchGenius(query); } catch (e) { console.log("Genius error:", e.response?.data || e.message); }
            try { musixmatch = await searchMusixmatch(query); } catch (e) { console.log("Musixmatch error:", e.response?.data || e.message); }

            const song = genius || musixmatch;
            if (!song) {
                return sock.sendMessage(jid, { text: `❌ Aucun résultat trouvé pour : *${query}*` }, { quoted: message });
            }

            let fullLyrics = null;
            if (song.title && song.artist) {
                fullLyrics = await getLyricsFromOvh(song.artist, song.title);
            }

            if (fullLyrics) {
                const chunks = splitText(fullLyrics, 4000);
                const total = chunks.length;

                if (total === 1) {
                    let text = `╭━━━〔 🎵 𝐌𝐀𝐑𝐂𝐎-𝐌𝐈𝐍𝐈-𝐋𝐘𝐑𝐈𝐂𝐒 〕━━━╮\n` +
                        `┃ 🎶 Titre : ${song.title}\n` +
                        `┃ 👤 Artiste : ${song.artist}\n` +
                        `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                        chunks[0] +
                        `\n\n> Powered by ©Mr Marco`;
                    await sock.sendMessage(jid, { text }, { quoted: message });
                } else {
                    let intro = `╭━━━〔 🎵 𝐌𝐀𝐑𝐂𝐎-𝐌𝐈𝐍𝐈-𝐋𝐘𝐑𝐈𝐂𝐒 〕━━━╮\n` +
                        `┃ 🎶 Titre : ${song.title}\n` +
                        `┃ 👤 Artiste : ${song.artist}\n` +
                        `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                        `📜 *Paroles complètes (${total} parties)*\n`;
                    await sock.sendMessage(jid, { text: intro }, { quoted: message });

                    for (let i = 0; i < chunks.length; i++) {
                        let part = chunks[i];
                        if (i === chunks.length - 1) {
                            part += `\n\n> Powered by ©Mr Marco`;
                        }
                        await sock.sendMessage(jid, { text: part });
                    }
                }
            } else {
                let text = `╭━━━〔 🎵 𝐌𝐀𝐑𝐂𝐎-𝐌𝐈𝐍𝐈-𝐋𝐘𝐑𝐈𝐂𝐒 〕━━━╮\n` +
                    `┃ 🎶 Titre : ${song.title}\n` +
                    `┃ 👤 Artiste : ${song.artist}\n` +
                    `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
                    `❌ Paroles introuvables pour cette chanson.\n` +
                    `> Powered by ©Mr Marco`;
                await sock.sendMessage(jid, { text }, { quoted: message });
            }
        } catch (error) {
            console.error("LYRICS ERROR:", error);
            await sock.sendMessage(jid, { text: "❌ Une erreur est survenue pendant la recherche.\n\n> Powered by ©Mr Marco" }, { quoted: message });
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
