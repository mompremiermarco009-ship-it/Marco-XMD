// utils/uptime.js — Gestion centralisée de l'uptime
// Fournit deux mesures :
//   - Global  : depuis le démarrage du processus Node
//   - Session : depuis la connexion de la session WhatsApp (sock.startTime)

/**
 * Formate une durée en millisecondes en texte lisible
 * Ex: "2j 5h 12m 30s"
 */
function formatUptime(ms) {
    if (!ms || ms < 0) return '0s';
    const sec = Math.floor(ms / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    let out = '';
    if (days > 0) out += `${days}j `;
    if (hours > 0 || days > 0) out += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) out += `${minutes}m `;
    out += `${seconds}s`;
    return out.trim();
}

/**
 * Uptime global : temps écoulé depuis le démarrage du processus Node
 * @returns {string}
 */
function getGlobalUptime() {
    return formatUptime(Date.now() - (global.startTime || Date.now()));
}

/**
 * Uptime de la session : temps écoulé depuis la connexion WhatsApp
 * @param {object} sock - Socket Baileys
 * @returns {string}
 */
function getSessionUptime(sock) {
    if (!sock || !sock.startTime) return '0s';
    return formatUptime(Date.now() - sock.startTime);
}

/**
 * Retourne les deux uptimes sous forme d'objet
 * @param {object} sock - Socket Baileys
 * @returns {{global: string, session: string}}
 */
function getUptimes(sock) {
    return {
        global: getGlobalUptime(),
        session: getSessionUptime(sock)
    };
}

module.exports = {
    formatUptime,
    getGlobalUptime,
    getSessionUptime,
    getUptimes
};
