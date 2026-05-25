// plugins/quiz.js
const fetch = global.fetch || require('node-fetch');
const he = require('he');

module.exports = {
    name: 'quiz',
    aliases: ['qcm', 'trivia'],
    description: 'Affiche une question de quiz (français par défaut)',
    usage: '.quiz [fr|en]',

    async execute(sock, message, args, { config }) {
        const jid = message.key.remoteJid;
        const langArg = args[0]?.toLowerCase();
        const language = (langArg === 'en' || langArg === 'fr') ? langArg : 'fr'; // défaut français

        try {
            const url = `https://opentdb.com/api.php?amount=1&language=${language}&type=multiple`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.response_code !== 0 || !data.results || data.results.length === 0) {
                return sock.sendMessage(jid, {
                    text: `❌ Aucune question trouvée en ${language === 'fr' ? 'français' : 'anglais'}.`
                }, { quoted: message });
            }

            const q = data.results[0];
            const question = he.decode(q.question);
            const correctAnswer = he.decode(q.correct_answer);
            const incorrectAnswers = q.incorrect_answers.map(a => he.decode(a));

            // Mélanger les réponses
            const allAnswers = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5);
            const correctIndex = allAnswers.indexOf(correctAnswer);
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            const optionsText = allAnswers.map((ans, idx) => `${letters[idx]}. ${ans}`).join('\n');

            const quizText = `🧠 *Quiz (${language === 'fr' ? 'français' : 'anglais'})*\n\n` +
                             `📌 *Question :* ${question}\n\n` +
                             `${optionsText}\n\n` +
                             `_Répondez par la lettre correspondante (A, B, C...)_`;

            await sock.sendMessage(jid, { text: quizText }, { quoted: message });

        } catch (error) {
            console.error('Erreur plugin quiz :', error);
            await sock.sendMessage(jid, {
                text: '⚠️ Impossible de récupérer une question. Réessayez plus tard.'
            }, { quoted: message });
        }
    }
};
