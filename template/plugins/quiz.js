const axios = require('axios');
const he = require('he');

function getState(sock) {
    if (!sock._quizState) sock._quizState = new Map();
    return sock._quizState;
}

module.exports = {
    name: 'quiz',
    aliases: ['qcm', 'trivia'],
    category: 'game',
    desc: 'Pose une question de quiz',
    usage: '.quiz',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        try {
            await sock.sendMessage(jid, { react: { text: '🧠', key: msg.key } });

            const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 10000 });
            const q = res.data?.results?.[0];
            if (!q) throw new Error('Aucune question');

            const question = he.decode(q.question);
            const correct = he.decode(q.correct_answer);
            const incorrect = q.incorrect_answers.map(a => he.decode(a));

            const answers = [correct, ...incorrect].sort(() => Math.random() - 0.5);
            const correctIdx = answers.indexOf(correct);

            const letters = ['Ⓐ', 'Ⓑ', 'Ⓒ', 'Ⓓ'];
            let text = `╔════════════════════════╗\n`;
            text += `║   🧠  𝐐𝐔𝐈𝐙\n`;
            text += `╚════════════════════════╝\n\n`;
            text += `╭━━━〔 📖 ${q.category} 〕━━━╮\n`;
            text += `┃  ${question}\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            for (let i = 0; i < answers.length; i++) {
                text += `┃  ${letters[i]}  ${answers[i]}\n`;
            }
            text += `\n💡 _Répondez A, B, C ou D_\n⏱️ _Vous avez 30 secondes_\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

            await sock.sendMessage(jid, { text }, { quoted: msg });

            // État
            const states = getState(sock);
            states.set(jid, {
                answer: correctIdx,
                timeout: setTimeout(() => states.delete(jid), 30000)
            });

            // Listener
            if (!sock._quizListenerAttached) {
                sock._quizListenerAttached = true;
                sock.ev.on('messages.upsert', async ({ messages, type }) => {
                    if (type !== 'notify') return;
                    const m = messages[0];
                    if (!m?.message || m.key.fromMe) return;

                    const mJid = m.key.remoteJid;
                    const states = getState(sock);
                    const st = states.get(mJid);
                    if (!st) return;

                    const txt = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim().toUpperCase();
                    const idx = ['A', 'B', 'C', 'D'].indexOf(txt);
                    if (idx === -1) return;

                    clearTimeout(st.timeout);
                    states.delete(mJid);

                    if (idx === st.answer) {
                        await sock.sendMessage(mJid, {
                            text: `✅ *Bonne réponse !*\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                        }, { quoted: m });
                    } else {
                        const correctLetter = ['A', 'B', 'C', 'D'][st.answer];
                        await sock.sendMessage(mJid, {
                            text: `❌ *Mauvaise réponse !*\n\nLa bonne réponse était *${correctLetter}*.\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                        }, { quoted: m });
                    }
                });
            }
        } catch (err) {
            console.error('Erreur quiz:', err.message);
            await sock.sendMessage(jid, { text: '❌ Impossible de récupérer une question.' }, { quoted: msg });
        }
    }
};
