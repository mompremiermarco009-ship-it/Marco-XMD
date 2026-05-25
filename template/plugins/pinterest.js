const axios = require('axios');
const settings = require('../settings');

function extractPinterestUrl(text) {
    if (!text) return null;
    const t = String(text).trim();
    let m = t.match(/https?:\/\/[^\s]*pinterest[^\s]*\/pin\/[^\s]+/i);
    if (m) return m[0];
    m = t.match(/https?:\/\/pin\.it\/[^\s]+/i);
    if (m) return m[0];
    m = t.match(/pin\.it\/[^\s]+/i);
    if (m) return "https://" + m[0];
    return null;
}

function captionStyle({ title, author }) {
    const botName = settings.botName || 'MARCO-XMD';
    return (
`╭━━━〔 📌 PINTEREST 〕━━━╮
┃ 👤 Auteur : \`${author || 'N/A'}\`
╰━━━━━━━━━━━━━━━━━━━━━━╯

📝 *Titre :*
${title || 'Pinterest Pin'}

♠️ ${botName}
> MARCO-XMD`
    );
}

module.exports = {
    name: "pinterest",
    aliases: ["pin", "pin-dl"],
    desc: "Télécharge un média depuis Pinterest",
    usage: ".pinterest <lien pinterest>",
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const text = args.join(' ').trim();
        const pinUrl = extractPinterestUrl(text);

        if (!pinUrl) {
            const prefix = settings.prefix || '.';
            return sock.sendMessage(chatId, {
                text:
`╭━━━〔 📌 PINTEREST 〕━━━╮
┃ ❌ Lien Pinterest manquant
╰━━━━━━━━━━━━━━━━━━━━━━╯

Utilisation :
• ${prefix}pinterest <lien Pinterest>

Exemples :
• ${prefix}pinterest https://www.pinterest.com/pin/1109363320773690068/
• ${prefix}pinterest https://pin.it/xxxxxx`
            }, { quoted: msg });
        }

        try { await sock.sendMessage(chatId, { react: { text: "📥", key: msg.key } }); } catch {}

        const apiUrl = `https://api.nexray.web.id/downloader/pinterest?url=${encodeURIComponent(pinUrl)}`;
        const res = await axios.get(apiUrl, { timeout: 30000, validateStatus: () => true });

        if (res.status < 200 || res.status >= 300) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } }); } catch {}
            return sock.sendMessage(chatId, { text: `❌ Erreur API Pinterest (HTTP ${res.status}).` }, { quoted: msg });
        }

        const root = res.data;
        if (!root || root.status !== true || !root.result) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } }); } catch {}
            return sock.sendMessage(chatId, { text: '❌ Réponse invalide. Le pin est peut-être privé ou supprimé.' }, { quoted: msg });
        }

        const d = root.result;
        const isVideo = !!d.video;
        const mediaUrl = d.video || d.image || d.url;
        if (!mediaUrl) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } }); } catch {}
            return sock.sendMessage(chatId, { text: '❌ Aucun média trouvé.' }, { quoted: msg });
        }

        const cap = captionStyle({ title: d.title, author: d.author });

        if (isVideo) {
            const vr = await axios.get(mediaUrl, {
                responseType: "arraybuffer",
                timeout: 120000,
                headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.pinterest.com/" },
                validateStatus: () => true
            });
            if (vr.status < 200 || vr.status >= 300 || !vr.data) {
                try { await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } }); } catch {}
                return sock.sendMessage(chatId, { text: '❌ Impossible de télécharger la vidéo Pinterest.' }, { quoted: msg });
            }
            await sock.sendMessage(chatId, { video: Buffer.from(vr.data), caption: cap }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { image: { url: mediaUrl }, caption: cap }, { quoted: msg });
        }

        try { await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } }); } catch {}
    }
};
