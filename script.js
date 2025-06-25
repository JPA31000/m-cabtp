// script.js

// Attend que le contenu de la page soit entièrement chargé pour exécuter le script
document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES ---
    // On sélectionne tous les éléments HTML dont on aura besoin
    const chargeGInput = document.getElementById('chargeG');
    const valeurG = document.getElementById('valeurG');
    const chargeQInput = document.getElementById('chargeQ');
    const valeurQ = document.getElementById('valeurQ');
    const calculCharge = document.getElementById('calculCharge');
    const poutreVisu = document.getElementById('poutreVisu');

    const poutreCanvas = document.getElementById('poutreCanvas');
    const ctx = poutreCanvas.getContext('2d');
    const reactionA = document.getElementById('reactionA');
    const reactionB = document.getElementById('reactionB');

    const poutreLargeurInput = document.getElementById('poutreLargeur');
    const valeurLargeur = document.getElementById('valeurLargeur');
    const poutreHauteurInput = document.getElementById('poutreHauteur');
    const valeurHauteur = document.getElementById('valeurHauteur');
    const sectionVisu = document.getElementById('sectionVisu');
    const valeurI = document.getElementById('valeurI');
    const valeurContrainte = document.getElementById('valeurContrainte');
    const verdict = document.getElementById('verdict');

    // Constantes pour les calculs (on peut les ajuster)
    const LONGUEUR_POUTRE = 5; // en mètres
    const RESISTANCE_ACIER_ADM = 235; // en MPa (MegaPascals)

    // --- FONCTION PRINCIPALE DE MISE À JOUR ---
    // Cette fonction sera appelée à chaque fois qu'un curseur est modifié
    function mettreAJourToutesLesValeurs() {
        // --- Onglet 1: Calcul des charges ---
        const g = parseFloat(chargeGInput.value);
        const q = parseFloat(chargeQInput.value);

        valeurG.textContent = g;
        valeurQ.textContent = q;

        const chargeTotale = 1.35 * g + 1.5 * q;
        calculCharge.innerHTML = `1.35 * ${g} + 1.5 * ${q} = <strong>${chargeTotale.toFixed(2)}</strong> kN/m`;
        
        // On modifie la couleur de la poutre pour visualiser l'intensité de la charge
        const chargeRatio = Math.min((chargeTotale / 50), 1); // 50 kN/m = charge max visuelle
        poutreVisu.style.background = `linear-gradient(to right, #d9534f, hsl(0, 76%, ${85 - chargeRatio * 30}%))`;


        // --- Onglet 2: Calcul de l'équilibre ---
        const chargeTotaleEnNewtons = chargeTotale * 1000; // Conversion kN/m -> N/m
        const forceTotale = chargeTotaleEnNewtons * LONGUEUR_POUTRE;
        
        // Pour une poutre sur deux appuis simples avec charge uniforme, les réactions sont égales
        const ra = forceTotale / 2;
        const rb = forceTotale / 2;
        
        reactionA.textContent = (ra / 1000).toFixed(2); // On affiche en kN
        reactionB.textContent = (rb / 1000).toFixed(2);
        
        dessinerPoutreEquilibre(chargeTotale, (ra / 1000), (rb / 1000));


        // --- Onglet 3: Calcul de la mécanique et résistance ---
        const b_cm = parseFloat(poutreLargeurInput.value);
        const h_cm = parseFloat(poutreHauteurInput.value);
        
        valeurLargeur.textContent = b_cm;
        valeurHauteur.textContent = h_cm;

        // Mise à jour de la visualisation de la section
        sectionVisu.style.width = `${b_cm * 2}px`; // On multiplie pour que ce soit visible
        sectionVisu.style.height = `${h_cm * 1}px`; // idem

        // Calcul du moment quadratique I en cm⁴
        const I_cm4 = (b_cm * Math.pow(h_cm, 3)) / 12;
        valeurI.textContent = I_cm4.toFixed(0);

        // Calcul du Moment de flexion maximal (pour une poutre sur 2 appuis et charge uniforme)
        // Formule M_max = (w * L^2) / 8
        const M_max_kNm = (chargeTotale * Math.pow(LONGUEUR_POUTRE, 2)) / 8;
        
        // Calcul de la contrainte maximale (Sigma)
        // Formule: sigma = (M * y) / I
        // On doit être cohérent avec les unités !
        // M en N.mm : M_max_kNm * 10^6
        // y en mm : (h_cm / 2) * 10
        // I en mm^4 : I_cm4 * 10^4
        const M_max_Nmm = M_max_kNm * 1e6;
        const y_mm = (h_cm / 2) * 10;
        const I_mm4 = I_cm4 * 1e4;
        
        let contrainte_MPa = 0;
        if (I_mm4 > 0) {
            contrainte_MPa = (M_max_Nmm * y_mm) / I_mm4;
        }
        valeurContrainte.textContent = contrainte_MPa.toFixed(2);

        // Verdict final
        if (contrainte_MPa <= RESISTANCE_ACIER_ADM) {
            verdict.textContent = "SÉCURITAIRE : La contrainte est inférieure à la résistance du matériau.";
            verdict.className = 'verdict-securitaire';
        } else {
            verdict.textContent = "RISQUE DE RUPTURE : La contrainte dépasse la résistance du matériau !";
            verdict.className = 'verdict-danger';
        }
    }
    
    // --- FONCTION POUR DESSINER LA POUTRE SUR LE CANVAS (ONGLET 2) ---
    function dessinerPoutreEquilibre(charge, ra, rb) {
        ctx.clearRect(0, 0, poutreCanvas.width, poutreCanvas.height); // On efface le canvas
        
        const yPoutre = 100;
        const xStart = 50;
        const xEnd = 450;
        
        // Dessin de la poutre
        ctx.fillStyle = '#555';
        ctx.fillRect(xStart, yPoutre, xEnd - xStart, 10);
        
        // Dessin de la charge (flèches vers le bas)
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        for (let x = xStart; x <= xEnd; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, yPoutre - 40);
            ctx.lineTo(x, yPoutre);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, yPoutre);
            ctx.lineTo(x - 4, yPoutre - 6);
            ctx.lineTo(x + 4, yPoutre - 6);
            ctx.stroke();
        }
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`${charge.toFixed(2)} kN/m`, 220, 40);

        // Dessin des réactions (flèches vers le haut)
        ctx.strokeStyle = '#27ae60';
        // Appui A (gauche)
        ctx.beginPath();
        ctx.moveTo(xStart, yPoutre + 50);
        ctx.lineTo(xStart, yPoutre + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xStart, yPoutre + 10);
        ctx.lineTo(xStart - 6, yPoutre + 16);
        ctx.lineTo(xStart + 6, yPoutre + 16);
        ctx.stroke();
        ctx.fillStyle = '#27ae60';
        ctx.fillText(`RA = ${ra.toFixed(2)} kN`, xStart - 20, yPoutre + 70);

        // Appui B (droite)
        ctx.beginPath();
        ctx.moveTo(xEnd, yPoutre + 50);
        ctx.lineTo(xEnd, yPoutre + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xEnd, yPoutre + 10);
        ctx.lineTo(xEnd - 6, yPoutre + 16);
        ctx.lineTo(xEnd + 6, yPoutre + 16);
        ctx.stroke();
        ctx.fillText(`RB = ${rb.toFixed(2)} kN`, xEnd - 20, yPoutre + 70);
    }


    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    // On ajoute un "écouteur" sur chaque curseur.
    // Dès qu'un curseur est bougé ("input"), on appelle notre fonction de mise à jour.
    chargeGInput.addEventListener('input', mettreAJourToutesLesValeurs);
    chargeQInput.addEventListener('input', mettreAJourToutesLesValeurs);
    poutreLargeurInput.addEventListener('input', mettreAJourToutesLesValeurs);
    poutreHauteurInput.addEventListener('input', mettreAJourToutesLesValeurs);

    // --- Appel initial ---
    // On exécute la fonction une première fois au chargement de la page
    // pour que tout soit calculé avec les valeurs par défaut.
    mettreAJourToutesLesValeurs();

});

// --- FONCTION POUR LA NAVIGATION PAR ONGLETS ---
// (Cette fonction est placée en dehors de l'événement DOMContentLoaded car elle est appelée par onclick dans le HTML)
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    
    // Cache tous les contenus d'onglets
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    
    // Enlève la classe "active" de tous les boutons d'onglets
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    // Affiche l'onglet actuel et ajoute la classe "active" au bouton qui a ouvert l'onglet
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}