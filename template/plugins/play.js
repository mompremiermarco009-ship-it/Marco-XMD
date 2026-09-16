// template/plugins/play.js — Recherche + téléchargement intelligent
// Si le fichier est petit → envoie sur WhatsApp
// Si trop gros → envoie le lien du site
const yts = require('yt-search');
const axios = require('axios');

// Limite de taille en octets (60 Mo)
const MAX_WHATSAPP_SIZE = 60 * 1024 * 1024;

// Stockage temporaire des recherches par chat
function getPlayState(sock) {
    if (!sock._playState) sock._playState = new Map();
    return sock._playState;
}

// Formate une taille en octets
function humanSize(bytes) {
    if (!bytes || bytes < 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

module.exports = {
    name: 'play',
    aliases: ['video', 'music', 'song', 'yt', 'ytmp4', 'ytmp3'],
    category: 'downloader',
    desc: 'Recherche une vidéo YouTube et propose le téléchargement',
    usage: '.play <titre>',

    async execute(sock, msg, args, cmd) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const prefix = cfg.prefix || '.';
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const publicUrl = cfg.publicUrl || 'https://marco-xmd-v2.onrender.com';

        const query = args.join(' ').trim();

        // Vérifier le lien YouTube direct
        let video = null;
        if (/youtube\.com|youtu\.be/i.test(query)) {
            video = {
                url: query,
                title: 'Vidéo YouTube',
                timestamp: '',
                views: 0,
                thumbnail: '',
                author: { name: '' }
            };
        } else if (!query) {
            return sock.sendMessage(jid, {
                text: `🎬 *𝐌𝐚𝐫𝐜𝐨 𝐏𝐥𝐚𝐲*\n\n` +
                      `Utilisation :\n` +
                      `• ${prefix}play <titre>\n` +
                      `• ${prefix}play <lien youtube>\n\n` +
                      `Exemples :\n` +
                      `• ${prefix}play Dernière danse\n` +
                      `• ${prefix}play https://youtu.be/...\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        // Réaction de recherche
        try {
            await sock.sendMessage(jid, { react: { text: '🔎', key: msg.key } });
        } catch {}

        // Recherche YouTube si nécessaire
        if (!video) {
            try {
                const { videos } = await yts(query);
                if (!videos || videos.length === 0) throw new Error('Aucun résultat');
                video = videos[0];
            } catch (err) {
                try { await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }); } catch {}
                return sock.sendMessage(jid, {
                    text: `❌ *Aucun résultat trouvé*\n\nEssayez avec un autre titre.\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                }, { quoted: msg });
            }
        }

        // Sauvegarder l'état
        const states = getPlayState(sock);
        states.set(jid, { video, timestamp: Date.now() });

        // Formater les vues
        let viewsText = '—';
        if (typeof video.views === 'number' && video.views > 0) {
            if (video.views >= 1e9) viewsText = (video.views / 1e9).toFixed(1) + 'B';
            else if (video.views >= 1e6) viewsText = (video.views / 1e6).toFixed(1) + 'M';
            else if (video.views >= 1e3) viewsText = (video.views / 1e3).toFixed(1) + 'K';
            else viewsText = String(video.views);
        }

        // Message de choix
        const text = `╔════════════════════════════╗\n` +
                     `║   🎬  𝐌𝐚𝐫𝐜𝐨 𝐏𝐥𝐚𝐲  🎬\n` +
                     `╚════════════════════════════╝\n\n` +
                     `╭━━━〔 📌 𝐕𝐢𝐝𝐞́𝐨 〕━━━╮\n` +
                     `┃  🎬  ${video.title || 'Vidéo'}\n` +
                     (video.author?.name ? `┃  👤  ${video.author.name}\n` : '') +
                     (video.timestamp ? `┃  ⏱️  ${video.timestamp}\n` : '') +
                     `┃  👀  ${viewsText}\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `╭━━━〔 🎯 𝐅𝐨𝐫𝐦𝐚𝐭𝐬 〕━━━╮\n` +
                     `┃  Ⓐ︎  🎬  𝐌𝐏𝟒 𝐇𝐃  (720p)\n` +
                     `┃  Ⓑ︎  🎬  𝐌𝐏𝟒 𝐒𝐃  (360p)\n` +
                     `┃  Ⓒ︎  🎵  𝐌𝐏𝟑 𝟏𝟐𝟖\n` +
                     `┃  Ⓓ︎  🎵  𝐌𝐏𝟑 𝟑𝟐𝟎\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `🔡 _𝑅𝑒́𝑝𝑜𝑛𝑑𝑒𝑧 𝑎𝑣𝑒𝑐 𝑙𝑎 𝑙𝑒𝑡𝑡𝑟𝑒 (A-D)_\n` +
                     `📦 _𝐸𝑛𝑣𝑜𝑖 𝑑𝑖𝑟𝑒𝑐𝑡 𝑠𝑖 < ${humanSize(MAX_WHATSAPP_SIZE)}_\n\n` +
                     `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

        // Envoyer avec miniature
        try {
            if (video.thumbnail) {
                await sock.sendMessage(jid, {
                    image: { url: video.thumbnail },
                    caption: text
                }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { text }, { quoted: msg });
            }
        } catch {
            await sock.sendMessage(jid, { text }, { quoted: msg });
        }

        // Attacher le listener (une seule fois)
        if (!sock._playListenerAttached) {
            sock._playListenerAttached = true;

            sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;
                const m = messages[0];
                if (!m || !m.message) return;
                if (m.key.fromMe) return;

                const mJid = m.key.remoteJid;
                const states = getPlayState(sock);
                const state = states.get(mJid);
                if (!state) return;

                // Expiration
                if (Date.now() - state.timestamp > 5 * 60 * 1000) {
                    states.delete(mJid);
                    return;
                }

                const txt = (
                    m.message.conversation ||
                    m.message.extendedTextMessage?.text ||
                    ''
                ).trim().toUpperCase();

                const letter = txt.match(/^([A-D])$/)?.[1];
                if (!letter) return;

                states.delete(mJid);

                const formats = {
                    'A': { format: 'mp4', quality: '720', label: 'MP4 HD 720p', emoji: '🎬', type: 'video' },
                    'B': { format: 'mp4', quality: '360', label: 'MP4 SD 360p', emoji: '🎬', type: 'video' },
                    'C': { format: 'mp3', quality: '128', label: 'MP3 128 kbps', emoji: '🎵', type: 'audio' },
                    'D': { format: 'mp3', quality: '320', label: 'MP3 320 kbps', emoji: '🎵', type: 'audio' }
                };

                const choice = formats[letter];
                if (!choice) return;

                await handleDownload(sock, m, mJid, state.video, choice, publicUrl, owner);
            });
        }
    }
};

// ═══════════════════════════════════════════════════════════
//  Téléchargement via l'API du site + décision
// ═══════════════════════════════════════════════════════════
async function handleDownload(sock, msg, jid, video, choice, publicUrl, owner) {
    // Réaction de chargement
    try {
        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
    } catch {}

    // Envoyer un message d'attente
    let statusMsg = null;
    try {
        statusMsg = await sock.sendMessage(jid, {
            text: `⏳ *Téléchargement en cours...*\n\n` +
                  `📦 ${choice.label}\n` +
                  `🎬 ${video.title}\n\n` +
                  `_Merci de patienter..._`
        }, { quoted: msg });
    } catch {}

    // Appeler l'API du site
    const apiUrl = `${publicUrl}/api/video/download?url=${encodeURIComponent(video.url)}&format=${choice.format}&quality=${choice.quality}`;

    try {
        const res = await axios.get(apiUrl, { timeout: 180000 });

        if (!res.data || !res.data.ok) {
            throw new Error('Réponse invalide du serveur');
        }

        const { token, ext, size, streamUrl, downloadUrl } = res.data;
        const sizeHuman = humanSize(size);

        // ─── Décision : envoyer ou rediriger ───
        if (size <= MAX_WHATSAPP_SIZE) {
            // Envoi direct sur WhatsApp
            await sendFileToWhatsApp(sock, msg, jid, `${publicUrl}${downloadUrl}`, choice, video, size, owner, statusMsg);
        } else {
            // Trop gros → envoyer le lien
            const directLink = `${publicUrl}/video_downloader/?url=${encodeURIComponent(video.url)}&format=${choice.format}&quality=${choice.quality}`;

            const text = `╔════════════════════════════╗\n` +
                         `║   📦  𝐅𝐢𝐜𝐡𝐢𝐞𝐫 𝐭𝐫𝐨𝐩 𝐠𝐫𝐨𝐬\n` +
                         `╚════════════════════════════╝\n\n` +
                         `╭━━━〔 ⚠️ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 〕━━━╮\n` +
                         `┃  📦  𝐓𝐚𝐢𝐥𝐥𝐞 : ${sizeHuman}\n` +
                         `┃  🎯  𝐅𝐨𝐫𝐦𝐚𝐭 : ${choice.label}\n` +
                         `┃  🎬  ${video.title}\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                         `💡 _Le fichier dépasse la limite_\n` +
                         `_de WhatsApp (${humanSize(MAX_WHATSAPP_SIZE)})._\n\n` +
                         `🔗 *𝑇𝑒́𝑙𝑒́𝑐ℎ𝑎𝑟𝑔𝑒𝑧 𝑖𝑐𝑖 :*\n` +
                         `${directLink}\n\n` +
                         `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

            if (statusMsg) {
                try {
                    await sock.sendMessage(jid, { text: '✅ *Fichier prêt !*', edit: statusMsg.key });
                } catch {}
            }

            if (video.thumbnail) {
                try {
                    await sock.sendMessage(jid, {
                        image: { url: video.thumbnail },
                        caption: text
                    }, { quoted: msg });
                } catch {
                    await sock.sendMessage(jid, { text }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(jid, { text }, { quoted: msg });
            }

            try {
                await sock.sendMessage(jid, { react: { text: '🔗', key: msg.key } });
            } catch {}

            // Supprimer le fichier du serveur (inutile)
            setTimeout(() => {
                axios.delete(`${publicUrl}/api/video/${token}`).catch(() => {});
            }, 5000);
        }
    } catch (err) {
        console.error('❌ Erreur téléchargement:', err.message);

        try {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
        } catch {}

        let errorMsg = '❌ Impossible de télécharger la vidéo.';
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            errorMsg += '\n⚠️ Le serveur est injoignable.';
        } else if (err.code === 'ECONNABORTED') {
            errorMsg += '\n⚠️ Le téléchargement a pris trop de temps.';
        } else if (err.message) {
            errorMsg += `\n_Détail : ${err.message}_`;
        }

        if (statusMsg) {
            try {
                await sock.sendMessage(jid, { text: errorMsg, edit: statusMsg.key });
                return;
            } catch {}
        }

        await sock.sendMessage(jid, {
            text: `${errorMsg}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
        }, { quoted: msg });
    }
}

// ═══════════════════════════════════════════════════════════
//  Envoi du fichier sur WhatsApp (depuis le lien de téléchargement)
// ═══════════════════════════════════════════════════════════
async function sendFileToWhatsApp(sock, msg, jid, downloadUrl, choice, video, size, owner, statusMsg) {
    console.log(`📥 Téléchargement depuis ${downloadUrl} (${humanSize(size)})`);

    try {
        // Télécharger le buffer
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: 100 * 1024 * 1024 // 100 Mo max
        });

        const buffer = Buffer.from(response.data);
        const actualSize = buffer.length;
        console.log(`✅ Buffer reçu : ${humanSize(actualSize)}`);

        // Envoyer selon le type
        if (choice.type === 'audio') {
            await sock.sendMessage(jid, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: `${(video.title || 'audio').replace(/[^\w\s-]/g, '').substring(0, 60)}.mp3`,
                ptt: false
            }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: `🎬 *${video.title}*\n\n📦 ${choice.label} · ${humanSize(actualSize)}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        // Supprimer le message d'attente
        if (statusMsg) {
            try {
                await sock.sendMessage(jid, { delete: statusMsg.key });
            } catch {}
        }

        try {
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch {}

        // Nettoyer le fichier côté serveur
        setTimeout(() => {
            const baseUrl = downloadUrl.split('/api/video/')[0];
            const token = downloadUrl.match(/token=([a-f0-9]+)/)?.[1];
            if (token) {
                axios.delete(`${baseUrl}/api/video/${token}`).catch(() => {});
            }
        }, 5000);

    } catch (err) {
        console.error('❌ Erreur envoi fichier:', err.message);

        // Fallback : envoyer le lien du site
        const baseUrl = downloadUrl.split('/api/video/')[0];
        const videoUrl = video.url || '';
        const link = `${baseUrl}/video_downloader/?url=${encodeURIComponent(videoUrl)}&format=${choice.format}&quality=${choice.quality}`;

        const text = `╔════════════════════════════╗\n` +
                     `║   ⚠️  𝐄𝐫𝐫𝐞𝐮𝐫 𝐝'𝐞𝐧𝐯𝐨𝐢\n` +
                     `╚════════════════════════════╝\n\n` +
                     `┃  ❌  L'envoi direct a échoué\n` +
                     `┃  💡  Utilisez le lien ci-dessous\n\n` +
                     `🔗 ${link}\n\n` +
                     `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

        if (statusMsg) {
            try {
                await sock.sendMessage(jid, { text, edit: statusMsg.key });
                return;
            } catch {}
        }

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
}
