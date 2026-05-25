// plugins/topmembers.js
module.exports = {
    name: "topmembers",
    aliases: ["top", "classement"],
    desc: "Active/désactive le suivi des messages et affiche le classement",
    usage: ".topmembers on/off",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith("@g.us")) {
            return sock.sendMessage(jid, { text: "❌ Cette commande ne fonctionne que dans les groupes." }, { quoted: msg });
        }

        if (!sock.messageCounts) sock.messageCounts = new Map();
        if (!sock.messageCounts.has(jid)) sock.messageCounts.set(jid, new Map());
        const groupCounts = sock.messageCounts.get(jid);

        const sub = (args[0] || "").toLowerCase();
        if (sub === "on") {
            if (!sock.trackingGroups) sock.trackingGroups = new Set();
            sock.trackingGroups.add(jid);
            return sock.sendMessage(jid, { text: "✅ Suivi des messages activé. Tapez .topmembers pour voir le classement." }, { quoted: msg });
        }
        if (sub === "off") {
            if (sock.trackingGroups) sock.trackingGroups.delete(jid);
            groupCounts.clear();
            return sock.sendMessage(jid, { text: "❌ Suivi désactivé." }, { quoted: msg });
        }

        // Afficher le classement
        if (!sock.trackingGroups || !sock.trackingGroups.has(jid)) {
            return sock.sendMessage(jid, { text: "❌ Le suivi n'est pas activé. Tapez .topmembers on pour l'activer." }, { quoted: msg });
        }

        const entries = Array.from(groupCounts.entries());
        if (entries.length === 0) {
            return sock.sendMessage(jid, { text: "Aucun message enregistré pour le moment." }, { quoted: msg });
        }

        entries.sort((a, b) => b[1] - a[1]);
        const top5 = entries.slice(0, 5);
        let text = "🏆 *TOP 5 MEMBRES*\n\n";
        top5.forEach(([participant, count], index) => {
            const num = participant.split("@")[0];
            text += `${index + 1}. @${num} : ${count} messages\n`;
        });
        const mentions = top5.map(e => e[0]);
        await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
    }
};
