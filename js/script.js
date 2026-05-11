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
const brandFilter = document.querySelector('#brandFilter');
const colorFilter = document.querySelector('#colorFilter');
const searchButton = document.querySelector('#searchButton');
const resultsContainer = document.querySelector('#results');
const filmRoll = document.querySelector('#filmRoll');
const flash = document.querySelector('#flash');
const camera = document.querySelector('.camera');
const cameraStage = document.querySelector('.camera-stage');

// Erstellt automatisch alle Marken-Optionen im Brand-Filter
function createBrandOptions() {
    const brands = [];

    data.forEach(film => {
        if (!brands.includes(film.brand)) {
            brands.push(film.brand);
        }
    });

    brands.sort();

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.innerText = formatBrand(brand);
        brandFilter.appendChild(option);
    });
}

// Filtert die Filme anhand der ausgewählten Marke und Farbe
function filterFilms() {
    const selectedBrand = brandFilter.value;
    const selectedColor = colorFilter.value;

    let filteredFilms = data;

    if (selectedBrand !== '') {
        filteredFilms = filteredFilms.filter(film => film.brand === selectedBrand);
    }

    if (selectedColor !== '') {
        filteredFilms = filteredFilms.filter(film => String(film.color) === selectedColor);
    }

    showFilms(filteredFilms);
}

// Erstellt für jeden gefilterten Film eine sichtbare Karte
function showFilms(films) {
    resultsContainer.innerHTML = '';

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
}

// Animiert das angeklickte Filmbild zur Kamera und startet danach Blitz und Filmrolle
function animateIntoCamera(image, film) {
    filmRoll.classList.remove('visible');
    filmRoll.innerHTML = '';

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
        }, 1600);
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

    const frames = filmRoll.querySelectorAll('.film-frame');
    const rollHeight = frames.length * 130;

    filmRoll.style.setProperty('--film-roll-height', `${rollHeight}px`);
    cameraStage.style.minHeight = `${rollHeight + window.innerHeight}px`;

    filmRoll.classList.add('visible');
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

// Beim Laden werden nur die Filter vorbereitet, noch keine Filmkarten angezeigt
if (data) {
    createBrandOptions();
} else {
    resultsContainer.innerHTML = '<p>The data could not be loaded.</p>';
}