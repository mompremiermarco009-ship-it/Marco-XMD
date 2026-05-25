const chatbotPlugin = require('../plugins/chatbot');

module.exports = {
    name: "messages.upsert",
    async execute(sock, { messages }) {
        for (const msg of messages) {
            if (!msg.message) continue;
            if (msg.key.remoteJid === "status@broadcast") continue;
            if (msg.key.fromMe) continue;

            const jid = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;
            let texte = "";
            const m = msg.message;
            if (m.conversation) texte = m.conversation;
            else if (m.extendedTextMessage) texte = m.extendedTextMessage.text;
            else if (m.imageMessage) texte = m.imageMessage.caption;
            else if (m.videoMessage) texte = m.videoMessage.caption;
            if (!texte) continue;

            // Ne pas traiter les commandes
            const prefix = (sock.config && sock.config.prefix) || '.';
            if (texte.startsWith(prefix)) continue;

            try {
                await chatbotPlugin.handleChatbotResponse(sock, msg, texte, sender);
            } catch (err) {
                console.error('Erreur événement chatbot:', err.message);
            }
        }
    }
};
