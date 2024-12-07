
function isNumeric(n) {
  return Number(parseFloat(n)) == n;
}

function compressToYearly(data) {
  if (!data) return {};
  const result = {};
  const yearlyData = {};
  for (const [time, value] of Object.entries(data)) {
    const year = Number(time.slice(0, 4));
    if (!yearlyData[year]) {
      yearlyData[year] = { sum: 0, count: 0 };
    }
    yearlyData[year].sum += value;
    yearlyData[year].count++;
  }
  for (const [year, { sum, count }] of Object.entries(yearlyData)) {
    result[year] = sum / count;
  }
  return result;
}

module.exports = { isNumeric, compressToYearly };
