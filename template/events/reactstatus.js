// events/reactstatus.js — version allégée
module.exports = {
    name: "messages.upsert",
    async execute(sock, { messages, type }) {
        // Filtre notify : ignore les synchros d'historique
        if (type !== 'notify') return;

        const cfg = sock.config || {};
        if (!cfg.reactstatus) return;

        const msg = messages[0];
        if (!msg?.message) return;
        if (msg.key.fromMe) return;
        if (msg.key.remoteJid !== "status@broadcast") return;

        // Anti-doublon en mémoire
        if (!sock._reactedStatuses) sock._reactedStatuses = new Set();
        if (sock._reactedStatuses.has(msg.key.id)) return;
        sock._reactedStatuses.add(msg.key.id);

        // Limiter la taille du Set pour éviter les fuites mémoire
        if (sock._reactedStatuses.size > 500) {
            sock._reactedStatuses.clear();
        }

        // Petite pause aléatoire pour un comportement naturel (300ms - 1.5s)
        await new Promise(r => setTimeout(r, 300 + Math.random() * 1200));

        // Deux emojis uniquement
        const reactions = ["💗", "👀"];
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];

        await sock.sendMessage("status@broadcast", {
            react: { text: reaction, key: msg.key }
        }).catch(() => {});

        console.log(`[${sock.user?.id || "bot"}] Statut réagi : ${reaction}`);
    }
};
