// pairing.js – gère le choix entre code d'appariement et QR code
(function() {
    const pairingView = document.getElementById('pairingView');
    const mainMenu = document.getElementById('mainMenu');
    const btnBack = document.getElementById('btnBack');
    const phoneInput = document.getElementById('phone');
    const statusText = document.getElementById('statusText');
    const inputArea = document.getElementById('inputArea');
    const resultArea = document.getElementById('resultArea');
    const codeDisplay = document.getElementById('codeDisplay');
    const copyBtn = document.getElementById('copyBtn');
    const retryBtn = document.getElementById('retryBtn');

    // On va ajouter dynamiquement le deuxième bouton
    function showPairingView(mode) {
        // mode = 'pair' ou 'qr'
        mainMenu.style.display = 'none';
        pairingView.classList.remove('hidden');
        inputArea.classList.remove('hidden');
        resultArea.classList.add('hidden');
        statusText.textContent = mode === 'pair' 
            ? 'Connectez votre compte en générant un code de couplage.'
            : 'Scannez le QR code qui va apparaître.';

        // Réinitialiser le champ numéro
        phoneInput.value = '';

        // Remplacer le bouton "Générer le code" par le bouton approprié
        // Supprimer l'ancien bouton s'il existe
        const oldBtn = document.getElementById('actionBtn');
        if (oldBtn) oldBtn.remove();

        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.id = 'actionBtn';
        if (mode === 'pair') {
            btn.textContent = 'Générer le code';
            btn.onclick = generatePairingCode;
        } else {
            btn.textContent = 'Afficher le QR Code';
            btn.onclick = showQRCode;
        }
        inputArea.appendChild(btn);
    }

    // Code d'appariement (comportement actuel)
    async function generatePairingCode() {
        let num = phoneInput.value.trim().replace(/[^0-9]/g, '');
        if (num.length < 10) {
            alert('Numéro invalide (doit contenir au moins 10 chiffres).');
            return;
        }
        const actionBtn = document.getElementById('actionBtn');
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<span class="loading-spinner"></span> Génération...';
        try {
            const response = await fetch(`/pair?number=${encodeURIComponent(num)}`);
            const data = await response.json();
            if (response.ok) {
                codeDisplay.textContent = data.code;
                inputArea.classList.add('hidden');
                resultArea.classList.remove('hidden');
            } else {
                alert(data.error || 'Erreur inconnue');
            }
        } catch (err) {
            alert('Erreur réseau ou serveur indisponible.');
        } finally {
            actionBtn.disabled = false;
            actionBtn.textContent = 'Générer le code';
        }
    }

    // QR Code : redirige vers /qr?number=...
    function showQRCode() {
        let num = phoneInput.value.trim().replace(/[^0-9]/g, '');
        if (num.length < 10) {
            alert('Numéro invalide (doit contenir au moins 10 chiffres).');
            return;
        }
        // Ouvrir dans un nouvel onglet pour ne pas perdre l'interface
        window.open(`/qr?number=${encodeURIComponent(num)}`, '_blank');
    }

    // Retour
    btnBack.addEventListener('click', () => {
        pairingView.classList.add('hidden');
        mainMenu.style.display = '';
        // Nettoyage
        const oldBtn = document.getElementById('actionBtn');
        if (oldBtn) oldBtn.remove();
    });

    retryBtn.addEventListener('click', () => {
        resultArea.classList.add('hidden');
        inputArea.classList.remove('hidden');
        phoneInput.value = '';
        const btn = document.getElementById('actionBtn');
        if (btn) btn.disabled = false;
    });

    copyBtn.addEventListener('click', () => {
        const code = codeDisplay.textContent.trim();
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.textContent = 'Copié !';
                setTimeout(() => copyBtn.textContent = 'Copier le code', 2000);
            });
        }
    });

    // Exposer les fonctions pour les boutons dans index.html
    window.showPairing = (mode) => showPairingView(mode);
})();
