// Daten holen
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

const brandFilter = document.querySelector('#brandFilter');
const colorFilter = document.querySelector('#colorFilter');
const searchButton = document.querySelector('#searchButton');
const resultsContainer = document.querySelector('#results');
const filmRoll = document.querySelector('#filmRoll');
const flash = document.querySelector('#flash');

// Brands automatisch in Select einfügen
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
        option.innerText = brand;
        brandFilter.appendChild(option);
    });
}

// Filme filtern
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

// Filme anzeigen
function showFilms(films) {
    resultsContainer.innerHTML = '';

    if (films.length === 0) {
        resultsContainer.innerHTML = '<p>Keine Filme gefunden.</p>';
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

// Bild-Animation zur Kamera
function animateIntoCamera(image, film) {
    image.classList.add('fly-to-camera');

    setTimeout(() => {
        flash.classList.add('active');

        setTimeout(() => {
            flash.classList.remove('active');
            showFilmRoll(film);
        }, 400);
    }, 700);
}

// Filmrolle anzeigen
function showFilmRoll(film) {
    filmRoll.innerHTML = '';

    const title = document.createElement('h3');
    title.innerText = `${formatBrand(film.brand)} ${film.name}`;

    const iso = document.createElement('p');
    iso.innerText = `ISO: ${film.iso}`;

    const process = document.createElement('p');
    process.innerText = `Prozess: ${film.process}`;

    const color = document.createElement('p');
    color.innerText = `Farbe: ${film.color ? 'Ja' : 'Nein'}`;

    const format35 = document.createElement('p');
    format35.innerText = `35mm: ${film.formatThirtyFive ? 'Ja' : 'Nein'}`;

    const format120 = document.createElement('p');
    format120.innerText = `120: ${film.formatOneTwenty ? 'Ja' : 'Nein'}`;

    const description = document.createElement('p');
    description.innerText = film.description;

    filmRoll.appendChild(title);
    filmRoll.appendChild(iso);
    filmRoll.appendChild(process);
    filmRoll.appendChild(color);
    filmRoll.appendChild(format35);
    filmRoll.appendChild(format120);
    filmRoll.appendChild(description);

    filmRoll.classList.add('visible');
}

// Taschenlampen-Effekt
filmRoll.addEventListener('mousemove', event => {
    const rect = filmRoll.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    filmRoll.style.setProperty('--x', `${x}px`);
    filmRoll.style.setProperty('--y', `${y}px`);
});

// Brand schöner anzeigen
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

// Event Listener
searchButton.addEventListener('click', filterFilms);

// Start
if (data) {
    createBrandOptions();
} else {
    resultsContainer.innerHTML = '<p>Die Daten konnten nicht geladen werden.</p>';
}