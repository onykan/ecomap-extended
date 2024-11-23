const { isNumeric } = require("./utils.js");


function convertYear(year) {
  if (isNumeric(year)) {
    return Number(year);
  }
  return year;
}

// "2024Q1" -> 202401
function convertQuarterly(yearQ) {
  let iQ = yearQ.indexOf('Q');
  if (iQ !== -1) {
    return Number(yearQ.substring(0, iQ) + '0' + yearQ.substring(iQ + 1));
  }
  return yearQ;
}

// "2024M12" -> 2024012
function convertMonthly(yearM) {
  let iM = yearM.indexOf('M');
  if (iM !== -1) {
    return Number(yearM.substring(0, iM) + '0' + yearM.substring(iM + 1));
  }
  return yearM;
}

// Way too complicated but works
function unconvertData(data, entriesInYear, { year, letter, digit }, decrease = false) {
  let nextYear = year;
  let nextSuf;
  if (decrease) {
    nextSuf = digit - 1;
    if (nextSuf <= 0) {
      nextSuf = entriesInYear;
      nextYear--;
    }
  } else {
    nextSuf = (digit % entriesInYear) + 1;
  }
  let changeYear = (decrease)
    ? (nextS, nextY, eInY) => {
      if (nextS <= 0) {
        nextS = eInY;
        nextY--;
      }
      return [nextS, nextY];
    }
    : (nextS, nextY, eInY) => {
      if (nextS > eInY) {
        nextS = 1;
        nextY++;
      }
      return [nextS, nextY];
    };

  let unconvData = data.reduce((acc, [y, value]) => {
    if (entriesInYear == 1) {
      acc[y] = value;
      return acc;
    }
    [nextSuf, nextYear] = changeYear(nextSuf, nextYear, entriesInYear);
    acc[nextYear.toString() + letter + nextSuf] = value;
    nextSuf += (decrease ? -1 : 1);
    return acc;
  }, {});

  return unconvData;
}

// Converts the data suitable for the predict functions
function convertData(data) {
  let entriesInYear = 1;
  let convertYearF = convertYear;

  const year = Object.keys(data)[0];
  if (year && year.includes('Q')) {
    entriesInYear = 4;
    convertYearF = convertQuarterly;
  } else if (year && year.includes('M')) {
    entriesInYear = 12;
    convertYearF = convertMonthly;
  }
  const convData = Object.entries(data)
    .filter(([_, value]) => value !== null)
    .map(([year, value]) => [convertYearF(year), value]);
  return [entriesInYear, convData];
}

// Predicts the `n` amount of years using the given predictFunction
// Input and output data should be:
// {
//    2010: 123,
//    2011: 1234,
//    2012: 12345,
//    ...
// }
function predict_data(data, n, predictFunction) {
  const [entriesInYear, validData] = convertData(data);
  n *= entriesInYear;
  if (validData.length == 0 || !isNumeric(n) || n <= 0) return null;
  let predict_list = predictFunction(validData, n)
  const years = validData.map(([year]) => year);
  const yearsPred = predict_list.map(([y, _]) => y);
  const decrease = Math.max(...yearsPred) < Math.min(...years);
  let lastYear = (decrease) ? Math.min(...years) : Math.max(...years);
  let letter = entriesInYear === 4 ? 'Q' : entriesInYear === 12 ? 'M' : '';
  let connYear = { year: lastYear, letter: "", digit: -1 };
  if (entriesInYear > 1) {
    connYear = { year: Number(lastYear.toString().substring(0, 4)), letter: letter, digit: Number(lastYear.toString()[5]) };
  }
  let predictions = unconvertData(predict_list, entriesInYear, connYear, decrease);
  return predictions;
}

// Regressor for linear regression
function get_regressor(x_values, y_values) {
  regressor = {};
  let n = x_values.length;
  const x_mean = x_values.reduce((a, b) => a + b, 0) / n;
  const y_mean = y_values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x_values[i] - x_mean) * (y_values[i] - y_mean);
    den += (x_values[i] - x_mean) ** 2;
  }
  const slope = num / den;
  const intercept = y_mean - slope * x_mean;
  regressor.slope = slope;
  regressor.intercept = intercept;
  return regressor;
}

// Fits linear regression to data
function linearRegressionFit(x_values, regressor) {
  let y_hat = [];
  for (let i = 0; i < x_values.length; i++) {
    y_hat.push(x_values[i] * regressor.slope + regressor.intercept);
  }
  return y_hat;
}

// Calculates R squared prediction error for linear regression fit
function r2_score(y_values, predictions) {
  let rss = 0, tss = 0;
  let y_mean = y_values.reduce((a, b) => a + b) / y_values.length;
  for (i = 0; i < y_values.length; i++) {
    rss += (predictions[i] - y_values[i]) ** 2;
    tss += (predictions[i] - y_mean) ** 2;
  }
  return 1 - rss / tss;
}

// Uses linear regression to make predictions
function linearRegressionPredict(data, yearsAhead) {
  const years = data.map(([year]) => year);
  const values = data.map(([_, value]) => value);
  const lastYear = Math.max(...years);

  let regressor = get_regressor(years, values);
  const predictions = [];
  for (let i = 1; i <= yearsAhead; i++) {
    const futureYear = lastYear + i;
    predictions.push([futureYear, futureYear * regressor.slope + regressor.intercept]);
  }
  return predictions;
}

// Uses linear regression to make predictions to the past
function linearRegressionPredictPast(data, yearsPast) {
  const years = data.map(([year]) => year);
  const values = data.map(([_, value]) => value);
  const earliestYear = Math.min(...years);

  let regressor = get_regressor(years, values);
  const predictions = [];
  for (let i = 1; i <= yearsPast; i++) {
    const pastYear = earliestYear - i;
    predictions.push([pastYear, pastYear * regressor.slope + regressor.intercept]);
  }
  return predictions;
}

// Extrapolates future data points based on the provided data
function extrapolationPredict(data, yearsAhead) {
  const years = data.map(([year]) => year);
  const values = data.map(([_, value]) => value);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const firstYearValue = values[years.indexOf(firstYear)];
  const lastYearValue = values[years.indexOf(lastYear)];
  const growthRate = (lastYearValue - firstYearValue) / (firstYearValue * (lastYear - firstYear));
  const predictions = [];
  for (let i = 1; i <= yearsAhead; i++) {
    const futureYear = lastYear + i;
    predictions.push([futureYear, lastYearValue * ((1 + growthRate) ** i)]);
  }
  return predictions;
}

module.exports = { predict_data, linearRegressionPredict, linearRegressionPredictPast, extrapolationPredict, linearRegressionFit, r2_score, get_regressor };
