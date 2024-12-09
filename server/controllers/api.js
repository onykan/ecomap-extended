const { predict_data, linearRegressionPredict, linearRegressionPredictPast, get_regressor, r2_score, linearRegressionFit } = require("../utils/predict.js");
const { isNumeric, compressToYearly } = require("../utils/utils.js");

const router = require('express').Router();

const apiUrl = "https://api.worldbank.org/v2";
const maxPerPage = 10000;

const Frequency = {
  Yearly: 'Y',
  Quarterly: 'Q',
  Monthly: 'M'
};

const indicators =
  [
    {
      code: 'NY.GDP.MKTP.KD',
      name: 'Gross domestic product',
      description: 'Gross domestic product, adjusted for inflation (US$)',
      id: 'GDP',
      frequency: Frequency.Yearly
    },
    {
      code: 'NY.GDP.MKTP.CD',
      name: 'Gross domestic product',
      description: 'Gross domestic product, not adjusted for inflation (US$)',
      id: 'GDPUSD',
      frequency: Frequency.Yearly
    },
    {
      code: 'SL.UEM.TOTL.ZS',
      name: 'Unemployment Rate',
      description: 'Unemployment, total (% of total labor force)',
      id: 'UR',
      frequency: Frequency.Yearly
    },
    {
      code: 'FP.CPI.TOTL',
      name: 'Inflation Rate',
      description: 'Consumer Price Index - CPI',
      id: 'CPI',
      frequency: Frequency.Yearly
    },
    {
      code: 'BX.GSR.GNFS.CD',
      name: 'Exports',
      description: 'Exports of goods and services (BoP, current US$)',
      id: 'EXP',
      frequency: Frequency.Yearly
    },
    {
      code: 'BM.GSR.GNFS.CD',
      name: 'Imports',
      description: 'Imports of goods and services (BoP, current US$)',
      id: "IMP",
      frequency: Frequency.Yearly
    },
    {
      code: 'DP.DOD.DLD1.CR.GG.Z1',
      name: 'Public Sector Debt',
      description: 'Gross PSD, General Gov.-D1, All maturities, Debt securities + loans, Nominal Value, % of GDP',
      id: 'PSD',
      frequency: Frequency.Quarterly
    },
  ];

const datalayers = {
  gdp: {
    indicator: "GDP",
    formator: undefined
  },
  gdpchange: {
    indicator: "GDP",
    formator: percentualChangeFormator
  },
  gdpaapc: {
    indicator: "GDP",
    formator: aapcFormator
  },
  ur: {
    indicator: "UR",
    formator: undefined
  },
  uraapc: {
    indicator: "UR",
    formator: aapcFormator
  },
  cpi: {
    indicator: "CPI",
    formator: undefined
  },
  cpiaapc: {
    indicator: "CPI",
    formator: aapcFormator
  }
}

function validateYear(year) {
  return isNumeric(year) && year >= 1920 && year <= 2024;
}

function validateDateRange(indicator, { dateBeg, dateEnd }) {
  switch (indicator.frequency) {
    case Frequency.Yearly:
      return validateYear(dateBeg) && validateYear(dateEnd);
    case Frequency.Quarterly: {
      let reg = /\b(19|20)\d{2}Q|q[1-4]\b/;
      return reg.test(dateBeg) && reg.test(dateEnd)
    }
    case Frequency.Monthly: {
      let reg = /\b(19|20)\d{2}M|m[1-12]\b/;
      return reg.test(dateBeg) && reg.test(dateEnd)
    }
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

  let dateBeg = req.query.dateBeg || '';
  let dateEnd = req.query.dateEnd || '';
  let mrv = req.query.mrv || undefined;
  let reduced = req.query.reduced || undefined;

  if (dateBeg === '') {
    dateBeg = dateEnd;
  } else if (dateEnd === '') {
    dateEnd = dateBeg;
  }

  if (!validateDateRange(indicator, { dateBeg, dateEnd }) && !mrv) {
    res.status(400).json({ message: `Given date range not valid ${dateBeg} - ${dateEnd}` });
    return;
  }

  let country = (req.query.country) ? req.query.country : 'all';
  const params = (mrv && isNumeric(mrv)) ? [mrv] : [dateBeg, dateEnd];
  const data = await getByIndicator(country, indicator.code, ...params);

  if (reduced || undefined) {
    resOrMsg(res, `No data found for country ${country}`, data, (data) => { return reduceResponse(listAsMapByKey(data)) });
    return;
  }
  resOrMsg(res, `No data found for country ${country}`, data, listAsMapByKey);
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

  if (!validateDateRange(indicator, { dateBeg, dateEnd })) {
    res.status(400).json({ message: "Invalid date range" });
    return;
  }

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
  // TODO: maybe keep countries in memory or database for faster access
  const country = await fetchDataApi(apiUrl + "/country/" + countryCode);
  resOrMsg(res, `No country found with given value '${countryCode}'`, country);
})

// Get country names as an object with iso3 codes as keys
router.get('/country/:code/name', async (req, res) => {
  const countryCode = req.params.code;
  const country_data = await fetchDataApi(apiUrl + "/country/" + countryCode);
  if (noData(country_data)) {
    res.status(404).json({ message: `No country found with given value '${countryCode}'` });
    return;
  }
  const country_names = {};
  if (Array.isArray(country_data)) {
    country_data.map((c) => { country_names[c['id']] = c['name']; });
  } else {
    country_names[country_data['id']] = country_data['name'];
  }
  resOrMsg(res, `No country found with given value '${countryCode}'`, country_names);
})

// Route to retrieve data and indicator values for a specified country.
// Date range can be specified to filter the results, otherwise all the available indicator data is returned.
// Query parameters:
// - `dateBeg` (optional): Start year
// - `dateEnd` (optional): End year. Both beg end end must be given to filter.
// - `mrv` (optional): Most recent values (integer) overrides range specified with beg and end.
// - `ind` (optional): Specify one or more indicator codes to only fetch data for those.
//                     Multiple 'ind' params can be used to add indicators (`?ind=GDP&ind=UR`).
// TODO: optimize
router.get('/country/:code/data', async (req, res) => {
  const country = req.params.code;

  const countryData = await fetchDataApi(apiUrl + "/country/" + country);
  if (noData(countryData)) {
    res.status(404).json({ message: `No country found with given value '${country}'` });
    return;
  }

  let info = {
    name: countryData['name'],
    region: countryData['region']['value'],
    capital: countryData['capitalCity'],
    longitude: countryData['longitude'],
    latitude: countryData['latitude'],
  };

  const inds = req.query.ind ? [].concat(req.query.ind) : undefined;
  let dateBeg = req.query.dateBeg || undefined;
  let dateEnd = req.query.dateEnd || undefined;
  let mrv = req.query.mrv || undefined;
  let compress = req.query.compress || undefined; // Compress to yearly
  let predict_data_len = req.query.predict_data_len || undefined;
  let predict = req.query.predict || undefined;
  let predict_past = req.query.predict_past || undefined;
  let fit = req.query.fit || undefined;

  if (!dateBeg || !dateEnd) {
    mrv = mrv ? mrv : 200;
  }
  const params = (mrv && isNumeric(mrv)) ? [mrv] : [dateBeg, dateEnd];

  let data = {
    [country]: {
      info: info,
      indicators: {}
    }
  };

  if (predict) {
    data[country]['predict'] = {};
  }
  if (predict_past) {
    data[country]['predict_past'] = {};
  }
  if (fit) {
    data[country]['fit'] = {};
  }

  await Promise.all(indicators.map(async (indicator) => {
    if (!inds || inds.some((i) => i.toLowerCase() == indicator.id.toLowerCase())) {
      let req_params = params;
      if (indicator.frequency == Frequency.Quarterly) {
        if (params.length == 1) {
          req_params[0] *= 4;
        } else if (params.length == 2) {
          req_params[0] += 'Q1';
          req_params[1] += 'Q4';
        }
      }
      let indData = await getByIndicator(country, indicator.code, ...req_params);
      let reduced = Object.assign({}, ...Object.values(reduceResponse(listAsMapByKey(indData))));
      reduced = Object.keys(reduced).sort().reduce(
        (obj, key) => {
          obj[key] = reduced[key];
          return obj;
        },
        {});
      if (compress && indicator.frequency != Frequency.Yearly) {
        reduced = compressToYearly(reduced);
      }
      data[country]['indicators'][indicator.id] = reduced;
      if (predict) {
        let prediction_data = (predict_data_len && predict_data_len > 1 && predict_data_len <= Object.keys(reduced).length) ? Object.fromEntries(Object.entries(reduced).slice(-predict_data_len)) : reduced;
        data[country]['predict'][indicator.id] = predict_data(prediction_data, predict, linearRegressionPredict)
      }
      if (predict_past) {
        let prediction_data = (predict_data_len && predict_data_len > 1 && predict_data_len <= Object.keys(reduced).length) ? Object.fromEntries(Object.entries(reduced).slice(predict_data_len)) : reduced;
        data[country]['predict_past'][indicator.id] = predict_data(prediction_data, predict_past, linearRegressionPredictPast)
      }
      if (fit) {
        data[country]['fit'][indicator.id] = {
          x: [],
          y: [],
          y_hat: [],
          r2: 0.0
        };
        let x_values = Object.keys(reduced).map(Number);
        let y_values = Object.values(reduced);
        let regressor = get_regressor(x_values, y_values);
        data[country]['fit'][indicator.id].x = x_values;
        data[country]['fit'][indicator.id].y = y_values;
        let y_hat = linearRegressionFit(x_values, regressor);
        data[country]['fit'][indicator.id].r2 = r2_score(y_values, y_hat);
        data[country]['fit'][indicator.id].y_hat = y_hat;
      }
    }
  }));
  resOrMsg(res, `No data found for country '${country}'`, data);
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

// Fetches values for given indicator based on the date range format.
// If dateBeg and dateEnd are given, all the values between are fetched.
// If mrv: int is given, mrv amount of most recent values are fetched.
// mrv=1 returns only the most recent value for the indicator.
async function getByIndicator(countryCode = "all", indicator, ...dateRangeParams) {
  let queryParams = ``;
  if (dateRangeParams) {
    if (dateRangeParams.length == 1) {
      const [mrv] = dateRangeParams;
      // TODO: preferred option
      // gapfill = 'N' ignores NULL values
      // gapfill = 'Y' gets all the values
      queryParams = `mrv=${mrv}&gapfill=Y`;
    }
    else if (dateRangeParams.length == 2) {
      const [dateBeg, dateEnd] = dateRangeParams;
      queryParams = `date=${dateBeg}:${dateEnd}`;
    }
  }
  const url = `${apiUrl}/country/${countryCode}/indicator/${indicator}`;
  return await fetchDataApi(url, queryParams);
}

// Creates a hashmap from `dataList`, using each element's specified attribute as the key.
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


// Formator function for calculating percentual value change
function percentualChangeFormator(innerObj, yearBegin, yearEnd) {
  return ((innerObj[yearEnd] / innerObj[yearBegin]) - 1) * 100;
}

// Formator function for calculating (unweighted) average annual percentage change
function aapcFormator(innerObj, yearBegin, yearEnd) {
  const begin = Number.parseInt(yearBegin);
  const end = Number.parseInt(yearEnd);
  if (begin === end) return 0;
  let sum = 0;

  for (let i = begin + 1; i <= end; i++) {
    sum += (innerObj[i] - innerObj[i - 1]) / innerObj[i] * 100;
  }

  return sum / (end - begin);
}

// Formator function for calculating (unweighted) average annual change
function aacFormator(innerObj, yearBegin, yearEnd) {
  const begin = Number.parseInt(yearBegin);
  const end = Number.parseInt(yearEnd);
  if (begin === end) return 0;
  let sum = 0;

  for (let i = begin + 1; i <= end; i++) {
    sum += (innerObj[i] - innerObj[i - 1]);
  }

  return sum / (end - begin);
}

// Formator function for calculating average over range
function avgOverRangeFormator(innerObj, yearBegin, yearEnd) {
  const begin = Number.parseInt(yearBegin);
  const end = Number.parseInt(yearEnd);
  if (begin === end) return 0;
  let sum = 0;

  for (let i = begin; i <= end; i++) {
    sum += innerObj[i];
  }

  return sum / (end - begin);
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

  // const inds = await getMatchingIndicators("");
  // inds.forEach((ind) => console.log(ind));
}

// main();

module.exports = router;

