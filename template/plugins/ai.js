const axios = require('axios');
const fs = require('fs');
const path = require('path');

function loadApiKeys() {
    try {
        const apiKeysPath = path.join(__dirname, '..', 'apiKeys.json');
        if (fs.existsSync(apiKeysPath)) {
            return JSON.parse(fs.readFileSync(apiKeysPath, 'utf-8'));
        }
        return {};
    } catch (e) {
        console.error('Erreur lecture apiKeys.json:', e.message);
        return {};
    }
}

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
        const apiKey = apiKeys.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return sock.sendMessage(jid, { text: "❌ Clé API OpenRouter manquante. Ajoute `OPENROUTER_API_KEY` dans apiKeys.json." }, { quoted: msg });
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
            if (err.response?.status === 401) errorMsg = '❌ Clé API invalide. Vérifiez la clé OPENROUTER_API_KEY dans apiKeys.json.';
            else if (err.response?.status === 429) errorMsg = '❌ Limite de requêtes atteinte. Réessaie plus tard.';
            else errorMsg = `❌ Erreur IA : ${err.message}`;
            await sock.sendMessage(jid, { text: errorMsg }, { quoted: msg });
        }
    }
};
