const axios = require('axios');
const { loadApiKeys } = require('../utils/apiKeys');

module.exports = {
    name: "ai",
    aliases: ["gpt", "gemini"],
    desc: "Intelligence Artificielle (GPT / Gemini)",
    usage: ".gpt <question> ou .gemini <question>",
    async execute(sock, msg, args, cmd) {
        const jid = msg.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: "❌ Pose une question.\n✅ Exemples :\n• .gpt c'est quoi un VPN ?\n• .gemini écris une bio WhatsApp stylée"
            }, { quoted: msg });
        }

        const apiKeys = loadApiKeys();
        // 🔧 Correction : lire la clé dans apiKeys.keys.openrouter
        const apiKey = apiKeys.keys?.openrouter;
        if (!apiKey) {
            return sock.sendMessage(jid, { text: "❌ Clé API OpenRouter manquante. Ajoute `openrouter` dans apiKeys.json → keys." }, { quoted: msg });
        }

        const model = 'openrouter/auto';
        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
            await sock.sendMessage(jid, { text: '🧠 Réflexion en cours...' }, { quoted: msg });

            const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model,
                messages: [
                    { role: 'system', content: 'Tu es un assistant utile. Réponds en français.' },
                    { role: 'user', content: query }
                ],
                temperature: 0.7,
                max_tokens: 1200
            }, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 45000
            });

            const answer = res.data?.choices?.[0]?.message?.content;
            if (!answer) throw new Error('Réponse vide');

            const header = cmd === 'gemini' ? '✨ GEMINI' : '🤖 GPT';
            const reply = `╭━━━〔 ${header} 〕━━━╮\n┃ ${query}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${answer}\n\n> MARCO-XMD`;

            await sock.sendMessage(jid, { text: reply }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur AI:', err?.response?.data || err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            let errorMsg = '❌ Erreur IA.';
            if (err.response?.status === 401) errorMsg = '❌ Clé API invalide. Vérifiez la clé openrouter dans apiKeys.json.';
            else if (err.response?.status === 429) errorMsg = '❌ Limite de requêtes atteinte. Réessaie plus tard.';
            else errorMsg = `❌ Erreur IA : ${err.message}`;
            await sock.sendMessage(jid, { text: errorMsg }, { quoted: msg });
        }
    }
};
