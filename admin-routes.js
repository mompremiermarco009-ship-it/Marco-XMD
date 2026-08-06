/**
 * admin-routes.js
 * ------------------------------------------------------------
 * Routeur Express pour le dashboard admin MARCO-XMD.
 * Ne dépend d'AUCUN nouveau module : il utilise ce que index.js
 * expose déjà globalement (global.sessionsMap, global.startBotFunc).
 *
 * INTÉGRATION dans server.js :
 *
 *   const adminRoutes = require('./admin-routes.js');
 *   app.use('/api/admin', adminRoutes);
 *
 * C'est tout. Rien d'autre à modifier pour que ça marche.
 * (Section "logs" optionnelle : voir note en bas du fichier.)
 * ------------------------------------------------------------
 */

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const QRCode = require('qrcode');
const router = express.Router();

const ROOT = path.join(__dirname); // racine du projet (là où se trouve index.js)
const SESSIONS_DIR = path.join(ROOT, 'sessions');
// Liste des bannis : GLOBALE et partagée par toutes les sessions, car
// ban.js/unban.js écrivent dans './data/banned.json' (chemin relatif au
// CWD du process, donc la racine du projet) et non dans le dossier de
// la session. On respecte ce comportement existant plutôt que de le
// changer silencieusement.
const GLOBAL_BANNED_PATH = path.join(ROOT, 'data', 'banned.json');

// ---------- Helpers ----------

function getSessionsMap() {
    return global.sessionsMap || new Map();
}

function sessionConfigPath(sessionID) {
    return path.join(SESSIONS_DIR, sessionID, 'config.json');
}

function userGroupDataPath(sessionID) {
    return path.join(SESSIONS_DIR, sessionID, 'data', 'userGroupData.json');
}

function readJson(p, fallback) {
    if (!fs.existsSync(p)) return fallback;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch {
        return fallback;
    }
}

function writeJson(p, data) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function readSessionConfig(sessionID) {
    return readJson(sessionConfigPath(sessionID), null);
}

function writeSessionConfig(sessionID, data) {
    writeJson(sessionConfigPath(sessionID), data);
    // Met aussi à jour la config en mémoire du socket actif, si présent
    const sock = getSessionsMap().get(sessionID);
    if (sock) sock.config = data;
}

function readUserGroupData(sessionID) {
    return readJson(userGroupDataPath(sessionID), {
        antibadword: {}, antilink: {}, welcome: {}, goodbye: {},
        chatbot: {}, antimention: {}, warnings: {}, sudo: []
    });
}

function writeUserGroupData(sessionID, data) {
    writeJson(userGroupDataPath(sessionID), data);
}

function readGlobalBanned() {
    const data = readJson(GLOBAL_BANNED_PATH, []);
    return Array.isArray(data) ? data : [];
}

function writeGlobalBanned(list) {
    writeJson(GLOBAL_BANNED_PATH, list);
}

function toJid(number) {
    const clean = String(number).replace(/[^0-9]/g, '');
    return clean.includes('@') ? clean : `${clean}@s.whatsapp.net`;
}

function sessionExists(sessionID) {
    return fs.existsSync(path.join(SESSIONS_DIR, sessionID));
}

function notFound(res, msg = 'Session introuvable') {
    return res.status(404).json({ error: msg });
}

// Ring buffer de logs en mémoire (par session), 200 entrées max.
// Optionnel : appelable depuis index.js via global.addLog(id, action, description, severity)
global.botLogs = global.botLogs || new Map();
global.addLog = function (sessionID, action, description, severity = 'info') {
    if (!global.botLogs.has(sessionID)) global.botLogs.set(sessionID, []);
    const arr = global.botLogs.get(sessionID);
    arr.unshift({ timestamp: Date.now(), action, description, severity });
    if (arr.length > 200) arr.length = 200;
};

// ---------- Liste des sessions ----------

router.get('/sessions', (req, res) => {
    const map = getSessionsMap();
    const onDisk = fs.existsSync(SESSIONS_DIR) ? fs.readdirSync(SESSIONS_DIR) : [];

    const globalBannedCount = readGlobalBanned().length;

    const list = onDisk
        .filter(name => fs.statSync(path.join(SESSIONS_DIR, name)).isDirectory())
        .map(id => {
            const sock = map.get(id);
            const cfg = readSessionConfig(id) || {};
            const ugd = readUserGroupData(id);
            return {
                id,
                botName: cfg.botName || id,
                ownerNumber: cfg.ownerNumber || id,
                publicMode: cfg.publicMode !== false,
                isReady: !!(sock && sock.isReady),
                startTime: sock?.startTime || null,
                sudoCount: Array.isArray(ugd.sudo) ? ugd.sudo.length : 0,
                bannedCount: globalBannedCount, // partagé par toutes les sessions
                commandCount: sock?.commands ? sock.commands.size : 0
            };
        });

    res.json(list);
});

// Crée une nouvelle session par CODE D'APPARIEMENT
// Reprend fidèlement la logique de la route /pair de server.js (même
// séquence, même délai, même retry), pour éviter tout appel en double à
// requestPairingCode (index.js ne doit PAS recevoir forcePairing ici).
router.post('/sessions/pairing', async (req, res) => {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Numéro requis' });
    if (typeof global.startBotFunc !== 'function') {
        return res.status(500).json({ error: 'startBotFunc indisponible côté serveur' });
    }
    const num = String(phone).replace(/[^0-9]/g, '');
    if (num.length < 10) return res.status(400).json({ error: 'Numéro invalide.' });

    const map = getSessionsMap();
    let marcoInstance;
    try {
        marcoInstance = map.get(num);
        if (!marcoInstance) marcoInstance = await global.startBotFunc(num);
        await marcoInstance._pairingReadyPromise;
        await new Promise(r => setTimeout(r, 3000));
        let code;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                code = await marcoInstance.requestPairingCode(num, 'MARCOXMD');
                break;
            } catch (err) {
                if (attempt === 1) throw err;
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        res.json({ success: true, sessionID: num, code });
    } catch (err) {
        let message = 'Erreur lors de la génération du code.';
        if (err.output?.statusCode === 428) message = 'Connexion refusée (428). Utilisez le QR code.';
        else if (err.message?.includes('Timed Out')) message = 'La connexion WhatsApp a pris trop de temps.';
        if (marcoInstance) {
            try { marcoInstance.end(); marcoInstance.ev.removeAllListeners(); } catch {}
            map.delete(num);
        }
        res.status(500).json({ error: message });
    }
});

// Crée une nouvelle session par QR CODE
// NOTE : contrairement à la route /qr existante dans server.js (qui renvoie
// directement le texte brut du QR Baileys dans un <img src="..."> — ce qui
// ne fonctionne pas, un <img> a besoin d'une vraie image), ici on convertit
// le QR avec le paquet "qrcode" (déjà dans tes dépendances) en une vraie
// data URI PNG affichable.
router.post('/sessions/qr', async (req, res) => {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Numéro requis' });
    if (typeof global.startBotFunc !== 'function') {
        return res.status(500).json({ error: 'startBotFunc indisponible côté serveur' });
    }
    const num = String(phone).replace(/[^0-9]/g, '');
    if (num.length < 10) return res.status(400).json({ error: 'Numéro invalide.' });

    const map = getSessionsMap();
    const oldSock = map.get(num);
    if (oldSock) {
        try { oldSock.end(); oldSock.ev.removeAllListeners(); } catch {}
        map.delete(num);
    }
    let sock;
    try {
        sock = await global.startBotFunc(num, { needQR: true });
        const rawQR = await sock._qrPromise;
        const qrImage = await QRCode.toDataURL(rawQR);
        res.json({ success: true, sessionID: num, qr: qrImage });
    } catch (err) {
        if (sock) {
            try { sock.end(); sock.ev.removeAllListeners(); } catch {}
            map.delete(num);
        }
        res.status(500).json({ error: err.message || 'Erreur QR' });
    }
});

// Déconnecte / supprime une session
router.delete('/sessions/:id', async (req, res) => {
    const { id } = req.params;
    const map = getSessionsMap();
    const sock = map.get(id);
    try {
        if (sock) {
            try { sock.logout && await sock.logout(); } catch {}
            try { sock.end(); } catch {}
            map.delete(id);
        }
        const dir = path.join(SESSIONS_DIR, id);
        if (fs.existsSync(dir)) fs.removeSync(dir);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------- Sudo (équivalent "utilisateurs de confiance", par session) ----------
// Stocké dans sessions/<id>/data/userGroupData.json -> tableau "sudo" (JIDs bruts),
// exactement la structure utilisée par lib/index.js (isSudo/addSudo/removeSudo).

router.get('/sessions/:id/sudo', (req, res) => {
    const { id } = req.params;
    if (!sessionExists(id)) return notFound(res);
    const ugd = readUserGroupData(id);
    const list = (ugd.sudo || []).map(jid => ({ jid, number: jid.split('@')[0] }));
    res.json(list);
});

router.post('/sessions/:id/sudo', (req, res) => {
    const { id } = req.params;
    const { number } = req.body || {};
    if (!sessionExists(id)) return notFound(res);
    if (!number) return res.status(400).json({ error: 'Numéro requis' });

    const ugd = readUserGroupData(id);
    if (!Array.isArray(ugd.sudo)) ugd.sudo = [];
    const jid = toJid(number);
    if (ugd.sudo.includes(jid)) return res.status(409).json({ error: 'Déjà sudo' });
    ugd.sudo.push(jid);
    writeUserGroupData(id, ugd);
    global.addLog(id, 'sudo_add', `Ajout sudo : ${jid}`, 'info');
    res.json({ success: true });
});

router.delete('/sessions/:id/sudo/:number', (req, res) => {
    const { id, number } = req.params;
    if (!sessionExists(id)) return notFound(res);
    const ugd = readUserGroupData(id);
    const jid = toJid(number);
    ugd.sudo = (ugd.sudo || []).filter(j => j !== jid);
    writeUserGroupData(id, ugd);
    global.addLog(id, 'sudo_remove', `Retrait sudo : ${jid}`, 'info');
    res.json({ success: true });
});

// ---------- Bannis ----------
// IMPORTANT : ban.js / unban.js écrivent dans './data/banned.json' avec un
// chemin relatif au process (donc la racine du projet), PAS dans le dossier
// de la session. La liste des bannis est donc GLOBALE, partagée par tous
// les bots. On respecte ce comportement plutôt que de le changer en douce.
// C'est un tableau plat de JIDs, sans nom/raison/date.

router.get('/banned', (req, res) => {
    const list = readGlobalBanned().map(jid => ({ jid, number: jid.split('@')[0] }));
    res.json(list);
});

router.post('/banned', (req, res) => {
    const { number } = req.body || {};
    if (!number) return res.status(400).json({ error: 'Numéro requis' });
    const jid = toJid(number);
    const list = readGlobalBanned();
    if (list.includes(jid)) return res.status(409).json({ error: 'Déjà banni' });
    list.push(jid);
    writeGlobalBanned(list);
    res.json({ success: true });
});

router.delete('/banned/:number', (req, res) => {
    const { number } = req.params;
    const jid = toJid(number);
    const list = readGlobalBanned().filter(j => j !== jid);
    writeGlobalBanned(list);
    res.json({ success: true });
});

// ---------- Commandes ----------

router.get('/sessions/:id/commands', (req, res) => {
    const { id } = req.params;
    const sock = getSessionsMap().get(id);
    if (!sock || !sock.commands) return res.json([]);

    // Les plugins de MARCO-XMD utilisent tantôt "desc", tantôt "description" :
    // on gère les deux pour ne rien afficher de vide inutilement.
    const list = Array.from(sock.commands.values()).map(p => ({
        name: p.name,
        description: p.desc || p.description || '',
        category: p.category || 'general',
        aliases: p.alias || p.aliases || []
    }));
    res.json(list);
});

// ---------- Logs ----------

router.get('/sessions/:id/logs', (req, res) => {
    const { id } = req.params;
    res.json(global.botLogs.get(id) || []);
});

// ---------- Paramètres ----------

router.get('/sessions/:id/settings', (req, res) => {
    const { id } = req.params;
    if (!sessionExists(id)) return notFound(res);
    const cfg = readSessionConfig(id) || {};
    res.json({
        botName: cfg.botName || id,
        ownerName: cfg.ownerName || '',
        ownerNumber: cfg.ownerNumber || id,
        emoji: cfg.emoji || '🍷',
        prefix: cfg.prefix || '.',
        publicMode: cfg.publicMode !== false,
        // Le seuil d'avertissement est codé en dur à 3 dans plugins/warn.js,
        // il n'existe pas comme champ de config modifiable. Affiché en lecture seule.
        maxWarn: 3
    });
});

router.post('/sessions/:id/settings', (req, res) => {
    const { id } = req.params;
    if (!sessionExists(id)) return notFound(res);
    const cfg = readSessionConfig(id) || {};
    const { botName, ownerName, ownerNumber, emoji, prefix, publicMode } = req.body || {};
    if (botName !== undefined) cfg.botName = botName;
    if (ownerName !== undefined) cfg.ownerName = ownerName;
    if (ownerNumber !== undefined) cfg.ownerNumber = String(ownerNumber).replace(/[^0-9]/g, '');
    if (emoji !== undefined) cfg.emoji = emoji;
    if (prefix !== undefined) cfg.prefix = prefix;
    if (publicMode !== undefined) cfg.publicMode = !!publicMode;
    writeSessionConfig(id, cfg);
    global.addLog(id, 'settings_update', 'Paramètres mis à jour', 'info');
    res.json({ success: true });
});

module.exports = router;

/**
 * NOTE — Logs automatiques (optionnel) :
 * Pour que la page "Logs" du dashboard se remplisse toute seule
 * (connexions, commandes exécutées, erreurs), ajoute ces 3 lignes
 * dans index.js aux endroits indiqués :
 *
 * 1) Dans le bloc `if (connection === 'open')` :
 *      global.addLog?.(sessionID, 'connection', `${sessionID} en ligne`, 'info');
 *
 * 2) Dans le bloc `if (connection === 'close')` :
 *      global.addLog?.(sessionID, 'disconnection', `${sessionID} déconnecté`, 'warning');
 *
 * 3) Dans le catch de l'exécution d'un plugin :
 *      global.addLog?.(sessionID, 'command_error', `${cmd} : ${err.message}`, 'error');
 *
 * Le `?.` évite toute erreur si admin-routes.js n'est pas encore monté.
 */
