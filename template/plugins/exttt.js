// plugins/exttt.js
module.exports = {
    name: 'exttt',
    aliases: ['ttthelp', 'helpttt', 'infottt', 'morpionhelp'],
    description: 'Affiche le guide complet pour jouer au Morpion',
    usage: '.exttt',

    async execute(sock, message, args, { config }) {
        const jid = message.key.remoteJid;

        const guide = `🎮 *GUIDE COMPLET DU MORPION (Tic Tac Toe)*

━━━━━━━━━━━━━━━━━━
📌 *Commandes principales*
.config

🔹 *Défier un joueur (groupe)*
  .ttt @membre
▸ Exemple : .ttt @Jean

🔹 *Accepter un défi (groupe)*
  .ttt accept
▸ Seule la personne défiée peut accepter.

🔹 *Jouer contre le bot (privé)*
  .ttt
▸ Lance une partie solo contre l'IA.

🔹 *Placer un pion*
  .ttt <case>
▸ Formats acceptés :
  • Lettre+chiffre : A1, B2, C3, a1, b3
  • Chiffre+Lettre : 1A, 2B, 3c
  • Chiffre seul (1 à 9) :
      1 2 3
      4 5 6
      7 8 9

━━━━━━━━━━━━━━━━━━
🧩 *Règles du jeu*

• Grille 3x3, 2 joueurs (X et O)
• Chacun place un pion à tour de rôle.
• Le premier à aligner 3 pions (ligne, colonne, diagonale) gagne.
• Si toutes les cases sont remplies sans vainqueur → match nul.

━━━━━━━━━━━━━━━━━━
🎲 *Modes disponibles*

1️⃣ *Groupe – Joueur vs Joueur*
  • Un membre défie un autre avec .ttt @membre
  • Le défié tape .ttt accept
  • Le joueur X (celui qui a défié) commence.
  • Ensuite, chaque joueur tape .ttt <case> à son tour.

2️⃣ *Privé – Joueur vs Bot*
  • Tapez .ttt seul pour affronter l'IA (vous êtes X).
  • Le bot répond automatiquement après votre coup.

━━━━━━━━━━━━━━━━━━
🕒 *Expiration*
  Les défis en attente expirent après 60 secondes.

━━━━━━━━━━━━━━━━━━
⚡ *Astuces*
  • Pendant une partie, n'utilisez pas d'autres commandes .ttt qui pourraient interférer.
  • En groupe, seuls les joueurs impliqués peuvent jouer.
  • Le bot vous prévient si vous tentez de jouer hors tour ou sur une case occupée.

━━━━━━━━━━━━━━━━━━
*Besoin d’aide supplémentaire ?* Contacte l'admin du bot.`;

        await sock.sendMessage(jid, { text: guide }, { quoted: message });
    }
};
