import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import zoomPlugin from "chartjs-plugin-zoom";
import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, plugins } from 'chart.js';
import '../styles/CountryPanel.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  plugins,
  zoomPlugin
);

const INDICATOR_COUNT = 7;

const panelState = {
  normal: 'normal',
  predict: 'predict',
  fit: 'fit',
  info: 'info'
}

const CountryPanel = ({ country, isOpen, onClose }) => {
  const [predictFormState, setPredictFormState] = useState(panelState.normal);
  const predictRef = useRef(null);
  const predictDataLenRef = useRef(null);
  const chartRef = useRef(null);
  const [r2_scores, setR2Scores] = useState([]);
  const [predictYears, setPredict] = useState(0);
  const [predictDataLen, setPredictDataLen] = useState(0);
  const [predictData, setPredictData] = useState({ labels: [], datasets: [] });
  const [countryData, setCountryData] = useState([]);

  // mock data for when the county is not loaded
  const [chartData, setChartData] = useState({
    labels: [0, 0, 0],
    datasets: [
      {
        label: 'Loading...',
        data: [0, 0, 0],
        borderColor: 'rgba(0,0,0,1)',
      }
    ]
  });


  useEffect(() => {
    if (country && isOpen) {
      fetchCountryData();
    }
  }, [country, isOpen]);

  const handlePredictSubmit = async (event) => {
    event.preventDefault();
    fetchPredict();
  };

  const fetchCountryData = () => {
    chartRef.current.resetZoom();
    try {
      // Fix for Djibouti
      if (country.code === "-99") {
        country.code = "DJI";
      }
      // Fix for Antarctica
      if (country.code === "ATA" || country.code === "ESH" || country.code === "GUF") {
        return
      }
      axios.get(`/api/country/${country.code}/data?compress=y`)
        .then((response) => {
          const data = response.data[country.code].info;
          setCountryData(data);
          const cData = response.data[country.code].indicators
          console.log("data", cData);
          let labels = Object.keys(cData.GDP).map(Number);
          const max_year = Math.max(...labels);
          labels.push(max_year + 1);
          console.log("labels", labels);

          // Filter out datasets with all null values
          const datasets = Object.keys(cData).filter((key) => {
            return Object.values(cData[key]).some(value => value !== null);
          }).map((key) => {
            const dataset = {
              label: key,
              data: Object.entries(cData[key])
                .filter(([k, val]) => Number(k) <= max_year)
                .map(([k, val]) => ({ x: Number(k), y: val })),
              borderColor: 'rgba(0,0,0,1)',
              usePointStyle: true,
              pointRadius: 0,
              hidden: true,
              hitRadius: 10,
              scale: 'y',
            };
            return dataset;
          });
          console.log("datasets", datasets);
          setChartData({
            labels: labels,
            datasets: datasets,
          })
        }
        );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchPredict = (years = predictYears) => {
    try {
      axios.get(`/api/country/${country.code}/data?` + new URLSearchParams({
        predict: years,
        predict_data_len: predictDataLen,
        compress: "y",
      })).then((response) => {
        const predict = response.data[country.code].predict;
        const indData = response.data[country.code].indicators;

        const labelsData = Object.keys(indData.GDP).map(e => Number(e));
        const max_year = Math.max(...labelsData) + 1;
        labelsData.push(max_year);
        const datasetsData = Object.keys(indData).map((key) => {
          const dataset = {
            label: key,
            data: Object.entries(indData[key])
              .map(([k, val]) => ({ x: Number(k), y: val })),
            borderColor: 'rgba(0,0,0,1)',
            usePointStyle: true,
            pointRadius: 0,
            hidden: true,
            hitRadius: 10,
            scale: 'y',
          };
          return dataset;
        });

        if (years <= 0) {
          setChartData({
            labels: labelsData,
            datasets: datasetsData,
          })
          return;
        }

        let labels = [];
        for (let i = 1; i <= years; i++) {
          labels.push(max_year + i);
        }
        const datasets = Object.keys(predict).map((key) => {
          let dataset = {
            label: key,
            data: [],
            borderColor: 'rgba(255,0,0,1)',
            usePointStyle: true,
            pointRadius: 0,
            hidden: true,
            hitRadius: 10,
            scale: 'y',
          };

          const maxYearForInd = Math.max(...Object.keys(indData[key]).map(Number));
          dataset.data.push({ x: maxYearForInd, y: indData[key][maxYearForInd] });
          Object.entries(predict[key]).forEach(([k, val]) => {
            dataset.data.push({ x: Number(k), y: val });
          })
          return dataset;
        }
        );
        setPredictData({
          labels: labels,
          datasets: datasets,
        })
        let updatedLabels = [...labelsData];
        let updatedDatasets = [...datasetsData];
        labels.forEach(e => { updatedLabels.push(e) });
        datasets.forEach(e => { updatedDatasets.push(e) });

        setChartData({ labels: Array.from(new Set(updatedLabels.map(Number))).sort((a, b) => a - b), datasets: updatedDatasets });
      });
    } catch (error) {
      console.error("Error fetching predict data:", error);
    }
  }

  const linearRegFit = async () => {
    try {
      axios.get(`/api/country/${country.code}/data?` + new URLSearchParams({
        fit: "y",
      })).then((response) => {
        const fit_data = response.data[country.code].fit
        const indData = response.data[country.code].indicators;


        let r2Scores = [];
        const labels = Object.keys(indData.GDP).map(e => Number(e));
        let datasets = [];
        Object.keys(indData).forEach((key) => {
          datasets.push({
            label: key,
            data: Object.values(indData[key]),
            borderColor: 'rgba(0,0,0,1)',
            usePointStyle: true,
            pointRadius: 0,
            hidden: true,
            hitRadius: 10,
            scale: 'y',
          });
        });
        Object.keys(fit_data).forEach((key) => {
          datasets.push({
            label: key,
            data: fit_data[key].y_hat,
            borderColor: 'rgba(255,0,0,1)',
            usePointStyle: true,
            pointRadius: 0,
            hidden: true,
            hitRadius: 10,
            scale: 'y',
          });
          r2Scores.push([key, fit_data[key].r2]);
        });

        setR2Scores(r2Scores);
        setChartData({ labels: labels, datasets: datasets });
      });
    } catch (error) {
      console.error("Error fetching predict data:", error);
    }
  };

  // TODO: maybe to css file
  let styles = {

    radioBlock: {
      display: "flex",
      width: "50%",
    },

    predictFormDiv: {
      display: "flex",
      flexDirection: "row",
      padding: "10px",
      width: "100%",
      borderRadius: "8px",
    },

    form: {
      display: "flex",
      padding: "10px",
      maxWidth: "250px",
      borderRadius: "8px",
    },

    formGroup: {
      display: "flex",
      alignItems: "center",
      marginBottom: "5px",
    },

    label: {
      width: "100px",
      fontSize: "16px",

    },

    input: {
      width: "40px",
      marginLeft: "auto",
      padding: "5px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "12px",
    },


  };

  ///These are the options for the chart
  const options = {
    responsive: true,
    plugins: {
      title: {
        text: 'Country Data',
        display: true,
      },
      legend: {
        title: { text: 'TOGGLE', display: true },
        position: "right",
        /// toggles the visibility of the datasets
        onClick: (e, legendItem, legend, chart) => {
          const datasets = legend.legendItems.map((dataset, index) => {
            return dataset.text;
          });

          const indexes = datasets.reduce(function (ind, e, i) {
            if (e === legendItem.text)
              ind.push(i);
            return ind;
          }, []);

          legend.chart.data.datasets.forEach((dataset, i) => {
            if (!indexes.includes(i)) {
              if (i >= INDICATOR_COUNT) {
                dataset.borderColor = 'rgba(255,0,0,1)';
                legend.chart.getDatasetMeta(i).hidden = true;
              } else {
                dataset.borderColor = 'rgba(0,0,0,1)';
              }
              legend.chart.hide(i);
            }
          });
          indexes.forEach(i => {
            if (legend.chart.isDatasetVisible(i) === true) {
              legend.chart.hide(i);
            }
            else {
              legend.chart.show(i);
            }
          });
        },
        labels: {
          boxWidth: 20,
          /// generates the legend labels with a darker color when visible
          generateLabels: (chart) => {
            const visibility = []
            chart.data.datasets.forEach((dataset, i) => {
              if (chart.isDatasetVisible(i) === true) {
                visibility.push('rgba(102,102,102,1)');
              } else {
                visibility.push('rgba(102,102,102,0.5)');
              }
            });
            return chart.data.datasets.map(
              (dataset, i) => {
                if (i >= INDICATOR_COUNT) {
                  return {
                    text: dataset.label,
                    strokeStyle: dataset.borderColor,
                    fontColor: visibility[i],
                    fillStyle: 'rgba(0,0,0,0)',
                  }
                }
                return {
                  text: dataset.label,
                  strokeStyle: dataset.borderColor,
                  fontColor: visibility[i],
                  fillStyle: visibility[i],
                }
              }
            )
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x"
        },
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: "x"
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year'
        }
      },
      y: {
        title: {
          display: true,
          text: function (context) {
            ///determines dataset y axis label
            const datasets = context.chart.data.datasets;
            const chart = context.chart;
            let datasetLabel = '';
            datasets.forEach((dataset, i) => {
              if (chart.isDatasetVisible(i)) {
                datasetLabel = dataset.label;
                console.log("datasetLabel", datasetLabel);
              }
            })

            switch (datasetLabel) {
              case 'GDPUSD':
                return 'Gross domestic product (GDP) in $USD';
              case 'GDP':
                return 'Gross Domestic Product (GDP)';
              case 'CPI':
                return 'Consumer Price Index (CPI)';
              case 'UR':
                return 'Unemployment Rate (%)';
              case 'IMP':
                return 'Import of goods ($USD)';
              case 'PSD':
                return 'Poverty Rate (%)';
              case 'EXP':
                return 'Exports of goods ($USD)';
              default:
                return 'Value';
            }
          }

        }
      }
    },
  }


  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: isOpen ? "40%" : "0px",
        overflow: "hidden",
        backgroundColor: "#B9D9EB",
        color: "black",
        transition: "width 0.3s ease",
        padding: isOpen ? "20px" : "0px",
      }} >

      {isOpen && chartData && (
        <div>
          <button onClick={onClose} style={{ float: "right" }}>Close</button>
          <h2>Country: {country.code}</h2>
          <p>Indicator Value: {country.value}</p>

          <div style={styles.predictFormDiv}>
            <form style={styles.radioBlock}>
              <label class="radio-inline">
                <input type="radio" name="predictRadio" onChange={() => {
                  setPredictFormState(panelState.normal);
                  fetchCountryData();
                }}
                  checked={predictFormState === panelState.normal} />Normal
              </label>
              <label class="radio-inline">
                <input type="radio" name="predictRadio" onChange={() => {
                  setPredictFormState(panelState.predict);
                  fetchPredict(-1);
                }}
                  checked={predictFormState === panelState.predict} />Predict
              </label>
              <label class="radio-inline">
                <input type="radio" name="predictRadio" onChange={() => {
                  setPredictFormState(panelState.fit);
                  linearRegFit();
                }} checked={predictFormState === panelState.fit} />Fit
              </label>
              <label class="radio-inline">
                <input type="radio" name="predictRadio" onChange={() => {
                  setPredictFormState(panelState.info)
                }}
                  checked={predictFormState === panelState.info} />Info
              </label>
            </form>
            {predictFormState === panelState.predict && (
              <div></div>
            )}
            {predictFormState === panelState.predict && (
              <form onSubmit={handlePredictSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label for="data_len">Prediction data length:</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="predict_data_len"
                    min={0}
                    max={100}
                    ref={predictDataLenRef}
                    defaultValue={predictDataLen}
                    onChange={() => setPredictDataLen(predictDataLenRef.current.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label for="predict_years">Predicted years:</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="predict"
                    min={0}
                    max={20}
                    ref={predictRef}
                    defaultValue={predictYears}
                    onChange={() => setPredict(predictRef.current.value)}
                  />
                </div>
                <input type="submit" value="Predict" style={styles.button} />
              </form>
            )}
            {predictFormState === panelState.fit && (
              <div>
                <b>R² scores:</b>
                {
                  Array.from({ length: r2_scores.length }).map((_, i) => (
                    <div key={i}>
                      <span style={{ display: 'inline-block', width: '100px' }}>{r2_scores[i][0]}: </span>
                      <span>{Number(r2_scores[i][1]).toFixed(2)}</span>
                    </div>
                  ))
                }
              </div>
            )}
            {predictFormState === panelState.info && (
              <div>
                <h4 style={{ marginBottom: "1px", marginTop: "2px" }}>Predict:</h4>
                <p style={{ marginBottom: "1px", marginTop: "2px" }}>Data length determines the number of years to consider when making the prediction.</p>
                <p style={{ marginBottom: "1px", marginTop: "2px" }}>Predicted years defines the amount of years to predict.</p>
                <h4 style={{ marginBottom: "1px", marginTop: "2px" }}>Fit:</h4>
                <p style={{ marginBottom: "1px", marginTop: "2px" }}>Contains the R² scores of the fitted lines on the data.</p>
              </div>
            )}
          </div>
          <Line style={{ color: 'lightblue' }} ref={chartRef} data={chartData} options={options} />
        </div>
      )}
    </div >
  )
}

export default CountryPanel;
