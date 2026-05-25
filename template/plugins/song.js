const axios = require('axios');
const yts = require('yt-search');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function tryRequest(getter, attempts = 2) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try { return await getter(); } catch (err) {
            lastError = err;
            if (attempt < attempts) await new Promise(r => setTimeout(r, 1000));
        }
    }
    throw lastError;
}

async function getEliteProTech(url) {
    const res = await tryRequest(() => axios.get(`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(url)}&format=mp3`, { timeout: 30000 }));
    if (res?.data?.success && res.data.downloadURL) {
        return { download: res.data.downloadURL, title: res.data.title || 'audio' };
    }
    throw new Error('EliteProTech: structure incorrecte');
}

async function getYupra(url) {
    const res = await tryRequest(() => axios.get(`https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 30000 }));
    if (res?.data?.success && res.data.data?.download_url) {
        return { download: res.data.data.download_url, title: res.data.data.title || 'audio' };
    }
    throw new Error('Yupra: structure incorrecte');
}

async function getOkatsu(url) {
    const res = await tryRequest(() => axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 30000 }));
    if (res?.data?.dl) {
        return { download: res.data.dl, title: res.data.title || 'audio' };
    }
    throw new Error('Okatsu: structure incorrecte');
}

function convertToMp3(inputBuffer) {
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
}

module.exports = {
    name: "song",
    alias: ["mp3", "musicdl","play"],
    desc: "Télécharge une musique en MP3 (YouTube)",
    usage: ".song <nom ou lien YouTube>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) return sock.sendMessage(jid, { text: '❌ Donne un nom de chanson ou un lien YouTube.' }, { quoted: msg });

        let video;
        try {
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: 'YouTube Audio', thumbnail: '' };
            } else {
                const search = await yts(query);
                if (!search?.videos?.length) throw new Error('Aucun résultat');
                video = search.videos[0];
            }
        } catch {
            return sock.sendMessage(jid, { text: '❌ Aucune vidéo trouvée.' }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

            const caption = `┌───〔 🎵 *SONG* 〕────\n┝ ➩ 🎬 *${video.title}*\n┝ ➩ ⏱ *${video.timestamp || 'N/A'}*\n┝ ➩ ⏳ Téléchargement en cours...\n└─────────────────────\n> MARCO-XMD`;
            if (video.thumbnail) {
                try { await sock.sendMessage(jid, { image: { url: video.thumbnail }, caption }, { quoted: msg }); } catch {
                    await sock.sendMessage(jid, { text: caption }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(jid, { text: caption }, { quoted: msg });
            }

            let audioData, audioBuffer, downloadSuccess = false;
            const apis = [getEliteProTech, getYupra, getOkatsu];

            for (const apiFunc of apis) {
                try {
                    audioData = await apiFunc(video.url);
                    if (!audioData.download) continue;

                    const audioResponse = await axios.get(audioData.download, {
                        responseType: 'arraybuffer',
                        timeout: 60000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                    });
                    audioBuffer = Buffer.from(audioResponse.data);
                    if (audioBuffer.length > 0) {
                        downloadSuccess = true;
                        break;
                    }
                } catch (e) {
                    console.log(`API ${apiFunc.name} échouée:`, e.message);
                }
            }

            if (!downloadSuccess || !audioBuffer) throw new Error('Toutes les sources de téléchargement ont échoué.');

            // Conversion MP3 si nécessaire
            let finalBuffer = audioBuffer;
            const header = audioBuffer.slice(0, 4).toString();
            if (header !== 'ID3' && !(audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
                try {
                    finalBuffer = convertToMp3(audioBuffer);
                } catch (e) {
                    console.error('Conversion MP3 échouée, envoi du buffer original');
                }
            }

            await sock.sendMessage(jid, {
                audio: finalBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${(audioData.title || video.title || 'song').replace(/[^\w\s-]/g, '')}.mp3`,
                ptt: false
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur song:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Échec du téléchargement. Toutes les sources sont actuellement indisponibles.' }, { quoted: msg });
        }
    }
};
