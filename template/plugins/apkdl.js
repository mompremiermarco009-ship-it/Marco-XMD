const axios = require('axios');
const settings = require('../settings');

function isUrl(u) {
    return typeof u === "string" && /^https?:\/\/\S+/i.test(u.trim());
}

module.exports = {
    name: "apkdl",
    aliases: ["dlapk"],
    desc: "Télécharge un fichier APK depuis un lien direct",
    usage: ".apkdl <url>",
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const url = (args[0] || '').trim();

        if (!url) {
            return sock.sendMessage(chatId, {
                text: `📥 Exemple : *${settings.prefix || '.'}apkdl https://site.com/app.apk*`
            }, { quoted: msg });
        }

        if (!isUrl(url) || !url.toLowerCase().includes('.apk')) {
            return sock.sendMessage(chatId, {
                text: '❌ Donne un lien direct vers un fichier *.apk*.'
            }, { quoted: msg });
        }

        try { await sock.sendMessage(chatId, { react: { text: '🔄', key: msg.key } }); } catch {}

        let sizeMB = null;
        try {
            const head = await axios.head(url, { timeout: 15000, validateStatus: () => true });
            const len = head.headers?.['content-length'];
            if (len) sizeMB = Math.round((Number(len) / (1024 * 1024)) * 10) / 10;
        } catch {}

        const MAX_MB = 50;
        if (sizeMB && sizeMB > MAX_MB) {
            try { await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } }); } catch {}
            return sock.sendMessage(chatId, {
                text: `❌ APK trop lourd (${sizeMB} MB). Limite: ${MAX_MB} MB.`
            }, { quoted: msg });
        }

        const fileName = `app_${Date.now()}.apk`;
        const caption =
`╭━━━〔 📦 APK 〕━━━╮
┃ ✅ Téléchargement prêt
┃ 📁 Nom : ${fileName}
${sizeMB ? `┃ 📦 Taille : ${sizeMB} MB\n` : ''}╰━━━━━━━━━━━━━━━━━━━━╯
> MARCO-XMD`;

        try {
            await sock.sendMessage(chatId, {
                document: { url },
                fileName,
                mimetype: 'application/vnd.android.package-archive',
                caption
            }, { quoted: msg });

            try { await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } }); } catch {}
        } catch (err) {
            console.error('Erreur apkdl:', err);
            try { await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } }); } catch {}
            return sock.sendMessage(chatId, { text: '❌ Erreur lors du téléchargement.' }, { quoted: msg });
        }
    }
};
