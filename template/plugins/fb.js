const axios = require('axios');

function cleanUrl(u) {
    const raw = (u || '').trim();
    if (!/^https?:\/\//i.test(raw)) return null;
    return raw.replace(/\s+/g, '');
}

module.exports = {
    name: "fb",
    aliases: ["facebook", "fbdl"],
    desc: "Télécharge une vidéo Facebook",
    usage: ".fb <url>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const url = cleanUrl(args[0]);
        if (!url || !url.includes('facebook.com')) {
            return sock.sendMessage(jid, {
                text: '❌ Donne un lien Facebook valide.\nExemple : .fb https://www.facebook.com/share/r/xxxx'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, { react: { text: '⬇️', key: msg.key } });

            const apiUrl = `https://tele-social.vercel.app/down?url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl, {
                timeout: 25000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (!data || data.status !== true || !data.data?.media) {
                throw new Error('Aucune vidéo trouvée');
            }

            const media = data.data.media;
            const videoUrl = media.download || media.video;
            if (!videoUrl) throw new Error('Lien vidéo manquant');

            const caption = `📥 *Facebook*\n✅ Téléchargement réussi\n\n> MARCO-XMD`;

            await sock.sendMessage(jid, {
                video: { url: videoUrl },
                mimetype: 'video/mp4',
                caption
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur fb:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Impossible de télécharger la vidéo Facebook.' }, { quoted: msg });
        }
    }
};
