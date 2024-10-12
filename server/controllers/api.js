
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

async function getIndicators(pageNum = 1) {
  return await fetchData(apiUrl + "/indicators", `page=${pageNum}&format=json`);
}

// Only fetches the first page
async function getStats(countryCode, indicator, yearBegin, yearEnd) {
  const url = `${apiUrl}/country/${countryCode}/indicator/${indicator}`;
  return await fetchData(url, `format=json&date=${yearBegin}:${yearEnd}`);
}

async function getAllDataPages(countryCode, indicator, yearBegin, yearEnd) {
  pages = [];
  page = 1;
  const url = `${apiUrl}/country/${countryCode}/indicator/${indicator}`;
  while (true) {
    pageData = await fetchData(url, `format=json&date=${yearBegin}:${yearEnd}&page=${page}`);
    pages.push(pageData[1]);
    if (pageData[0]["pages"] > page) page++;
    else break;
  }
  return pages;
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
  let page = 1;
  while(true) {
    // console.log(page);
    const indicators = await getIndicators(page);
    for (i in indicators[1]) {
      const indicator = indicators[1][i];
      const indName = indicator["name"];
      if (indName != undefined && indName.startsWith(name)) return indicator["id"];
    }
    if (indicators[0]["pages"] > page) page++;
    else break;
  }
  return "";
}

async function getMatchingIndicators(name) {
  inds = [];
  let page = 1;
  while(true) {
    const indicators = await getIndicators(page);
    // console.log(page);
    for (i in indicators[1]) {
      const indicator = indicators[1][i];
      const indName = indicator["name"];
      if (indName != undefined && indName.includes(name)) inds.push(indicator)
    }
    if (indicators[0]["pages"] > page) page++;
    else break;
  }
  return inds;
}

async function main() {
  const indicatorsInfo = (await fetchData(apiUrl + "/indicators", "format=json"))[0];
  const indicators = await getIndicators(1);
  const countries = await fetchData(apiUrl + "/country", "format=json") // 6 pages total
  const jsonData = await getStats("FIN", "NY.GDP.MKTP.KD", 2010, 2020);

  // const indsgdp = await getMatchingIndicators("GDP");
  // console.log(indsgdp);

  // Gets GDP of all countries
  const gdpAllCountries = await getAllDataPages("all", "NY.GDP.MKTP.KD", 2013, 2023);
  let gdpMap = reorderPagesByKey(gdpAllCountries, "countryiso3code");
  console.log(gdpMap);
  console.log(gdpMap["FIN"]);


  // const bkbAllCountries = await getStats("all", "", 2013, 2023);
  // console.log(bkbAllCountries);

  // const gdpID = await getIndicatorID("GDP (current US$)");
  // const finGDB = await getStats("FIN", gdpID, 2010, 2012);
  // console.log(finGDB);

  // console.log(countries);
  // console.log(indicatorsInfo);
  // console.log(indicators[1]);
  // console.log(jsonData);
}

// main();

module.exports = router;

