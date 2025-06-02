const API_KEY = '2a6e5a0330954023b92200447253105';

const provinces = [
    { name: "East Azerbaijan - Tabriz", lat: 38.0962, lon: 46.2738 },
    { name: "West Azerbaijan - Urmia", lat: 37.5527, lon: 45.0759 },
    { name: "Ardabil - Ardabil", lat: 38.2493, lon: 48.2963 },
    { name: "Isfahan - Isfahan", lat: 32.6546, lon: 51.6680 },
    { name: "Alborz - Karaj", lat: 35.8400, lon: 50.9391 },
    { name: "Ilam - Ilam", lat: 33.2959, lon: 46.6705 },
    { name: "Bushehr - Bushehr", lat: 28.9234, lon: 50.8203 },
    { name: "Tehran - Tehran", lat: 35.6892, lon: 51.3890 },
    { name: "Chaharmahal and Bakhtiari - Shahrekord", lat: 32.3256, lon: 50.8645 },
    { name: "South Khorasan - Birjand", lat: 32.8649, lon: 59.2262 },
    { name: "Razavi Khorasan - Mashhad", lat: 36.2605, lon: 59.6168 },
    { name: "North Khorasan - Bojnord", lat: 37.4751, lon: 57.3293 },
    { name: "Khuzestan - Ahvaz", lat: 31.3183, lon: 48.6706 },
    { name: "Zanjan - Zanjan", lat: 36.6769, lon: 48.4963 },
    { name: "Semnan - Semnan", lat: 35.5729, lon: 53.3975 },
    { name: "Sistan and Baluchestan - Zahedan", lat: 29.4969, lon: 60.8629 },
    { name: "Fars - Shiraz", lat: 29.5926, lon: 52.5836 },
    { name: "Qazvin - Qazvin", lat: 36.2797, lon: 50.0049 },
    { name: "Qom - Qom", lat: 34.6399, lon: 50.8759 },
    { name: "Kurdistan - Sanandaj", lat: 35.3219, lon: 46.9862 },
    { name: "Kerman - Kerman", lat: 30.2839, lon: 57.0834 },
    { name: "Kermanshah - Kermanshah", lat: 34.3142, lon: 47.0650 },
    { name: "Kohgiluyeh and Boyer-Ahmad - Yasuj", lat: 30.6685, lon: 51.5880 },
    { name: "Golestan - Gorgan", lat: 36.8456, lon: 54.4393 },
    { name: "Gilan - Rasht", lat: 37.2808, lon: 49.5832 },
    { name: "Lorestan - Khorramabad", lat: 33.4871, lon: 48.3538 },
    { name: "Mazandaran - Sari", lat: 36.5633, lon: 53.0601 },
    { name: "Markazi - Arak", lat: 34.0956, lon: 49.7009 },
    { name: "Hormozgan - Bandar Abbas", lat: 27.1836, lon: 56.2666 },
    { name: "Hamadan - Hamadan", lat: 34.7983, lon: 48.5146 },
    { name: "Yazd - Yazd", lat: 31.8974, lon: 54.3569 }
];

const refs = {
    ipBtn: document.getElementById("ip-locate"),
    geoBtn: document.getElementById("geo-locate"),
    selectBox: document.getElementById("location-select"),
    resultBox: document.getElementById("location-result"),
    cityElem: document.getElementById("city-name"),
    tempElem: document.getElementById("temp-now"),
    conditionElem: document.getElementById("condition-now"),
    iconElem: document.getElementById("weather-icon"),
    windElem: document.getElementById("wind-info"),
    humidityElem: document.getElementById("humidity-info"),
    todayBox: document.getElementById("today-hours").querySelector('.hours-container'),
    tomorrowBox: document.getElementById("tomorrow-hours").querySelector('.hours-container'),
    weekBox: document.getElementById("week-display"),
    loader: document.getElementById("loader"),
    errorModal: document.getElementById("error-box"),
    errorTitle: document.getElementById("err-title"),
    errorMsg: document.getElementById("err-msg"),
    closeBtn: document.getElementById("dismiss-error")
};

function initApp() {
    loadProvinceList();
    refs.ipBtn.addEventListener("click", locateByIP);
    refs.geoBtn.addEventListener("click", locateByGeo);
    refs.closeBtn.addEventListener("click", () => refs.errorModal.style.display = "none");
    refs.selectBox.addEventListener("change", (e) => {
        if (e.target.value) {
            toggleLoading(true);
            fetchWeather(e.target.value);
        }
    });
    locateByIP();
}

function loadProvinceList() {
    provinces.forEach(p => {
        const opt = document.createElement("option");
        opt.value = `${p.lat},${p.lon}`;
        opt.textContent = p.name;
        refs.selectBox.appendChild(opt);
    });
}

function locateByIP() {
    toggleLoading(true);
    fetch("http://ip-api.com/json/?fields=status,message,lat,lon")
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                matchNearestCity(data.lat, data.lon);
            } else throw new Error(data.message);
        })
        .catch(() => showError("IP Location Error", "Please try another method"))
        .finally(() => toggleLoading(false));
}

function locateByGeo() {
    if (!navigator.geolocation) {
        showError("Error", "Geolocation is not supported by this browser");
        return;
    }

    // نمایش یک پیغام راهنما قبل از درخواست اجازه
    if (confirm("This site wants to access your location to find the nearest province. Do you want to allow it?")) {
        toggleLoading(true);
        navigator.geolocation.getCurrentPosition(
            pos => matchNearestCity(pos.coords.latitude, pos.coords.longitude),
            err => handleGeoError(err),
            { timeout: 10000 }
        );
    } else {
        showError("Permission Denied", "Location access was denied by the user.");
    }
}


function matchNearestCity(lat, lon) {
    let nearest = provinces[0];
    let minDist = Number.MAX_VALUE;

    provinces.forEach(p => {
        const d = getDistance(lat, lon, p.lat, p.lon);
        if (d < minDist) {
            nearest = p;
            minDist = d;
        }
    });

    refs.resultBox.textContent = `Nearest Location: ${nearest.name}`;
    refs.selectBox.value = `${nearest.lat},${nearest.lon}`;
    fetchWeather(`${nearest.lat},${nearest.lon}`);
}

function getDistance(lat1, lon1, lat2, lon2) {
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fetchWeather(location) {
    fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=7&lang=en`)
        .then(res => res.json())
        .then(data => showWeather(data))
        .catch(() => showError("Data Fetch Error", "There was a problem retrieving weather data"))
        .finally(() => toggleLoading(false));
}

function showWeather(data) {
    refs.cityElem.textContent = data.location.name;
    refs.tempElem.textContent = Math.round(data.current.temp_c);
    refs.conditionElem.textContent = data.current.condition.text;
    refs.iconElem.src = `https:${data.current.condition.icon}`;
    refs.windElem.textContent = data.current.wind_kph;
    refs.humidityElem.textContent = data.current.humidity;

    renderHourly(data.forecast.forecastday[0].hour, refs.todayBox);
    if (data.forecast.forecastday[1]) {
        renderHourly(data.forecast.forecastday[1].hour, refs.tomorrowBox);
    }

    renderDaily(data.forecast.forecastday);
}

function renderDaily(days) {
    refs.weekBox.innerHTML = '';
    days.forEach(day => {
        const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
        const div = document.createElement("div");
        div.className = "daily-item";
        div.innerHTML = `
            <div>${date}</div>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" width="30">
            <div>${day.day.condition.text}</div>
            <div><span>${Math.round(day.day.maxtemp_c)}°</span> / <span>${Math.round(day.day.mintemp_c)}°</span></div>
        `;
        refs.weekBox.appendChild(div);
    });
}

function renderHourly(hours, container) {
    container.innerHTML = '';
    hours.forEach(hr => {
        const div = document.createElement("div");
        const time = new Date(hr.time).getHours();
        div.className = "hourly-item";
        div.innerHTML = `
            <div>${time}:00</div>
            <img src="https:${hr.condition.icon}" alt="${hr.condition.text}" width="40">
            <div>${Math.round(hr.temp_c)}°C</div>
            <div>${hr.condition.text}</div>
            <div><i class="fas fa-wind"></i> ${hr.wind_kph} km/h ${windArrow(hr.wind_degree)}</div>
        `;
        container.appendChild(div);
    });
}


function showError(title, msg) {
    refs.errorTitle.textContent = title;
    refs.errorMsg.textContent = msg;
    refs.errorModal.style.display = "flex";
}


function windArrow(deg) {
    const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
    return dirs[Math.round(deg / 45) % 8];
}

function toggleLoading(state) {
    refs.loader.style.display = state ? "flex" : "none";
}

function handleGeoError(err) {
    let msg = "";
    switch (err.code) {
        case 1: msg = "Permission denied"; break;
        case 2: msg = "Position unavailable"; break;
        case 3: msg = "Timeout expired"; break;
        default: msg = "Unknown error"; break;
    }
    showError("Geolocation Error", msg);
    toggleLoading(false);
}

document.addEventListener("DOMContentLoaded", initApp);
