/* jshint esversion: 11 */

// ── Gemeinsame Hilfsfunktionen ──────────────────────────────────────────────
// Werden von beiden Seiten (index.html + camera.html) genutzt.

// Wandelt interne Marken-Keys in lesbare Anzeigenamen um.
function formatBrand(brand) {
    const brandNames = {
        catlabs:                    'CatLABS',
        arista:                     'Arista',
        agfaphoto:                  'AgfaPhoto',
        foma:                       'Foma',
        ilford:                     'Ilford',
        kodak:                      'Kodak',
        kono:                       'KONO!',
        'psychedelic blues':        'Psychedelic Blues',
        revolog:                    'Revolog',
        rollei:                     'Rollei',
        yodica:                     'Yodica',
        dubblefilm:                 'dubblefilm',
        'cinestill film':           'CineStill Film',
        'film photography project': 'Film Photography Project'
    };
    return brandNames[brand] || brand;
}

// Gibt passende CSS-Filter und Korn-Intensität für einen Film zurück.
// S/W-Filme erhalten Graustufen; Farbfilme werden je nach Marke/Name angepasst.
function getFilmFilter(film) {
    if (!film) return { css: 'none', grain: 0.05 };

    const name  = (film.name  || '').toLowerCase();
    const brand = (film.brand || '').toLowerCase();
    const iso   = parseInt(film.iso) || 400;

    if (!film.color) {
        if (iso >= 3200) return { css: 'grayscale(100%) contrast(1.35) brightness(0.88)', grain: 0.28 };
        if (iso >= 800)  return { css: 'grayscale(100%) contrast(1.2)  brightness(0.94)', grain: 0.16 };
        return              { css: 'grayscale(100%) contrast(1.1)  brightness(1.0)',  grain: 0.09 };
    }

    if (brand === 'kodak') {
        if (name.includes('portra'))     return { css: 'sepia(18%) saturate(0.88) contrast(0.95) brightness(1.08) hue-rotate(5deg)', grain: 0.06 };
        if (name.includes('ektar'))      return { css: 'saturate(1.32) contrast(1.06) brightness(1.02)',                              grain: 0.05 };
        if (name.includes('gold'))       return { css: 'sepia(22%) saturate(1.12) contrast(1.0) brightness(1.08) hue-rotate(8deg)',  grain: 0.08 };
        if (name.includes('ultramax') || name.includes('colorplus')) return { css: 'sepia(14%) saturate(1.08) contrast(1.01) brightness(1.05)', grain: 0.07 };
        return { css: 'sepia(15%) saturate(1.0) brightness(1.05)', grain: 0.07 };
    }
    if (brand === 'cinestill film')           return { css: 'sepia(28%) saturate(1.15) contrast(1.0) brightness(1.12) hue-rotate(5deg)',  grain: 0.11 };
    if (brand === 'revolog')                  return { css: 'saturate(1.42) contrast(1.12) brightness(0.94) hue-rotate(-12deg)',           grain: 0.13 };
    if (brand === 'yodica')                   return { css: 'saturate(0.78) contrast(0.9) brightness(1.18) hue-rotate(18deg)',             grain: 0.08 };
    if (brand === 'kono!')                    return { css: 'saturate(1.22) contrast(1.1) brightness(1.0) hue-rotate(10deg)',              grain: 0.10 };
    if (brand === 'dubblefilm')               return { css: 'saturate(1.1) contrast(0.88) brightness(1.12) hue-rotate(22deg)',             grain: 0.09 };
    if (brand === 'agfaphoto')                return { css: 'sepia(10%) saturate(1.05) contrast(1.0) brightness(1.03)',                    grain: 0.06 };
    if (brand === 'rollei')                   return { css: 'saturate(0.88) contrast(1.12) brightness(0.97) hue-rotate(-8deg)',            grain: 0.13 };
    if (brand === 'psychedelic blues')        return { css: 'saturate(1.6) contrast(1.2) brightness(0.9) hue-rotate(-20deg)',              grain: 0.18 };
    if (brand === 'film photography project') return { css: 'sepia(12%) saturate(0.95) contrast(1.05) brightness(1.0)',                    grain: 0.10 };
    if (brand === 'arista')                   return { css: 'grayscale(100%) contrast(1.15) brightness(0.97)',                             grain: 0.10 };
    if (brand === 'foma')                     return { css: 'grayscale(100%) contrast(1.2) brightness(0.95)',                              grain: 0.12 };
    if (brand === 'catlabs')                  return { css: 'grayscale(100%) contrast(1.25) brightness(0.92)',                             grain: 0.14 };

    return { css: 'sepia(8%) saturate(1.02) contrast(1.0) brightness(1.02)', grain: 0.06 };
}

// ── Routing ──────────────────────────────────────────────────────────────────
// Entscheidet anhand eines eindeutigen DOM-Elements, welche Seite initialisiert wird.

if (document.querySelector('#webcamVideo')) {
    initCameraPage();
} else {
    initMainPage();
}

// ── Hauptseite (index.html) ──────────────────────────────────────────────────

// Lädt Filmdaten, setzt Dropdowns auf und verbindet alle Interaktionen (Filter, Filmkarten, Kamera-Animation).
async function initMainPage() {
    const data = await loadData();

    const brandFilterEl    = document.querySelector('#brandFilter');
    const searchButton     = document.querySelector('#searchButton');
    const resultsContainer = document.querySelector('#results');
    const filmRoll         = document.querySelector('#filmRoll');
    const flash            = document.querySelector('#flash');
    const camera           = document.querySelector('.camera');
    const cameraStage      = document.querySelector('.camera-stage');
    const clickHint        = document.querySelector('#clickHint');
    const hoverHint        = document.querySelector('#hoverHint');
    const tryFilmButton    = document.querySelector('#tryFilmButton');
    const showMoreBtn      = document.querySelector('#showMoreBtn');

    let selectedBrandValue = '';
    let selectedColorValue = '';
    let selectedFilm = null;

    // Öffnen/Schliessen und Auswahl-Logik für alle Custom-Dropdowns.
    function initCustomDropdowns() {
        document.querySelectorAll('.custom-select').forEach(select => {
            const triggerLabel     = select.querySelector('.custom-select__trigger span');
            const optionsContainer = select.querySelector('.custom-select__options');

            select.addEventListener('click', e => {
                e.stopPropagation();
                const isOpen = select.classList.contains('open');
                document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
                if (!isOpen) select.classList.add('open');
            });

            optionsContainer.addEventListener('click', e => {
                e.stopPropagation();
                const option = e.target.closest('.custom-option');
                if (!option) return;

                triggerLabel.textContent = option.textContent;
                optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');

                if (select.id === 'brandFilter') selectedBrandValue = option.dataset.value;
                if (select.id === 'colorFilter') selectedColorValue = option.dataset.value;

                select.classList.remove('open');
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
        });
    }

    // Befüllt das Brand-Dropdown dynamisch mit allen Marken aus den API-Daten.
    function createBrandOptions() {
        const brands = [];
        data.forEach(film => {
            if (!brands.includes(film.brand)) brands.push(film.brand);
        });
        brands.sort();

        const optionsContainer = brandFilterEl.querySelector('.custom-select__options');
        brands.forEach(brand => {
            const option = document.createElement('div');
            option.classList.add('custom-option');
            option.dataset.value = brand;
            option.textContent = formatBrand(brand);
            optionsContainer.appendChild(option);
        });
    }

    // Filtert die Filmliste anhand der gewählten Dropdown-Werte und zeigt das Ergebnis an.
    function filterFilms() {
        let filteredFilms = data;
        if (selectedBrandValue !== '') filteredFilms = filteredFilms.filter(film => film.brand === selectedBrandValue);
        if (selectedColorValue !== '') filteredFilms = filteredFilms.filter(film => String(film.color) === selectedColorValue);
        showFilms(filteredFilms);
    }

    // Gibt die maximale Anzahl sichtbarer Karten zurück – abhängig von der Bildschirmgrösse.
    function getLimit() {
        return window.matchMedia('(max-width: 540px)').matches ? 6 : 16;
    }

    // Rendert alle Filmkarten. Karten über dem Limit werden zunächst versteckt.
    // Zeigt den «Show all»-Button wenn mehr Karten vorhanden sind als das Limit.
    function showFilms(films) {
        resultsContainer.innerHTML = '';
        showMoreBtn.style.display = 'none';
        showMoreBtn.classList.remove('expanded');
        showMoreBtn.querySelector('span').textContent = 'Show all';
        hoverHint.classList.remove('visible');
        clickHint.classList.remove('visible');
        tryFilmButton.style.display = 'none';

        if (films.length === 0) {
            resultsContainer.innerHTML = '<p>No suitable film roll was found.</p>';
            return;
        }

        const limit = getLimit();

        films.forEach((film, index) => {
            const item = document.createElement('article');
            item.classList.add('film-card');
            if (index >= limit) item.classList.add('hidden');

            const image = document.createElement('img');
            image.src = film.staticImageUrl;
            image.alt = film.name;
            image.classList.add('film-image');

            const title = document.createElement('h2');
            title.innerText = `${formatBrand(film.brand)} ${film.name}`;

            const description = document.createElement('p');
            description.innerText = film.description;

            image.addEventListener('click', () => animateIntoCamera(image, film));

            item.appendChild(image);
            item.appendChild(title);
            item.appendChild(description);
            resultsContainer.appendChild(item);
        });

        clickHint.classList.add('visible');

        if (films.length > limit) {
            showMoreBtn.style.display = 'inline-flex';
        }
    }

    // Schaltet zwischen «Show all» und «Show less» um und blendet versteckte Karten ein/aus.
    showMoreBtn.addEventListener('click', () => {
        const expanded = showMoreBtn.classList.toggle('expanded');
        const limit = getLimit();
        const cards = resultsContainer.querySelectorAll('.film-card');

        if (expanded) {
            cards.forEach(card => card.classList.remove('hidden'));
            showMoreBtn.querySelector('span').textContent = 'Show less';
        } else {
            cards.forEach((card, i) => {
                if (i >= limit) card.classList.add('hidden');
            });
            showMoreBtn.querySelector('span').textContent = 'Show all';
        }
    });

    // Animiert das gewählte Filmbild zur Kamera (Flug-Animation), löst den Kamerablitz aus und zeigt danach die Filmrolle mit den Filmdetails.
    function animateIntoCamera(image, film) {
        filmRoll.classList.remove('visible');
        filmRoll.innerHTML = '';
        hoverHint.classList.remove('visible');
        tryFilmButton.style.display = 'none';

        const imageRect = image.getBoundingClientRect();
        image.style.setProperty('--start-x', `${imageRect.left}px`);
        image.style.setProperty('--start-y', `${imageRect.top}px`);
        image.style.setProperty('--start-width', `${imageRect.width}px`);
        image.classList.add('fly-to-camera');

        cameraStage.scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
            const cameraRect = camera.getBoundingClientRect();
            image.style.setProperty('--end-x', `${cameraRect.left + cameraRect.width / 2}px`);
            image.style.setProperty('--end-y', `${cameraRect.top + cameraRect.height * 0.38}px`);

            setTimeout(() => {
                flash.classList.add('active');

                setTimeout(() => {
                    flash.classList.remove('active');
                    showFilmRoll(film);
                    image.classList.remove('fly-to-camera');
                    image.style.removeProperty('--start-x');
                    image.style.removeProperty('--start-y');
                    image.style.removeProperty('--start-width');
                    image.style.removeProperty('--end-x');
                    image.style.removeProperty('--end-y');
                }, 800);
            }, 800);
        }, 1000);
    }

    // Befüllt die Filmrolle mit den Eigenschaften des gewählten Films und
    // animiert sie aus der Kamera heraus. Blendet danach den «Try your film»-Button ein.
    function showFilmRoll(film) {
        selectedFilm = film;
        filmRoll.innerHTML = '';

        createFilmFrame(`${formatBrand(film.brand)} ${film.name}`);
        createFilmFrame(`ISO ${film.iso}`);
        createFilmFrame(film.color ? 'Color' : 'Black / White');

        if (film.keyFeatures && film.keyFeatures.length > 0) {
            film.keyFeatures.forEach(featureObject => createFilmFrame(featureObject.feature));
        } else {
            createFilmFrame('No features available');
        }

        const rollHeight = filmRoll.scrollHeight;
        filmRoll.style.setProperty('--film-roll-height', `${rollHeight}px`);
        cameraStage.style.minHeight = `${rollHeight + window.innerHeight}px`;
        filmRoll.classList.add('visible');

        setTimeout(() => {
            hoverHint.classList.add('visible');
            tryFilmButton.style.display = 'inline-block';
        }, 2700);
    }

    // Erstellt ein einzelnes Feld innerhalb der Filmrolle mit dem übergebenen Text.
    function createFilmFrame(text) {
        const frame = document.createElement('div');
        frame.classList.add('film-frame');
        const paragraph = document.createElement('p');
        paragraph.innerText = text;
        frame.appendChild(paragraph);
        filmRoll.appendChild(frame);
    }

    // Wendet den Taschenlampen-Effekt als Inline-Style auf den Text des Filmfelds an.
    // So wird var() in mask-image vermieden, was den CSS-Validator zufriedenstellt.
    filmRoll.addEventListener('mousemove', event => {
        const frame = event.target.closest('.film-frame');
        if (!frame) return;
        const p = frame.querySelector('p');
        if (!p) return;
        const gradient = `radial-gradient(circle 85px at ${event.offsetX}px ${event.offsetY}px, black 0%, black 55%, transparent 100%)`;
        p.style.maskImage = gradient;
        p.style.webkitMaskImage = gradient;
        p.style.maskRepeat = 'no-repeat';
        p.style.webkitMaskRepeat = 'no-repeat';
    });

    searchButton.addEventListener('click', filterFilms);

    // Speichert den gewählten Film im sessionStorage und navigiert zur Kamera-Seite.
    tryFilmButton.addEventListener('click', () => {
        if (selectedFilm) {
            sessionStorage.setItem('selectedFilm', JSON.stringify({
                ...selectedFilm,
                displayName: `${formatBrand(selectedFilm.brand)} ${selectedFilm.name}`
            }));
            window.location.href = 'camera.html';
        }
    });

    if (data) {
        initCustomDropdowns();
        createBrandOptions();
    } else {
        resultsContainer.innerHTML = '<p>The data could not be loaded.</p>';
    }
}

// Lädt die Filmdaten über die lokale PHP-CORS-Bridge vom externen API.
async function loadData() {
    try {
        const response = await fetch('api_cors_bridge.php');
        return await response.json();
    } catch (error) {
        console.error(error);
        return false;
    }
}

// ── Kamera-Seite (camera.html) ───────────────────────────────────────────────

// Liest den gewählten Film aus dem sessionStorage, wendet den passenden CSS-Filter auf den Webcam-Feed an und ermöglicht Foto-Aufnahme mit Film-Korn sowie Download des Ergebnisses.
function initCameraPage() {
    const filmData = (() => {
        try { return JSON.parse(sessionStorage.getItem('selectedFilm')); } catch { return null; }
    })();

    const backButton     = document.querySelector('#backButton');
    const webcamVideo    = document.querySelector('#webcamVideo');
    const grainOverlay   = document.querySelector('#grainOverlay');
    const captureButton  = document.querySelector('#captureButton');
    const downloadButton = document.querySelector('#downloadButton');
    const capturedPhoto  = document.querySelector('#capturedPhoto');
    const photoResult    = document.querySelector('#photoResult');
    const filmBadge      = document.querySelector('#filmBadge');

    const filmFilter = getFilmFilter(filmData);

    if (filmData?.displayName) {
        filmBadge.textContent = filmData.displayName;
    }

    // CSS-Filter und Korn-Overlay auf den Live-Feed anwenden.
    webcamVideo.style.filter = filmFilter.css;
    grainOverlay.style.opacity = Math.min(filmFilter.grain * 2.5, 0.6);

    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Startet den Webcam-Stream über die Frontkamera des Geräts.
    async function startWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            webcamVideo.srcObject = stream;
        } catch {
            document.querySelector('.webcam-wrapper').innerHTML =
                '<p class="camera-error">Camera access denied.<br>Please allow camera permissions and reload.</p>';
            captureButton.disabled = true;
        }
    }

    let capturedDataURL = null;

    // Nimmt einen Schnappschuss auf: schneidet auf den sichtbaren Ausschnitt zu, spiegelt das Bild, wendet CSS-Filter und Pixel-Korn an.
    captureButton.addEventListener('click', () => {
        if (!webcamVideo.videoWidth) return;

        // Sichtbaren Ausschnitt berechnen – gleiche Logik wie object-fit: cover im Browser.
        const wrapper       = document.querySelector('.webcam-wrapper');
        const displayAspect = wrapper.clientWidth / wrapper.clientHeight;
        const videoW        = webcamVideo.videoWidth;
        const videoH        = webcamVideo.videoHeight;
        const videoAspect   = videoW / videoH;

        let sx = 0, sy = 0, sw = videoW, sh = videoH;
        if (videoAspect > displayAspect) {
            sw = videoH * displayAspect;
            sx = (videoW - sw) / 2;
        } else if (videoAspect < displayAspect) {
            sh = videoW / displayAspect;
            sy = (videoH - sh) / 2;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(sw);
        canvas.height = Math.round(sh);
        const ctx = canvas.getContext('2d');

        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        if (filmFilter.css !== 'none') ctx.filter = filmFilter.css;
        ctx.drawImage(webcamVideo, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.filter = 'none';
        addGrain(ctx, canvas.width, canvas.height, filmFilter.grain);

        capturedDataURL = canvas.toDataURL('image/jpeg', 0.93);
        capturedPhoto.src = capturedDataURL;
        photoResult.style.display = 'block';
        photoResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // Löst den Browser-Download des aufgenommenen Fotos als JPEG aus.
    downloadButton.addEventListener('click', () => {
        if (!capturedDataURL) return;
        const a = document.createElement('a');
        a.href = capturedDataURL;
        a.download = `${(filmData?.name || 'film').replace(/\s+/g, '-')}-photo.jpg`;
        a.click();
    });

    // Fügt zufälliges Pixel-Rauschen zum Canvas hinzu, um Film-Korn zu simulieren.
    function addGrain(ctx, w, h, intensity) {
        if (intensity < 0.03) return;
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        const amount = intensity * 90;
        for (let i = 0; i < d.length; i += 4) {
            const n = (Math.random() - 0.5) * amount;
            d[i]   = Math.min(255, Math.max(0, d[i]   + n));
            d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
            d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
        }
        ctx.putImageData(imageData, 0, 0);
    }

    startWebcam();
}
