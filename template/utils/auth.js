// utils/auth.js – version optimisée
function normalizeNumber(raw) {
    if (!raw) return "";
    // Extrait la partie numérique avant '@' ou ':'
    const match = String(raw).split('@')[0].split(':')[0];
    return match.replace(/[^0-9]/g, '');
}

function getSenderNumber(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid || "";
    return normalizeNumber(sender);
}

function isAuthorized(sock, msg, cfg = {}) {
    if (!msg || !msg.key) return false;

    const senderNumber = getSenderNumber(sock, msg);

    // 1. Propriétaire unique
    if (cfg.ownerNumber && senderNumber === normalizeNumber(cfg.ownerNumber)) {
        return true;
    }

    // 2. Plusieurs propriétaires (ownerNumbers)
    if (Array.isArray(cfg.ownerNumbers)) {
        if (cfg.ownerNumbers.some(num => normalizeNumber(num) === senderNumber)) {
            return true;
        }
    }

    // 3. L'utilisateur qui a connecté le bot
    if (sock.user && sock.user.id) {
        const botNumber = normalizeNumber(sock.user.id);
        if (senderNumber === botNumber) return true;
    }

    // 4. Mode public
    if (cfg.publicMode === true) return true;

    return false;
}

module.exports = { isAuthorized, normalizeNumber, getSenderNumber };
