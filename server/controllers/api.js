
const router = require('express').Router();

const apiUrl = "https://api.worldbank.org/v2";
const maxPerPage = 10000;
const indicators =
  [
    { code: 'NY.GDP.MKTP.KD', name: 'Gross domestic product', id: 'GDP' },
  ];


router.get('/', async (req, res) => {
  res.json({});
})

router.get('/indicator/:id', async (req, res) => {
  const indId = req.params.id;
  const indicator = indicators.find((ind) => ind.id.toLowerCase() === indId.toLowerCase());
  if (indicator != undefined) {
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

    if (req.query.country == undefined || req.query.country == "all") {
      const dataAllCountries = await getByIndicator("all", indicator.code, dateBeg, dateEnd);
      if (dataAllCountries == undefined) {
        res.status(404).json({ message: "No data found" });
        return;
      }
      if (dataAllCountries.message != undefined) {
        res.status(404).json({ message: dataAllCountries.message });
        return;
      }
      let gdpMap = listAsMapByKey(dataAllCountries, "countryiso3code");
      res.json(gdpMap);
    } else {
      const data = await getByIndicator(req.query.country, indicator.code, dateBeg, dateEnd);
      res.json(data || {});
    }
  } else {
    res.status(404).json({ message: "Indicator not found" });
  }
})

router.get('/country', async (_, res) => {
  res.redirect('./all');
})

router.get('/country/:code', async (req, res) => {
  const countryCode = req.params.code;
  if (countryCode == "all") {
    // TODO: maybe keep countries in memory or database for faster access
    const countries = await fetchDataApi(apiUrl + "/country");
    res.json(countries);
  } else {
    const country = await fetchDataApi(apiUrl + "/country/" + countryCode);
    // TODO: maybe give the response a different status code if country not found
    res.json(country || {});
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
    res.json(country?.incomeLevel || {});
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

async function getIndicators() {
  return await fetchDataApi(apiUrl + "/indicators");
}

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
    if (indName != undefined && indName.includes(name)) inds.push({ code: indicator["id"], name: indName })
  }
  return inds;
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

  const indsgdp = await getMatchingIndicators("debt");
  indsgdp.forEach((ind) => console.log(ind));
}

// main();

module.exports = router;

