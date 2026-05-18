// Lädt die Filmdaten über die lokale PHP-CORS-Bridge
async function loadData() {
    const url = 'api_cors_bridge.php';

    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(error);
        return false;
    }
}

const data = await loadData();

// Wichtige DOM-Elemente aus dem HTML holen
const brandFilterEl   = document.querySelector('#brandFilter');
const colorFilterEl   = document.querySelector('#colorFilter');
const searchButton    = document.querySelector('#searchButton');
const resultsContainer = document.querySelector('#results');
const filmRoll        = document.querySelector('#filmRoll');
const flash           = document.querySelector('#flash');
const camera          = document.querySelector('.camera');
const cameraStage     = document.querySelector('.camera-stage');
const clickHint       = document.querySelector('#clickHint');
const hoverHint       = document.querySelector('#hoverHint');
const tryFilmButton   = document.querySelector('#tryFilmButton');

// Aktuell gewählte Filterwerte
let selectedBrandValue = '';
let selectedColorValue = '';

// Custom-Dropdown Logik
function initCustomDropdowns() {
    document.querySelectorAll('.custom-select').forEach(select => {
        const triggerLabel   = select.querySelector('.custom-select__trigger span');
        const optionsContainer = select.querySelector('.custom-select__options');

        // Öffnen / Schliessen beim Klick auf den Trigger
        select.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = select.classList.contains('open');
            document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
            if (!isOpen) select.classList.add('open');
        });

        // Option auswählen – stopPropagation verhindert, dass der Select-Handler danach nochmals öffnet
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

    // Schliessen bei Klick ausserhalb
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
    });
}

// Erstellt automatisch alle Marken-Optionen im Brand-Dropdown
function createBrandOptions() {
    const brands = [];

    data.forEach(film => {
        if (!brands.includes(film.brand)) {
            brands.push(film.brand);
        }
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

// Filtert die Filme anhand der ausgewählten Werte
function filterFilms() {
    let filteredFilms = data;

    if (selectedBrandValue !== '') {
        filteredFilms = filteredFilms.filter(film => film.brand === selectedBrandValue);
    }

    if (selectedColorValue !== '') {
        filteredFilms = filteredFilms.filter(film => String(film.color) === selectedColorValue);
    }

    showFilms(filteredFilms);
}

// Erstellt für jeden gefilterten Film eine sichtbare Karte
function showFilms(films) {
    resultsContainer.innerHTML = '';
    hoverHint.classList.remove('visible');
    clickHint.classList.remove('visible');
    tryFilmButton.style.display = 'none';

    if (films.length === 0) {
        resultsContainer.innerHTML = '<p>No suitable film roll was found.</p>';
        return;
    }

    films.forEach(film => {
        const item = document.createElement('article');
        item.classList.add('film-card');

        const image = document.createElement('img');
        image.src = film.staticImageUrl;
        image.alt = film.name;
        image.classList.add('film-image');

        const title = document.createElement('h2');
        title.innerText = `${formatBrand(film.brand)} ${film.name}`;

        const description = document.createElement('p');
        description.innerText = film.description;

        image.addEventListener('click', () => {
            animateIntoCamera(image, film);
        });

        item.appendChild(image);
        item.appendChild(title);
        item.appendChild(description);

        resultsContainer.appendChild(item);
    });

    clickHint.classList.add('visible');
}

// Animiert das angeklickte Filmbild zur Kamera und startet danach Blitz und Filmrolle
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

    cameraStage.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

    setTimeout(() => {
        const cameraRect = camera.getBoundingClientRect();

        image.style.setProperty(
            '--end-x',
            `${cameraRect.left + cameraRect.width / 2}px`
        );

        image.style.setProperty(
            '--end-y',
            `${cameraRect.top + cameraRect.height * 0.38}px`
        );

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

// Füllt die Filmrolle mit den wichtigsten Daten des ausgewählten Films
function showFilmRoll(film) {
    filmRoll.innerHTML = '';

    createFilmFrame(`Name: ${formatBrand(film.brand)} ${film.name}`);
    createFilmFrame(`ISO: ${film.iso}`);
    createFilmFrame(`Color: ${film.color ? 'Yes' : 'No'}`);

    if (film.keyFeatures && film.keyFeatures.length > 0) {
        film.keyFeatures.forEach(featureObject => {
            createFilmFrame(featureObject.feature);
        });
    } else {
        createFilmFrame('No Features available');
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

// Erstellt ein einzelnes Feld innerhalb der Filmrolle
function createFilmFrame(text) {
    const frame = document.createElement('div');
    frame.classList.add('film-frame');

    const paragraph = document.createElement('p');
    paragraph.innerText = text;

    frame.appendChild(paragraph);
    filmRoll.appendChild(frame);
}

// Aktualisiert die Position des Taschenlampen-Effekts innerhalb eines Filmfeldes
filmRoll.addEventListener('mousemove', event => {
    const frame = event.target.closest('.film-frame');

    if (!frame) {
        return;
    }

    const x = event.offsetX;
    const y = event.offsetY;

    frame.style.setProperty('--frame-x', `${x}px`);
    frame.style.setProperty('--frame-y', `${y}px`);
});

// Gibt Markennamen schöner formatiert aus
function formatBrand(brand) {
    const brandNames = {
        catlabs: 'CatLABS',
        arista: 'Arista',
        agfaphoto: 'AgfaPhoto',
        foma: 'Foma',
        ilford: 'Ilford',
        kodak: 'Kodak',
        kono: 'KONO!',
        'psychedelic blues': 'Psychedelic Blues',
        revolog: 'Revolog',
        rollei: 'Rollei',
        yodica: 'Yodica',
        dubblefilm: 'dubblefilm',
        'cinestill film': 'CineStill Film',
        'film photography project': 'Film Photography Project'
    };

    return brandNames[brand] || brand;
}

// Startet die Suche erst, wenn der Button geklickt wird
searchButton.addEventListener('click', filterFilms);

// Try-your-film scrollt zur Filterleiste hoch
tryFilmButton.addEventListener('click', () => {
    document.querySelector('.filter-container').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});

// Beim Laden: Dropdowns initialisieren und Brand-Optionen befüllen
if (data) {
    initCustomDropdowns();
    createBrandOptions();
} else {
    resultsContainer.innerHTML = '<p>The data could not be loaded.</p>';
}
