const { isNumeric } = require("./utils.js");

// Predicts the `n` amount of years using the given predictFunction
// Input and output data should be:
// {
//    2010: 123,
//    2011: 1234,
//    2012: 12345,
//    ...
// }
// TODO: handle quarterly years
function predict_data(data, n, predictFunction) {
  const validData = Object.entries(data)
    .filter(([_, value]) => value !== null)
    .map(([year, value]) => [Number(year), value]);
  if (validData.length == 0 || !isNumeric(n) || n <= 0) return null;
  let predict_list = predictFunction(validData, n)
  let predictions = predict_list.reduce((acc, [year, value]) => {
    acc[year] = value;
    return acc;
  }, {});
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
