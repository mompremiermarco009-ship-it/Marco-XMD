const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Chemins possibles pour apiKeys.json
const GLOBAL_KEYS_PATH = path.join(__dirname, '..', 'apiKeys.json'); // template/apiKeys.json
const SESSION_KEYS_PATH = path.join(__dirname, '..', '..', 'apiKeys.json'); // sessions/<ID>/apiKeys.json (si plugin dans sessions/<ID>/plugins/)

function loadApiKeys() {
    const paths = [SESSION_KEYS_PATH, GLOBAL_KEYS_PATH];
    for (const p of paths) {
        try {
            if (fs.existsSync(p)) {
                return JSON.parse(fs.readFileSync(p, 'utf-8'));
            }
        } catch (e) {
            console.error(`Erreur lecture ${p}:`, e.message);
        }
    }
    return {};
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
                text: "❌ Pose une question.\n✅ Exemples :\n• .gpt c'est quoi un VPN ?\n• .gemini écris une bio WhatsApp stylée\n\n> Powered by ©Mr Marco"
            }, { quoted: msg });
        }

        const apiKeys = loadApiKeys();
        const apiKey = process.env.OPENROUTER_API_KEY || apiKeys.OPENROUTER_API_KEY;
        if (!apiKey) {
            return sock.sendMessage(jid, { text: "❌ Clé API OpenRouter manquante. Ajoute `OPENROUTER_API_KEY` dans apiKeys.json ou définis la variable d'environnement OPENROUTER_API_KEY.\n\n> Powered by ©Mr Marco" }, { quoted: msg });
        }

        const model = 'openrouter/auto';
        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
            await sock.sendMessage(jid, { text: '🧠 Réflexion en cours...\n\n> Powered by ©Mr Marco' }, { quoted: msg });

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
            const reply = `╭━━━〔 ${header} 〕━━━╮\n┃ ${query}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${answer}\n\n> Powered by ©Mr Marco`;

            await sock.sendMessage(jid, { text: reply }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur AI:', err?.response?.data || err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            let errorMsg = '❌ Erreur IA.';
            if (err.response?.status === 401) errorMsg = '❌ Clé API invalide. Vérifiez la clé OPENROUTER_API_KEY dans apiKeys.json.';
            else if (err.response?.status === 429) errorMsg = '❌ Limite de requêtes atteinte. Réessaie plus tard.';
            else errorMsg = `❌ Erreur IA : ${err.message}`;
            await sock.sendMessage(jid, { text: `${errorMsg}\n\n> Powered by ©Mr Marco` }, { quoted: msg });
        }
    }
};
