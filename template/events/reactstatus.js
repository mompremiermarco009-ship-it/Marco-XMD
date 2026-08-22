// events/reactstatus.js
module.exports = {
    name: "messages.upsert",
    async execute(sock, { messages }) {
        const cfg = sock.config || require("../config.json");
        if (!cfg.reactstatus) return;

        if (!messages || !messages[0]) return;
        const msg = messages[0];

        if (msg.key.fromMe) return;
        if (msg.key.remoteJid !== "status@broadcast") return;

        if (!sock._reactedStatuses) sock._reactedStatuses = new Set();
        if (sock._reactedStatuses.has(msg.key.id)) return;
        sock._reactedStatuses.add(msg.key.id);

        await sock.readMessages([msg.key]).catch(() => {});

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
        }).catch(err => console.error("Erreur envoi réaction:", err.message));

        console.log(`[${sock.user?.id || "bot"}] Réaction au statut de ${targetJid}: ${reaction}`);
    }
};
