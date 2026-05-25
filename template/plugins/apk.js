const axios = require('axios');

module.exports = {
    name: "apk",
    aliases: ["playstore", "app"],
    desc: "Recherche une application sur le Play Store",
    usage: ".apk <nom de l'application>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = args.join(' ').trim();
        const prefix = (sock.config && sock.config.prefix) || '.';

        if (!query) {
            return sock.sendMessage(jid, {
                text: `🛍️ *Play Store*\n\n❌ Donne le nom d'une application.\n\nExemple :\n${prefix}apk whatsapp\n${prefix}apk capcut`
            }, { quoted: msg });
        }

        try {
            // Recherche sur le Play Store
            const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps`;
            const { data: searchHtml } = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36' }
            });

            // Extraire le premier lien d'application
            const appMatch = searchHtml.match(/\/store\/apps\/details\?id=([^"&]+)/);
            if (!appMatch) throw new Error('Aucune application trouvée');

            const appId = appMatch[1];
            const appUrl = `https://play.google.com/store/apps/details?id=${appId}`;

            // Récupérer les détails
            const { data: appHtml } = await axios.get(appUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36' }
            });

            const titleMatch = appHtml.match(/<title>([^<]+) - Apps on Google Play<\/title>/);
            const title = titleMatch ? titleMatch[1] : appId;
            const iconMatch = appHtml.match(/<img[^>]+src="([^"]+)"[^>]+alt="Cover art"/);
            const icon = iconMatch ? iconMatch[1] : null;

            const caption = `🛍️ *Play Store*\n\n📱 *${title}*\n🔗 ${appUrl}`;

            if (icon) {
                await sock.sendMessage(jid, { image: { url: icon }, caption }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { text: caption }, { quoted: msg });
            }
        } catch (err) {
            console.error('Erreur apk:', err.message);
            await sock.sendMessage(jid, { text: '❌ Aucune application trouvée ou erreur.' }, { quoted: msg });
        }
    }
};
