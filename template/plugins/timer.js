// plugins/timer.js
module.exports = {
    name: 'timer',
    aliases: ['minuteur', 'rappel', 'countdown'],
    description: 'Lance un minuteur (en secondes, ou minutes avec "m")',
    usage: '.timer <durée> [message]',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (!args[0]) {
            return sock.sendMessage(jid, { text: '❌ Utilisation : *.timer 120* (secondes) ou *.timer 2m* (minutes)\nExemple : .timer 120 Temps écoulé !' }, { quoted: message });
        }

        let durationArg = args[0].toLowerCase();
        let seconds = 0;
        if (durationArg.endsWith('m')) {
            const min = parseInt(durationArg.slice(0, -1));
            if (isNaN(min) || min <= 0) {
                return sock.sendMessage(jid, { text: '❌ Durée invalide.' }, { quoted: message });
            }
            seconds = min * 60;
        } else {
            seconds = parseInt(durationArg);
            if (isNaN(seconds) || seconds <= 0) {
                return sock.sendMessage(jid, { text: '❌ Durée invalide.' }, { quoted: message });
            }
        }

        const notificationMsg = args.slice(1).join(' ').trim() || '⏰ Temps écoulé !';

        // Confirmation
        await sock.sendMessage(jid, { text: `⏳ Minuteur lancé pour ${seconds} seconde(s).` }, { quoted: message });

        // Programmer le rappel
        setTimeout(async () => {
            try {
                await sock.sendMessage(jid, {
                    text: `🔔 *Rappel :* ${notificationMsg}`,
                    mentions: [sender]
                });
            } catch (err) {
                console.error('Erreur timer:', err);
            }
        }, seconds * 1000);
    }
};
