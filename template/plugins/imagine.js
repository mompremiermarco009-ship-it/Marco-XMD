const axios = require('axios');

module.exports = {
    name: "imagine",
    aliases: ["imgai", "imageai"],
    desc: "Génère une image par IA (Pollinations)",
    usage: ".imagine <description>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const prompt = args.join(' ').trim();
        if (!prompt) {
            return sock.sendMessage(jid, { text: "❌ Donne une description pour l'image.\nExemple : .imagine un chat" }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, { react: { text: '🎨', key: msg.key } });
            await sock.sendMessage(jid, { text: '🎨 Génération de l\'image...' }, { quoted: msg });

            // Pollinations.ai – image directe, pas de clé API
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;

            // Timeout : l'image doit arriver dans les 15 secondes
            await axios.get(imageUrl, { timeout: 15000 });

            await sock.sendMessage(jid, {
                image: { url: imageUrl },
                caption: `🎨 *Image générée* : "${prompt}"`
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur imagine:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Échec de la génération d\'image.' }, { quoted: msg });
        }
    }
};
