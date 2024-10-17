
const apiUrl = "https://api.worldbank.org/v2";

const router = require('express').Router();

const maxPerPage = 10000;

router.get('/', async (req, res) => {
  res.json({});
})

router.get('/indicator/gdp', async (req, res) => {
  const indicator = "NY.GDP.MKTP.KD"
  const maxYear = 2023;
  let yearBeg = Math.min(req.query.yearBeg || maxYear, maxYear);
  let yearEnd = Math.min(req.query.yearEnd || maxYear, maxYear);
  yearEnd = Math.max(yearBeg, yearEnd);

  if (req.query.country == undefined || req.query.country == "all") {
    const gdpAllCountries = await getByIndicator("all", indicator, yearBeg, yearEnd);
    let gdpMap = listAsMapByKey(gdpAllCountries, "countryiso3code");
    res.json(gdpMap);
  } else {
    const gdp = await getByIndicator(req.query.country, indicator, yearBeg, yearEnd);
    res.json(gdp);
  }
})

router.get('/country/:code', async (req, res) => {
  const countryCode = req.params.code;

  // TODO: maybe keep countries in memory or database for faster access
  const countries = await fetchDataApi(apiUrl + "/country");

  if (countryCode == "all") {
    res.json(countries);
  } else {
    const country = countries.find((c) => c["id"] == countryCode);
    res.json(country);
  }
})

router.get('/country/:code/incomelevel', async (req, res) => {
  const countryCode = req.params.code;

  if (countryCode == "all") {
    const countries = await fetchDataApi(apiUrl + "/country");
    const incomeLevels = countries.reduce((incLevels, country) => {
      incLevels[country.id] = country.incomeLevel;
      return incLevels;
    }, {});
    res.json(incomeLevels);
  } else {
    const country = await fetchDataApi(apiUrl + "/country/" + countryCode);
    res.json(country.incomeLevel);
  }
})


// Returns the plain response of the fetch in JSON
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

// Fetches all the pages if the data can't fit in one response
async function fetchDataApi(url, params = "") {
  const res = await fetchData(url, new URLSearchParams({ format: "json", per_page: maxPerPage }).toString() + "&" + params);
  let data = res[1];

  if (res[0].pages > 1) {
    for (let page = 2; page <= res[0].pages; page++) {
      const r = await fetchData(url, new URLSearchParams({ format: "json", per_page: maxPerPage, page: page }).toString());
      data.concat(r[1]);
    }
  }
  return (data.length == 1) ? data[0] : data;
}

async function getIndicators() {
  return await fetchDataApi(apiUrl + "/indicators");
}

async function getByIndicator(countryCode = "all", indicator, yearBegin, yearEnd) {
  const url = `${apiUrl}/country/${countryCode}/indicator/${indicator}`;
  return await fetchDataApi(url, `date=${yearBegin}:${yearEnd}`);
}

function listAsMapByKey(dataList, key = "countryiso3code") {
  let map = {};
  for (let i = 0; i < dataList.length; i++) {
    let keyVal = dataList[i][key];
    if (!map[keyVal]) {
      map[keyVal] = [];
    }
    map[keyVal].push(dataList[i]);
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
  let gdpMap = listAsMapByKey(gdpAllCountries, "countryiso3code");
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

