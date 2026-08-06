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
global.sessionsMap = sessions;

function ensureSessionDir(sessionID) {
    const sessionDir = path.join(__dirname, 'sessions', sessionID);
    const templateDir = path.join(__dirname, 'template');
    if (!fs.existsSync(sessionDir)) {
        fs.copySync(templateDir, sessionDir);
        console.log(`📁 Nouvelle session créée : ${sessionID}`);
    }
    return sessionDir;
}

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
    console.log(`📦 [${path.basename(sessionDir)}] : ${commands.size} Plugins chargés`);
    return commands;
}

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
    let sessionConfig = require(sessionConfigPath);

    if (sessions.has(sessionID) && sessions.get(sessionID).isReady) {
        console.log(`⚠️ La session ${sessionID} est déjà active.`);
        return sessions.get(sessionID);
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const forceQR = options.forceQR || false;

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: forceQR,
        browser: Browsers.ubuntu("Chrome"),
        auth: { creds: state.creds, keys: state.keys },
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 25_000,
    });

    sock.config = sessionConfig;
    sock.commands = loadPlugins(sessionDir);
    sock.isReady = false;
    sessions.set(sessionID, sock);

    // ══════════════════════════════════════════
    // TRAITEMENT DES MESSAGES DIRECTEMENT ICI
    // ══════════════════════════════════════════
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const cfg = sock.config;
        for (const msg of messages) {
            if (!msg.message) continue;
            if (msg.key.remoteJid === "status@broadcast") continue;
            if (!sock.readyAt) continue;

            const msgTime = msg.messageTimestamp * 1000;
            if (isNaN(msgTime) || msgTime < sock.readyAt) continue;

            const jid = msg.key.remoteJid;

            let texte = "";
            const m = msg.message;
            if (m.conversation) texte = m.conversation;
            else if (m.extendedTextMessage) texte = m.extendedTextMessage.text;
            else if (m.imageMessage) texte = m.imageMessage.caption;
            else if (m.videoMessage) texte = m.videoMessage.caption;
            else if (m.documentMessage) texte = m.documentMessage.caption;
            if (!texte) continue;

            const prefix = cfg.prefix || ".";
            if (!texte.startsWith(prefix)) continue;

            const args = texte.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift()?.toLowerCase();
            if (!cmd) continue;
            const commandArgs = args;

            let plugin = sock.commands.get(cmd);
            if (!plugin) {
                for (const p of sock.commands.values()) {
                    if ((p.alias && p.alias.includes(cmd)) || (p.aliases && p.aliases.includes(cmd))) {
                        plugin = p;
                        break;
                    }
                }
            }

            if (plugin && typeof plugin.execute === "function") {
                try {
                    await plugin.execute(sock, msg, commandArgs, cmd);
                    console.log(`✅ [${cfg.botName}] Commande exécutée : ${cmd}`);
                } catch (err) {
                    console.error(`❌ Erreur plugin ${cmd}:`, err);
                }
            }
        }
    });

    // Attacher les autres événements (welcome, call, etc.) depuis le dossier de session
    const eventsPath = path.join(sessionDir, "events");
    if (fs.existsSync(eventsPath)) {
        fs.readdirSync(eventsPath).forEach(file => {
            if (file.endsWith('.js') && file !== 'index.js' && file !== 'messages.upsert.js') {
                try {
                    const eventModule = require(path.join(eventsPath, file));
                    if (eventModule.name && typeof eventModule.execute === 'function') {
                        console.log('📌 Enregistrement événement :', eventModule.name);
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

    sock.ev.on('creds.update', saveCreds);

    if (options.needQR) {
        sock._qrPromise = new Promise((resolve, reject) => {
            const qrHandler = (update) => {
                if (update.qr) { sock.ev.off('connection.update', qrHandler); resolve(update.qr); }
            };
            sock.ev.on('connection.update', qrHandler);
            setTimeout(() => { sock.ev.off('connection.update', qrHandler); reject(new Error("QR code non reçu")); }, 180_000);
        });
    }

    sock._pairingReadyPromise = new Promise((resolve) => {
        const handler = (update) => {
            if (update.connection === 'connecting' || update.connection === 'open') {
                sock.ev.off('connection.update', handler); resolve();
            }
        };
        sock.ev.on('connection.update', handler);
    });

    if (options.forcePairing) {
        (async () => {
            try {
                await sock._pairingReadyPromise;
                await new Promise(r => setTimeout(r, 3000));
                let code;
                try {
                    code = await sock.requestPairingCode(sessionID, "MARCOXMD");
                    console.log(`\n🔑 CODE DE PAIRING pour ${sessionID} : ${code} (personnalisé MARCOXMD)\n`);
                } catch {
                    code = await sock.requestPairingCode(sessionID, undefined);
                    console.log(`\n🔑 CODE DE PAIRING pour ${sessionID} : ${code} (standard)\n`);
                }
                console.log("Entrez ce code dans WhatsApp > Appareils connectés > Se connecter avec le numéro de téléphone");
            } catch (err) {
                console.error("❌ Échec du code de pairing :", err.message);
                console.log("⚠️  Basculement sur l'affichage du QR code...");
                try { sock.end(); } catch {}
                sessions.delete(sessionID);
                startBot(sessionID, { forceQR: true });
            }
        })();
    }

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

global.startBotFunc = startBot;

// ==================== INITIALISATION ====================
startServer(startBot, sessions);

let autoNumber = null;
if (process.argv[2]) autoNumber = process.argv[2].replace(/[^0-9]/g, '');
if (!autoNumber) {
    const numberFile = path.join(__dirname, 'number');
    if (fs.existsSync(numberFile)) {
        autoNumber = fs.readFileSync(numberFile, 'utf-8').trim().replace(/[^0-9]/g, '');
    }
}

if (autoNumber && autoNumber.length >= 10) {
    const sessionDir = ensureSessionDir(autoNumber);
    const credsPath = path.join(sessionDir, 'creds.json');
    if (fs.existsSync(credsPath)) {
        console.log(`📱 Session existante trouvée pour ${autoNumber}, reconnexion automatique...`);
        startBot(autoNumber);
    } else {
        console.log(`📱 Lancement automatique de la session pour ${autoNumber}...`);
        startBot(autoNumber, { forcePairing: true });
    }
} else {
    startBot();
}

process.on('uncaughtException', (err) => console.error('CRITICAL ERROR:', err));
process.on('unhandledRejection', (reason) => console.error('UNHANDLED REJECTION:', reason));
