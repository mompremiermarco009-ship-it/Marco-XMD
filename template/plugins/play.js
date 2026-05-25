const yts = require('yt-search');

module.exports = {
    name: "play",
    aliases: ["music", "mp3", "song", "video", "doc"],
    desc: "Recherche YouTube et propose le type de téléchargement",
    usage: ".play <nom>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: `┌───〔 🎬 *PLAY* 〕────\n┝ ➩ ❌ Donne un nom de vidéo/musique.\n┝ ➩ Exemple : .play Imagine Dragons\n└─────────────────────\n> MARCO-XMD`
            }, { quoted: msg });
        }

        try { await sock.sendMessage(jid, { react: { text: '🔎', key: msg.key } }); } catch {}

        let video;
        try {
            const { videos } = await yts(query);
            if (!videos || videos.length === 0) throw new Error('Aucune vidéo');
            video = videos[0];
        } catch {
            try { await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }); } catch {}
            return sock.sendMessage(jid, { text: '❌ Aucun résultat trouvé.' }, { quoted: msg });
        }

        // Stocker la vidéo pour cette conversation
        if (!sock.playSessions) sock.playSessions = new Map();
        sock.playSessions.set(jid, {
            video,
            expires: Date.now() + 60000 // 1 minute pour répondre
        });

        const caption = `┌───〔 🎬 *${video.title}* 〕────\n┝ ➩ ⏱ *${video.timestamp}*\n┝ ➩ 👀 *${video.views}* vues\n└─────────────────────\n\n*Choisissez le format :*\n1️⃣ Audio (MP3)\n2️⃣ Vidéo (MP4)\n3️⃣ Document (Fichier)\n\nRépondez simplement par *1*, *2* ou *3*`;

        try {
            await sock.sendMessage(jid, { image: { url: video.thumbnail }, caption }, { quoted: msg });
        } catch {
            await sock.sendMessage(jid, { text: caption }, { quoted: msg });
        }
    }
};

// Fonction de téléchargement selon le choix
module.exports.handleChoice = async function(sock, msg, choice, video) {
    const jid = msg.key.remoteJid;
    const axios = require('axios');
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');

    const mode = choice === '1' ? 'audio' : (choice === '2' ? 'video' : 'doc');

    try { await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }); } catch {}

    let downloadSuccess = false;
    let finalBuffer, fileName;

    // Mêmes APIs que précédemment
    async function tryRequest(getter, attempts = 2) { /* ... */ }
    // (Nous allons intégrer directement les fonctions nécessaires pour éviter la duplication)

    // On va utiliser les fonctions déjà définies plus haut dans le fichier. Comme elles sont déjà dans le scope, on peut les réutiliser.
    // Mais comme handleChoice est à l'extérieur du module, on doit les réimporter.
    // Solution : on déplace les fonctions API dans un scope accessible, ou on les redéfinit.
    // Je vais plutôt intégrer le code de téléchargement directement ici.

    const tryReq = async (getter, attempts = 2) => {
        let lastError;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try { return await getter(); } catch (err) {
                lastError = err;
                if (attempt < attempts) await new Promise(r => setTimeout(r, 1000));
            }
        }
        throw lastError;
    };

    const getAudio = async (url) => {
        const res = await tryReq(() => axios.get(`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(url)}&format=mp3`, { timeout: 30000 }));
        if (res?.data?.success && res.data.downloadURL) return { download: res.data.downloadURL, title: res.data.title };
        throw new Error('Audio fail');
    };

    const getVideo = async (url) => {
        const res = await tryReq(() => axios.get(`https://api.yupra.my.id/api/downloader/ytplay?url=${encodeURIComponent(url)}`, { timeout: 30000 }));
        if (res?.data?.success && res.data.data?.download_url) return { download: res.data.data.download_url, title: res.data.data.title };
        throw new Error('Video fail');
    };

    const getBackup = async (url) => {
        const res = await tryReq(() => axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 30000 }));
        if (res?.data?.dl) return { download: res.data.dl, title: res.data.title };
        throw new Error('Backup fail');
    };

    const convertToMp3 = (inputBuffer) => {
        const tmpDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const inputFile = path.join(tmpDir, `input_${Date.now()}.audio`);
        const outputFile = path.join(tmpDir, `output_${Date.now()}.mp3`);
        fs.writeFileSync(inputFile, inputBuffer);
        try {
            execSync(`ffmpeg -y -i "${inputFile}" -codec:a libmp3lame -b:a 128k "${outputFile}"`, { stdio: 'pipe' });
            return fs.readFileSync(outputFile);
        } finally {
            try { fs.unlinkSync(inputFile); } catch {}
            try { fs.unlinkSync(outputFile); } catch {}
        }
    };

    if (mode === 'audio') {
        for (const api of [getAudio, getBackup]) {
            try {
                const data = await api(video.url);
                if (!data.download) continue;
                const resp = await axios.get(data.download, { responseType: 'arraybuffer', timeout: 60000 });
                let buffer = Buffer.from(resp.data);
                if (buffer.length === 0) continue;
                const header = buffer.slice(0, 4).toString();
                if (header !== 'ID3' && !(buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)) {
                    try { buffer = convertToMp3(buffer); } catch {}
                }
                finalBuffer = buffer;
                fileName = `${(data.title || video.title).replace(/[^\w\s-]/g, '')}.mp3`;
                downloadSuccess = true;
                await sock.sendMessage(jid, { audio: finalBuffer, mimetype: 'audio/mpeg', fileName, ptt: false }, { quoted: msg });
                break;
            } catch (e) { console.log('Audio API fail:', e.message); }
        }
    } else if (mode === 'video') {
        for (const api of [getVideo, getBackup]) {
            try {
                const data = await api(video.url);
                if (!data.download) continue;
                await sock.sendMessage(jid, { video: { url: data.download }, mimetype: 'video/mp4', caption: video.title }, { quoted: msg });
                downloadSuccess = true;
                break;
            } catch (e) { console.log('Video API fail:', e.message); }
        }
    } else if (mode === 'doc') {
        try {
            const data = await getVideo(video.url).catch(() => getBackup(video.url));
            if (!data.download) throw new Error('No link');
            const resp = await axios.get(data.download, { responseType: 'arraybuffer', timeout: 90000 });
            finalBuffer = Buffer.from(resp.data);
            fileName = `${(data.title || video.title).replace(/[^\w\s-]/g, '')}.mp4`;
            await sock.sendMessage(jid, { document: finalBuffer, mimetype: 'video/mp4', fileName, caption: video.title }, { quoted: msg });
            downloadSuccess = true;
        } catch (e) { console.log('Doc fail:', e.message); }
    }

    if (downloadSuccess) {
        try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch {}
    } else {
        try { await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }); } catch {}
        await sock.sendMessage(jid, { text: '❌ Échec du téléchargement.' }, { quoted: msg });
    }
};
