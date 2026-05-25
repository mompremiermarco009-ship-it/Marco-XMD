const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const config = require("./config.json");
const { startServer } = require("./server.js");

const sessions = new Map();

// Copie le template dans la session si elle n'existe pas
function ensureSessionDir(sessionID) {
    const sessionDir = path.join(__dirname, 'sessions', sessionID);
    const templateDir = path.join(__dirname, 'template');

    if (!fs.existsSync(sessionDir)) {
        fs.copySync(templateDir, sessionDir);
        console.log(`📁 Nouvelle session créée : ${sessionID}`);
    }
    return sessionDir;
}

// Charge les plugins depuis le dossier de la session
function loadPlugins(sessionDir) {
    const pluginPath = path.join(sessionDir, "plugins");
    const commands = new Map();
    if (!fs.existsSync(pluginPath)) return commands;

    fs.readdirSync(pluginPath).forEach((file) => {
        if (file.endsWith(".js")) {
            try {
                const plugin = require(path.join(pluginPath, file));
                if (plugin.name) commands.set(plugin.name, plugin);
            } catch (e) {
                console.error(`❌ Erreur plugin ${file}:`, e.message);
            }
        }
    });
    const id = path.basename(sessionDir);
    console.log(`📦 [${id}] : ${commands.size} Plugins chargés`);
    return commands;
}

// Attache les événements depuis le dossier de la session
function attachEvents(sock, sessionDir) {
    const eventsPath = path.join(sessionDir, "events");
    if (!fs.existsSync(eventsPath)) return;

    fs.readdirSync(eventsPath).forEach(file => {
        if (file.endsWith('.js') && file !== 'index.js') {
            try {
                const eventModule = require(path.join(eventsPath, file));
                if (eventModule.name && typeof eventModule.execute === 'function') {
                    sock.ev.on(eventModule.name, (...args) => {
                        eventModule.execute(sock, ...args, {
                            plugins: sock.commands,
                            config: sock.config,
                            startBotFunc: startBot,
                            sessionsMap: sessions
                        }).catch(err => console.error(`❌ Erreur ${eventModule.name}:`, err));
                    });
                } else if (typeof eventModule === 'function') {
                    eventModule(sock, null, sock.commands);
                }
            } catch (err) {
                console.error(`❌ Erreur événement ${file}:`, err.message);
            }
        }
    });
}

// Démarre une session
async function startBot(phoneNumber = null, options = {}) {
    if (!phoneNumber) {
        const sessionsDir = path.join(__dirname, 'sessions');
        if (fs.existsSync(sessionsDir)) {
            const existing = fs.readdirSync(sessionsDir);
            for (const name of existing) {
                if (fs.statSync(path.join(sessionsDir, name)).isDirectory()) {
                    console.log(`🔄 Reconnexion automatique : ${name}`);
                    startBot(name);
                }
            }
        }
        return;
    }

    const sessionID = phoneNumber.replace(/[^0-9]/g, '');
    const sessionDir = ensureSessionDir(sessionID);
    const sessionConfigPath = path.join(sessionDir, 'config.json');

    // Charger la config de la session
    let sessionConfig = require(sessionConfigPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        auth: {
            creds: state.creds,
            keys: state.keys,
        },
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 25_000,
    });

    sock.config = sessionConfig;
    sock.commands = loadPlugins(sessionDir);
    sock.isReady = false;
    sessions.set(sessionID, sock);

    sock.ev.on('creds.update', saveCreds);
    attachEvents(sock, sessionDir);

    if (options.needQR) {
        sock._qrPromise = new Promise((resolve, reject) => {
            const qrHandler = (update) => {
                if (update.qr) {
                    sock.ev.off('connection.update', qrHandler);
                    resolve(update.qr);
                }
            };
            sock.ev.on('connection.update', qrHandler);
            setTimeout(() => {
                sock.ev.off('connection.update', qrHandler);
                reject(new Error("QR code non reçu"));
            }, 180_000);
        });
    }

    sock._pairingReadyPromise = new Promise((resolve) => {
        const handler = (update) => {
            if (update.connection === 'connecting' || update.connection === 'open') {
                sock.ev.off('connection.update', handler);
                resolve();
            }
        };
        sock.ev.on('connection.update', handler);
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        console.log(`🔄 [${sessionID}] connection.update:`, JSON.stringify({ connection, qr: qr ? 'QR available' : undefined }));

        if (connection === 'open') {
            sock.isReady = true;
            sock.readyAt = Date.now();
            sock.startTime = Date.now();
            console.log(`✅ [${sessionID}] est en ligne !`);
        }

        if (connection === 'close') {
            sock.isReady = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`⚠️ [${sessionID}] Connexion perdue. Reconnexion : ${shouldReconnect}`);
            try { sock.ev.removeAllListeners(); } catch {}
            sessions.delete(sessionID);
            if (shouldReconnect) {
                setTimeout(() => startBot(sessionID), 15000);
            } else {
                console.log(`🗑️ Session ${sessionID} supprimée (déconnexion définitive).`);
            }
        }
    });

    return sock;
}

// Initialisation
startServer(startBot, sessions);
startBot();

process.on('uncaughtException', (err) => console.error('CRITICAL ERROR:', err));
process.on('unhandledRejection', (reason) => console.error('UNHANDLED REJECTION:', reason));
