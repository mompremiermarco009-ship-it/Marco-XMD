const yts = require('yt-search');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

        const caption = `┌───〔 🎬 *${video.title}* 〕────\n┝ ➩ ⏱ *${video.timestamp}*\n┝ ➩ 👀 *${video.views}* vues\n└─────────────────────\n\n*Choisissez le format :*\n1️⃣ Audio (MP3)\n2️⃣ Vidéo (MP4)\n3️⃣ Document (Fichier)\n\nRépondez simplement par *1*, *2* ou *3*\n\n Powered by ©Mr Marco`;

        try {
            await sock.sendMessage(jid, { image: { url: video.thumbnail }, caption: caption }, { quoted: msg });
        } catch {
            await sock.sendMessage(jid, { text: caption }, { quoted: msg });
        }

        const handler = async ({ messages }) => {
            const m = messages[0];
            if (!m || !m.message) return;
            if (m.key.remoteJid !== jid || m.key.fromMe) return;
            const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
            if (text === '1' || text === '2' || text === '3') {
                sock.ev.off('messages.upsert', handler);
                await module.exports.handleChoice(sock, m, text, video);
            }
        };
        sock.ev.on('messages.upsert', handler);
        setTimeout(() => sock.ev.off('messages.upsert', handler), 60000);
    }
};

module.exports.handleChoice = async function(sock, msg, choice, video) {
    const jid = msg.key.remoteJid;
    try { await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }); } catch {}

    const mode = choice === '1' ? 'audio' : (choice === '2' ? 'video' : 'doc');

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
        if (res?.data?.success && res.data.downloadURL) return { download: res.data.downloadURL, title: res.data.title, type: 'mp3' };
        throw new Error('Audio fail');
    };

    const getVideo = async (url) => {
        const res = await tryReq(() => axios.get(`https://api.yupra.my.id/api/downloader/ytplay?url=${encodeURIComponent(url)}`, { timeout: 30000 }));
        if (res?.data?.success && res.data.data?.download_url) return { download: res.data.data.download_url, title: res.data.data.title, type: 'mp4' };
        throw new Error('Video fail');
    };

    const getVideoBackup = async (url) => {
        const res = await tryReq(() => axios.get(`https://api.elianabot.xyz/downloader/ytmp4?url=${encodeURIComponent(url)}`, { timeout: 30000 }));
        if (res?.data?.status === 200 && res.data.result?.download_url) return { download: res.data.result.download_url, title: res.data.result.title, type: 'mp4' };
        throw new Error('VideoBackup fail');
    };

    const getBackup = async (url) => {
        const res = await tryReq(() => axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 30000 }));
        if (res?.data?.dl) return { download: res.data.dl, title: res.data.title, type: 'mp3' };
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

    const isMp3 = (buffer) => {
        if (buffer.length < 4) return false;
        const header = buffer.slice(0, 4).toString();
        return header === 'ID3' || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0);
    };

    // Télécharge un buffer et retourne aussi le content-type
    const downloadBufferWithMeta = async (url) => {
        const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 90000 });
        const buffer = Buffer.from(resp.data);
        return { buffer, contentType: resp.headers['content-type'] || '' };
    };

    try {
        if (mode === 'audio') {
            for (const api of [getAudio, getBackup]) {
                try {
                    const data = await api(video.url);
                    if (!data.download) continue;
                    const { buffer } = await downloadBufferWithMeta(data.download);
                    if (buffer.length === 0) continue;
                    let finalBuffer = buffer;
                    if (!isMp3(buffer)) {
                        finalBuffer = convertToMp3(buffer);
                    }
                    const fileName = `${(data.title || video.title).replace(/[^\w\s-]/g, '')}.mp3`;
                    await sock.sendMessage(jid, { audio: finalBuffer, mimetype: 'audio/mpeg', fileName, ptt: false }, { quoted: msg });
                    break;
                } catch (e) { console.log('Audio API fail:', e.message); }
            }
        } else if (mode === 'video') {
            for (const api of [getVideo, getVideoBackup]) {
                try {
                    const data = await api(video.url);
                    if (!data.download) continue;
                    await sock.sendMessage(jid, { video: { url: data.download }, mimetype: 'video/mp4', caption: video.title }, { quoted: msg });
                    break;
                } catch (e) { console.log('Video API fail:', e.message); }
            }
        } else if (mode === 'doc') {
            let success = false;
            // Essayer les APIs vidéo pour obtenir un fichier vidéo
            for (const api of [getVideo, getVideoBackup]) {
                try {
                    const data = await api(video.url);
                    if (!data.download) continue;
                    const { buffer, contentType } = await downloadBufferWithMeta(data.download);
                    if (buffer.length === 0) continue;
                    // Déterminer l'extension à partir du content-type
                    let ext = 'mp4'; // par défaut
                    if (contentType.includes('video/mp4')) ext = 'mp4';
                    else if (contentType.includes('video/webm')) ext = 'webm';
                    else if (contentType.includes('video/x-matroska') || contentType.includes('video/mkv')) ext = 'mkv';
                    else if (contentType.includes('audio/mpeg')) ext = 'mp3';
                    else ext = 'mp4'; // fallback
                    const fileName = `${(data.title || video.title).replace(/[^\w\s-]/g, '')}.${ext}`;
                    await sock.sendMessage(jid, { document: buffer, mimetype: contentType || 'application/octet-stream', fileName, caption: video.title }, { quoted: msg });
                    success = true;
                    break;
                } catch (e) { console.log('Doc video fail:', e.message); }
            }

            // Fallback audio en document
            if (!success) {
                for (const api of [getAudio, getBackup]) {
                    try {
                        const data = await api(video.url);
                        if (!data.download) continue;
                        const { buffer } = await downloadBufferWithMeta(data.download);
                        if (buffer.length === 0) continue;
                        let finalBuffer = buffer;
                        if (!isMp3(buffer)) {
                            finalBuffer = convertToMp3(buffer);
                        }
                        const fileName = `${(data.title || video.title).replace(/[^\w\s-]/g, '')}.mp3`;
                        await sock.sendMessage(jid, { document: finalBuffer, mimetype: 'audio/mpeg', fileName, caption: video.title }, { quoted: msg });
                        success = true;
                        break;
                    } catch (e) { console.log('Doc audio fallback fail:', e.message); }
                }
            }

            if (!success) throw new Error('Aucun document récupéré');
        }

        try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch {}
    } catch (err) {
        console.error('Erreur play:', err.message);
        try { await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }); } catch {}
        await sock.sendMessage(jid, { text: '❌ Échec du téléchargement.' }, { quoted: msg });
    }
};
