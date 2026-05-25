// events/messageCount.js
module.exports = {
    name: "messages.upsert",
    async execute(sock, { messages }) {
        if (!sock.trackingGroups || sock.trackingGroups.size === 0) return;
        for (const msg of messages) {
            const jid = msg.key.remoteJid;
            if (!jid.endsWith("@g.us")) continue;
            if (!msg.message) continue;
            if (msg.key.fromMe) continue;
            if (!sock.trackingGroups.has(jid)) continue;

            if (!sock.messageCounts) sock.messageCounts = new Map();
            if (!sock.messageCounts.has(jid)) sock.messageCounts.set(jid, new Map());
            const groupCounts = sock.messageCounts.get(jid);
            const participant = msg.key.participant || msg.key.remoteJid;
            groupCounts.set(participant, (groupCounts.get(participant) || 0) + 1);
        }
    }
};
