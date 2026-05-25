// utils/auth.js
const config = require("../config.json");

function isAuthorized(sock, msg, cfg = config) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.replace(/[^0-9]/g, '');

    // 1. Propriétaire défini dans config.json (optionnel)
    if (cfg.ownerNumber && senderNumber === cfg.ownerNumber.replace(/[^0-9]/g, '')) {
        return true;
    }

    // 2. L'utilisateur qui a connecté le bot (numéro du socket)
    if (sock.user && sock.user.id) {
        const botNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
        if (senderNumber === botNumber) return true;
    }

    // 3. Mode public (tout le monde peut utiliser les commandes)
    if (cfg.publicMode === true) return true;

    return false;
}

// Normalisation d'un numéro (supprime les caractères non numériques)
function normalizeNumber(raw) {
    return raw.replace(/[^0-9]/g, '');
}

module.exports = { isAuthorized, normalizeNumber };
