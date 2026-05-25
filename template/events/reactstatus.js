// events/reactstatus.js
module.exports = {
    name: "messages.upsert",
    async execute(sock, { messages }) {
        try {
            const cfg = sock.config || require("../config.json");
            if (!cfg.reactstatus) return;

            if (!messages || !messages[0]) return;
            const msg = messages[0];
            if (msg.key.fromMe) return;
            if (msg.key.remoteJid !== "status@broadcast") return;

            // Vérifier exclusion par numéro
            const participant = msg.key.participant || msg.key.remoteJid;
            const participantNumber = participant.split('@')[0].replace(/[^0-9]/g, '');
            if (cfg.excludedStatusNumbers && cfg.excludedStatusNumbers.includes(participantNumber)) return;

            if (!sock._reactedStatuses) sock._reactedStatuses = new Set();
            if (sock._reactedStatuses.has(msg.key.id)) return;
            sock._reactedStatuses.add(msg.key.id);

            await sock.readMessages([msg.key]);

            const reactions = ["👀", "✨", "🔥", "💗", "🥰", "🧠", "⚡"];
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];

            const targetJid = msg.key.participant || msg.key.remoteJid;
            await sock.sendMessage(targetJid, {
                react: {
                    text: reaction,
                    key: {
                        remoteJid: msg.key.remoteJid,
                        id: msg.key.id,
                        participant: msg.key.participant,
                        fromMe: false
                    }
                }
            });

            console.log(`[${sock.user?.id}] Réaction au status de ${targetJid}: ${reaction}`);
        } catch (err) {
            console.error("Erreur reactStatus:", err.message);
        }
    }
};
