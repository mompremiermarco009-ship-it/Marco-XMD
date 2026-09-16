/**
 * admin-routes.js — version allégée
 * Routeur Express pour le dashboard admin MARCO-XMD.
 * Utilise global.sessionsMap et global.startBotFunc exposés par index.js.
 */

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const QRCode = require('qrcode');
const router = express.Router();

const SESSIONS_DIR = path.join(__dirname, 'sessions');

// ---------- Helpers ----------

function getSessionsMap() {
    return global.sessionsMap || new Map();
}

function sessionExists(sessionID) {
    return fs.existsSync(path.join(SESSIONS_DIR, sessionID));
}

function sessionConfigPath(sessionID) {
    return path.join(SESSIONS_DIR, sessionID, 'config.json');
}

function readJson(p, fallback) {
    if (!fs.existsSync(p)) return fallback;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return fallback; }
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
    const sock = getSessionsMap().get(sessionID);
    if (sock) sock.config = data;
}

function notFound(res, msg = 'Session introuvable') {
    return res.status(404).json({ error: msg });
}

// ---------- Liste des sessions ----------

router.get('/sessions', (req, res) => {
    const map = getSessionsMap();
    const onDisk = fs.existsSync(SESSIONS_DIR) ? fs.readdirSync(SESSIONS_DIR) : [];

    const list = onDisk
        .filter(name => fs.statSync(path.join(SESSIONS_DIR, name)).isDirectory())
        .map(id => {
            const sock = map.get(id);
            const cfg = readSessionConfig(id) || {};
            return {
                id,
                botName: cfg.botName || id,
                ownerNumber: cfg.ownerNumber || id,
                publicMode: cfg.publicMode !== false,
                isReady: !!(sock && sock.isReady),
                startTime: sock?.startTime || null,
                commandCount: sock?.commands ? sock.commands.size : 0
            };
        });

    res.json(list);
});

// ---------- Création par code d'appariement ----------

router.post('/sessions/pairing', async (req, res) => {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Numéro requis' });
    if (typeof global.startBotFunc !== 'function') {
        return res.status(500).json({ error: 'startBotFunc indisponible' });
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
        if (marcoInstance) {
            try { marcoInstance.end(); marcoInstance.ev.removeAllListeners(); } catch {}
            map.delete(num);
        }
        res.status(500).json({ error: err.message || 'Erreur pairing' });
    }
});

// ---------- Création par QR ----------

router.post('/sessions/qr', async (req, res) => {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Numéro requis' });
    if (typeof global.startBotFunc !== 'function') {
        return res.status(500).json({ error: 'startBotFunc indisponible' });
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

// ---------- Suppression d'une session ----------

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

// ---------- Commandes ----------

router.get('/sessions/:id/commands', (req, res) => {
    const { id } = req.params;
    const sock = getSessionsMap().get(id);
    if (!sock || !sock.commands) return res.json([]);

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
    res.json(global.botLogs?.get(id) || []);
});

// ---------- Paramètres (get/set) ----------

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
        logo: cfg.logo || '',
        logoConnect: cfg.logoConnect || '',
        publicMode: cfg.publicMode !== false,
        reactstatus: cfg.reactstatus !== false
    });
});

router.post('/sessions/:id/settings', (req, res) => {
    const { id } = req.params;
    if (!sessionExists(id)) return notFound(res);
    const cfg = readSessionConfig(id) || {};
    const { botName, ownerName, ownerNumber, emoji, prefix, logo, logoConnect, publicMode, reactstatus } = req.body || {};
    if (botName !== undefined) cfg.botName = botName;
    if (ownerName !== undefined) cfg.ownerName = ownerName;
    if (ownerNumber !== undefined) cfg.ownerNumber = String(ownerNumber).replace(/[^0-9]/g, '');
    if (emoji !== undefined) cfg.emoji = emoji;
    if (prefix !== undefined) cfg.prefix = prefix;
    if (logo !== undefined) cfg.logo = logo;
    if (logoConnect !== undefined) cfg.logoConnect = logoConnect;
    if (publicMode !== undefined) cfg.publicMode = !!publicMode;
    if (reactstatus !== undefined) cfg.reactstatus = !!reactstatus;
    writeSessionConfig(id, cfg);
    res.json({ success: true });
});

module.exports = router;
