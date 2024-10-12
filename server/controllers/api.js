
const apiUrl = "https://api.worldbank.org/v2";

const router = require('express').Router();

router.get('/', async (req, res) => {
  res.json("{}");
})

async function fetchData(url, params = "") {
// let d = {
//   method: "GET",
//   withCredentials: true,
//   headers: {
//     "X-Auth-Token": "API_KEY",
//     "Content-Type": "application/json"
//   }
// }

  try {
    const response = await fetch(url + "?" + params);
    if (!response.ok) {
      throw new Error('Response was not ok, status: ' + response.status);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function getIndicators() {
  return await fetchData(apiUrl + "/indicators", `format=json&per_page=1000`);
}

async function getByIndicator(countryCode = "all", indicator, yearBegin, yearEnd) {
  const url = `${apiUrl}/country/${countryCode}/indicator/${indicator}`;
  return await fetchData(url, `format=json&date=${yearBegin}:${yearEnd}&per_page=1000`);
}

function reorderPagesByKey(pages, key = "countryiso3code") {
  let map = {};
  for (let i = 0; i < pages.length; i++) {
    for (let j = 0; j < pages[i].length; j++) {
      let keyVal = pages[i][j][key];
      if (!map[keyVal]) {
        map[keyVal] = [];
      }
      map[keyVal].push(pages[i][j]);
    }
  }
  return map;
}

async function getIndicatorID(name) {
  const indicators = await getIndicators();
  for (i in indicators[1]) {
    const indicator = indicators[1][i];
    const indName = indicator["name"];
    if (indName != undefined && indName.startsWith(name)) return indicator["id"];
  }
  return "";
}

async function getMatchingIndicators(name) {
  inds = [];
  const indicators = await getIndicators();
  for (i in indicators[1]) {
    const indicator = indicators[1][i];
    const indName = indicator["name"];
    if (indName != undefined && indName.includes(name)) inds.push(indicator)
  }
  return inds;
}

async function main() {
  const indicators = await getIndicators();

  // All countries
  const countries = await fetchData(apiUrl + "/country", "format=json&per_page=1000");
  // console.log(countries);

  // Gets GDP of all countries
  const gdpAllCountries = await getByIndicator("all", "NY.GDP.MKTP.KD", 2013, 2023);
  let gdpMap = reorderPagesByKey(gdpAllCountries, "countryiso3code");
  // console.log(gdpMap);
  // console.log(gdpMap["FIN"]);

  // Income levels of all countries
  // Could possibly be used to color code countries on map
  let incomeLevels = {}
  for (let c = 0; c < countries[1].length; c++) {
    incomeLevels[countries[1][c]["id"]] = countries[1][c]["incomeLevel"];
  }
  // console.log(incomeLevels);


  // const gdpID = await getIndicatorID("GDP (current US$)");
  // const finGDB = await getByIndicator("FIN", gdpID, 2010, 2012);
  // console.log(finGDB);

  // const indsgdp = await getMatchingIndicators("GDP");
  // console.log(indsgdp);
}

// main();

module.exports = router;

