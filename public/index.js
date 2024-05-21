let currentPage = 1;
const limit = 10;
let totalPokemon = 0;
let pokemonData = [];
let filteredPokemonData = [];

// Fetch and display Pokémon types as checkboxes
const loadPokemonTypes = async () => {
    const typeResult = await axios.get('https://pokeapi.co/api/v2/type/');
    const types = typeResult.data.results;
    const typeContainer = document.getElementById('typeContainer');

    types.forEach(type => {
        const label = document.createElement('label');
        label.innerText = type.name;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = type.name;
        checkbox.classList.add('typeCheckbox');
        label.appendChild(checkbox);
        typeContainer.appendChild(label);
    });

    typeContainer.addEventListener('change', () => {
        const selectedTypes = Array.from(document.querySelectorAll('.typeCheckbox:checked')).map(cb => cb.value);
        if (selectedTypes.length > 0) {
            filterPokemonByTypes(selectedTypes);
        } else {
            filteredPokemonData = pokemonData;
            totalPokemon = 810; // Reset to the original total count
            displayPokemon(currentPage);
        }
    });
};

const filterPokemonByTypes = async (types) => {
    let promises = types.map(type => axios.get(`https://pokeapi.co/api/v2/type/${type}`));
    const results = await Promise.all(promises);

    // Create a map of Pokémon name to their count of matching types
    const pokemonTypeCount = {};
    results.forEach(result => {
        result.data.pokemon.forEach(p => {
            if (!pokemonTypeCount[p.pokemon.name]) {
                pokemonTypeCount[p.pokemon.name] = { count: 0, url: p.pokemon.url };
            }
            pokemonTypeCount[p.pokemon.name].count++;
        });
    });

    // Only include Pokémon that match all selected types
    filteredPokemonData = Object.keys(pokemonTypeCount)
        .filter(name => pokemonTypeCount[name].count === types.length)
        .map(name => ({ name, url: pokemonTypeCount[name].url }));

    totalPokemon = filteredPokemonData.length;
    currentPage = 1;
    displayPokemon(currentPage);
};

const displayPokemon = (page) => {
    const mainDiv = document.getElementById("mainDiv");
    mainDiv.innerHTML = "";
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPokemon = filteredPokemonData.slice(start, end);

    paginatedPokemon.forEach(async (element) => {
        await getPokemon(element);
    });

    document.getElementById("prevBtn").classList.toggle("hidden", page === 1);
    document.getElementById("nextBtn").classList.toggle("hidden", end >= totalPokemon);

    // Update pagination buttons
    updatePaginationButtons(page);

    // Update Pokémon count display
    updatePokemonCountDisplay(page, end);
};

const updatePokemonCountDisplay = (page, end) => {
    const countDiv = document.getElementById("pokemonCount");
    const start = (page - 1) * limit + 1;
    const showingCount = Math.min(end, totalPokemon);
    countDiv.innerText = `Showing ${start}-${showingCount} of ${totalPokemon} Pokémon`;
};

const getPokemon = async (element) => {
    const pokeDetails = await axios.get(element.url);
    const p = document.createElement("div");
    p.classList.add("pokemon-card");
    const imageSource = pokeDetails.data.sprites.front_default;
    p.innerHTML = `
    <h3>${element.name}</h3>
    <img src="${imageSource}" alt="${element.name}">
  `;
    const b = document.createElement("button");
    b.innerHTML = `More!`;
    b.classList.add("moreBtns");
    b.id = `${element.name}Btn`;
    b.addEventListener('click', () => showPokemonDetails(pokeDetails.data));
    p.appendChild(b);
    p.id = element.name;
    document.getElementById("mainDiv").appendChild(p);
};

const showPokemonDetails = (pokemon) => {
    const modal = document.getElementById("pokemonModal");
    const modalContent = document.getElementById("modalContent");

    modalContent.innerHTML = `
        <h1>${pokemon.name.toUpperCase()}</h1>
        <h3>Pokemon #: ${pokemon.id}</h3>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <h3>Abilities</h3>
        <ul>${pokemon.abilities.map(ability => `<li>${ability.ability.name}</li>`).join('')}</ul>
        <h3>Stats</h3>
        <ul>
            ${pokemon.stats.map(stat => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>
        <h3>Types</h3>
        <ul>${pokemon.types.map(type => `<li>${type.type.name}</li>`).join('')}</ul>
        <button onclick="closeModal()">Close</button>
    `;

    modal.style.display = "block";
};

const closeModal = () => {
    const modal = document.getElementById("pokemonModal");
    modal.style.display = "none";
};

const loadPokemon = async () => {
    const result = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=810`);
    pokemonData = result.data.results;
    filteredPokemonData = pokemonData;
    totalPokemon = pokemonData.length;
    displayPokemon(currentPage);
};

const updatePaginationButtons = (currentPage) => {
    const paginationDiv = document.getElementById("pagination");
    paginationDiv.innerHTML = "";

    const totalPages = Math.ceil(totalPokemon / limit);
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    }

    if (currentPage > totalPages - 3) {
        startPage = Math.max(totalPages - 4, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("pageBtn");
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => {
            currentPage = i;
            displayPokemon(currentPage);
        });
        paginationDiv.appendChild(pageButton);
    }

    // Hide prev and next buttons appropriately
    document.getElementById("prevBtn").style.display = (currentPage === 1) ? 'none' : 'inline-block';
    document.getElementById("nextBtn").style.display = (currentPage === totalPages) ? 'none' : 'inline-block';
};

document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayPokemon(currentPage);
    }
});

document.getElementById("nextBtn").addEventListener("click", () => {
    if ((currentPage * limit) < totalPokemon) {
        currentPage++;
        displayPokemon(currentPage);
    }
});

loadPokemon();
loadPokemonTypes();
