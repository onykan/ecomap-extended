
const router = require('express').Router();

const apiUrl = "https://api.worldbank.org/v2";
const maxPerPage = 10000;
const indicators =
  [
    {
      code: 'NY.GDP.MKTP.KD',
      name: 'Gross domestic product',
      id: 'GDP',
      quarterly: false
    },
    {
      code: 'NY.GDP.MKTP.CD',
      name: 'Gross domestic product, not adjusted for inflation',
      id: 'GDPUSD',
      quarterly: false
    },
    {
      code: 'SL.UEM.TOTL.ZS',
      name: 'Unemployment Rate',
      id: 'UR',
      quarterly: false
    },
    {
      code: 'FP.CPI.TOTL',
      name: 'Inflation Rate (Consumer Price Index - CPI)',
      id: 'CPI',
      quarterly: false
    },
    {
      code: 'BX.GSR.GNFS.CD',
      name: 'Exports of goods and services (BoP, current US$)',
      id: 'EXP',
      quarterly: false
    },
    {
      code: 'BM.GSR.GNFS.CD',
      name: 'Imports of goods and services (BoP, current US$)',
      id: "IMP",
      quarterly: false
    },
    {
      code: 'DP.DOD.DLD1.CR.GG.Z1',
      name: 'Gross PSD, General Gov.-D1, All maturities, Debt securities + loans, Nominal Value, % of GDP',
      id: 'PSD',
      quarterly: true
    },
  ];

const datalayers = {
  gdp: {
    indicator: "GDP",
    formator: undefined
  },
  gdpchange: {
    indicator: "GDP",
    formator: gdpChangeFormator
  }
}


router.get('/', async (req, res) => {
  res.json({});
})

router.get('/indicators', async (_, res) => {
  res.status(200).json(indicators);
})

router.get('/indicator/:id', async (req, res) => {
  const indId = req.params.id;
  const indicator = getIndicator(indId);

  if (indicator == undefined) {
    res.status(404).json({ message: "Indicator not found" });
    return;
  }

  let dateBeg = req.query.dateBeg || undefined;
  let dateEnd = req.query.dateEnd || undefined;

  if (dateBeg === undefined && dateEnd === undefined) {
    dateBeg = '';
    dateEnd = '';
  } else if (dateBeg === undefined) {
    dateBeg = dateEnd;
  } else if (dateEnd === undefined) {
    dateEnd = dateBeg;
  }

  let country = (req.query.country) ? req.query.country : 'all';
  const data = await getByIndicator(country, indicator.code, dateBeg, dateEnd);
  resOrMsg(res, `No data found for country ${country}`, data, listAsMapByKey);
  // resOrMsg(res, `No data found for country ${country}`, data, (data) => { return reduceResponse(listAsMapByKey(data)) });
})

// Route for minimal responses needed to display data layers on the map
// TODO: Precalculate and store commonly needed data
router.get('/datalayer/:id', async (req, res) => {
  const dataLayer = datalayers[req.params.id];
  const indicator = getIndicator(dataLayer.indicator);

  if (indicator === undefined) {
    res.status(404).json({ message: "Map layer or the indicator associated with the selected layer was not found!" });
    return;
  }

  // TODO: Check if precalculated

  let dateBeg = req.query.dateBeg || undefined;
  let dateEnd = req.query.dateEnd || undefined;

  if (dateBeg === undefined && dateEnd === undefined) {
    dateBeg = '';
    dateEnd = '2024'; // TODO: Find a way to find the most recent year of existing data
  } else if (dateBeg === undefined) {
    dateBeg = dateEnd;
  } else if (dateEnd === undefined) {
    dateEnd = dateBeg;
  }
  // TODO: Query error correction

  const dataAllCountries = await getByIndicator("all", indicator.code, dateBeg, dateEnd);
  if (dataAllCountries === undefined) {
    res.status(404).json({ message: "No data found" });
    return;
  }
  if (dataAllCountries.message !== undefined) {
    res.status(404).json({ message: dataAllCountries.message });
    return;
  }

  let dataMap = listAsMapByKey(dataAllCountries, "countryiso3code");
  dataMap = reduceResponse(dataMap);

  if (dataLayer.formator !== undefined) {
    let newObj = {};

    for (let [country, dat] of Object.entries(dataMap)) {
      newObj[country] = dataLayer.formator(dat, dateBeg, dateEnd);
    }

    dataMap = newObj;
  }

  res.status(200).json(dataMap);
})

router.get('/country', async (req, res) => {
  const redirectUrl = req.url.endsWith('/') ? './all' : './country/all';
  res.redirect(redirectUrl);
})

router.get('/country/:code', async (req, res) => {
  const countryCode = req.params.code;
  if (countryCode == "all") {
    // TODO: maybe keep countries in memory or database for faster access
    const countries = await fetchDataApi(apiUrl + "/country");
    res.status(200).json(countries);
  } else {
    const country = await fetchDataApi(apiUrl + "/country/" + countryCode);
    resOrMsg(res, "No country found with given value", country);
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
    res.status(200).json(incomeLevels);
  } else {
    const country = await fetchDataApi(apiUrl + "/country/" + countryCode);
    resOrMsg(res, "No country found with given value", country);
  }
})

// Returns the plain response of the fetch in JSON
async function fetchData(url, params = "") {
  try {
    const fullUrl = url + "?" + params;
    const response = await fetch(fullUrl);
    console.log(`GET ${fullUrl} ${response.status}`);
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
  if (res.length == 1) return res[0];
  let data = res[1];

  if (res[0].pages > 1) {
    for (let page = 2; page <= res[0].pages; page++) {
      const r = await fetchData(url, new URLSearchParams({ format: "json", per_page: maxPerPage, page: page }).toString());
      data.concat(r[1]);
    }
  }
  return (data && data.length == 1) ? data[0] : data;
}

// Returns the indicator by indicator id if found, otherwise undefined
function getIndicator(indId) {
  return indicators.find((ind) => ind.id.toLowerCase() === indId.toLowerCase());
}

// Checks if the data is invalid
// TODO: could be better
function noData(data) {
  return !data || data.hasOwnProperty('message')
}

// Sets response to be 404 with message if data is invalid.
// Can also add a callback function to modify the response data if it's valid.
function resOrMsg(res, message, data, dataModifyFunction = undefined) {
  if (noData(data)) {
    res.status(404).json({ message: message });
  } else {
    res.status(200).json((dataModifyFunction) ? dataModifyFunction(data) : data);
  }
}

async function getIndicators() {
  return await fetchDataApi(apiUrl + "/indicators");
}

// TODO: maybe only include the country code and the asked indicator value to reduce the response size
async function getByIndicator(countryCode = "all", indicator, yearBegin, yearEnd) {
  const url = `${apiUrl}/country/${countryCode}/indicator/${indicator}`;
  return await fetchDataApi(url, `date=${yearBegin}:${yearEnd}`);
}

function listAsMapByKey(dataList, key = "countryiso3code") {
  let map = {};
  for (let i = 0; i < dataList?.length; i++) {
    let keyVal = dataList[i][key];
    if (!map[keyVal]) {
      map[keyVal] = [];
    }
    map[keyVal].push(dataList[i]);
  }
  return map;
}

// Will reduce the response object to only contain the country iso3 code (or country name in case of 'useCountryName') nested with year-value pairs
// Heavily assumes correct input format to be what *listAsMapByKey* returns
function reduceResponse(objectOfAllIndicators) {
  let reducedResponse = {};

  for (let key in objectOfAllIndicators) {
    /*
    let field;
    if (useCountryName) field = objectOfAllIndicators[key][0].country.value;
    else field = key;
    */
    if (key === undefined || key === '') continue;

    reducedResponse[key] = objectOfAllIndicators[key].reduce((acc, cur) => ({ ...acc, [cur.date]: cur.value }), {});
  }

  return reducedResponse;
}

async function getIndicatorID(name) {
  const indicators = await getIndicators();
  for (i in indicators) {
    const indicator = indicators[i];
    const indName = indicator["name"];
    if (indName != undefined && indName.startsWith(name)) return indicator["id"];
  }
  return "";
}

// Useful function to search for wanted indicators by name
async function getMatchingIndicators(name) {
  inds = [];
  const indicators = await getIndicators();
  for (i in indicators) {
    const indicator = indicators[i];
    const indName = indicator["name"];
    if (indName != undefined && indName.toLowerCase().includes(name.toLowerCase())) inds.push({ code: indicator["id"], name: indName })
  }
  return inds;
}


// Formator function for calculating percentual gdp change
function gdpChangeFormator(innerObj, yearBegin, yearEnd) {
  return ((innerObj[yearEnd] / innerObj[yearBegin]) - 1) * 100;
}


async function main() {
  // const indicators = await getIndicators();

  // All countries
  // const countries = await fetchData(apiUrl + "/country", "format=json&per_page=1000");
  // console.log(countries);

  // Gets GDP of all countries
  // const gdpAllCountries = await getByIndicator("all", "NY.GDP.MKTP.KD", 2013, 2023);
  // let gdpMap = listAsMapByKey(gdpAllCountries, "countryiso3code");
  // console.log(gdpMap);
  // console.log(gdpMap["FIN"]);

  // Income levels of all countries
  // Could possibly be used to color code countries on map
  // let incomeLevels = {}
  // for (let c = 0; c < countries[1].length; c++) {
  //   incomeLevels[countries[1][c]["id"]] = countries[1][c]["incomeLevel"];
  // }
  // console.log(incomeLevels);


  // const gdpID = await getIndicatorID("GDP (current US$)");
  // const finGDB = await getByIndicator("FIN", gdpID, 2010, 2012);
  // console.log(finGDB);

  //const inds = await getMatchingIndicators("");
  //inds.forEach((ind) => console.log(ind));
}

// main();

module.exports = router;

