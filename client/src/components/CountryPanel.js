import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import zoomPlugin from "chartjs-plugin-zoom";
import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, plugins } from 'chart.js';

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

const PredictFormState = {
  predict: 'predict',
  fit: 'fit',
  info: 'info'
}

const CountryPanel = ({ country, isOpen, onClose }) => {
  const [predictFormState, setPredictFormState] = useState(PredictFormState.predict);
  const predictRef = useRef(null);
  const predictDataLenRef = useRef(null);
  const chartRef = useRef(null);
  const [r2_scores, setR2Scores] = useState([]);
  const [predictYears, setPredict] = useState(0);
  const [predictDataLen, setPredictDataLen] = useState(0);
  const [predictData, setPredictData] = useState({ labels: [], datasets: [] });
  const [countryData, setCountryData] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [1, 2, 3],
    datasets: [
      {
        label: 'Loading...',
        data: [0, 0, 0],
        borderColor: 'rgba(75,192,192,1)',
      }
    ]
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    if (country && isOpen) {
      chartRef.current.resetZoom();
      try {
        axios.get(`/api/country/${country.code}/data`)
          .then((response) => {
            const data = response.data[country.code].info;
            setCountryData(data);

            const cData = response.data[country.code].indicators

            console.log("data", cData);
            const labels = Object.keys(cData.GDP);
            console.log("labels", labels);
            const datasets = Object.keys(cData).map((key) => {
              return {
                label: key,
                data: Object.values(cData[key]),
                borderColor: 'rgba(75,192,192,1)'
              }
            }
            );
            console.log("datasets", datasets);

            setChartData({
              labels: labels,
              datasets: datasets,
            })
          }
          );
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [country, isOpen]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: 'GDP of Country',
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
  }

  if (!chartData) {
    return null;
  }

  const handlePredictSubmit = async (event) => {
    event.preventDefault();
    fetchPredict();
  };

  const fetchPredict = async (years = predictYears) => {
    try {
      axios.get(`/api/country/${country.code}/data?` + new URLSearchParams({
        predict: years,
        predict_data_len: predictDataLen,
        compress: "y",
      })).then((response) => {
        const predict = response.data[country.code].predict;
        const indData = response.data[country.code].indicators;

        const labelsData = Object.keys(indData.GDP).map(e => Number(e));
        const datasetsData = Object.keys(indData).map((key) => {
          return {
            label: key,
            data: Object.values(indData[key]),
            borderColor: 'rgba(75,192,192,1)'
          }
        });

        if (years <= 0) {
          setChartData({
            labels: labelsData,
            datasets: datasetsData,
          })
          return;
        }

        let lastYear = Math.max(...labelsData);
        let labels = [];
        for (let i = 1; i <= years; i++) {
          labels.push(lastYear + i);
        }
        const datasets = Object.keys(predict).map((key) => {
          let dataset = {
            label: key,
            data: [],
            borderColor: 'rgba(255,0,0,1)'
          };
          dataset.data.push({ x: lastYear, y: indData[key][lastYear] });
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
            borderColor: 'rgba(75,192,192,1)'
          });
        });
        Object.keys(fit_data).forEach((key) => {
          datasets.push({
            label: key,
            data: fit_data[key].y_hat,
            borderColor: 'rgba(255,0,0,1)'
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
    predictFormDiv: {
      backgroundColor: "white",
      padding: "10px",
      maxWidth: "250px",
      borderRadius: "8px",
    },

    form: {
      backgroundColor: "white",
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
      color: "#333",
    },

    input: {
      width: "40px",
      marginLeft: "auto",
      padding: "5px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "12px",
    },

    button: {
      backgroundColor: "#f8f9fa",
      border: "1px solid #f8f9fa",
      borderRadius: "4px",
      color: "#3c4043",
      cursor: "pointer",
      fontFamily: "arial",
      fontSize: "14px",
      lineHeight: "27px",
      padding: "0 15px",
      textAlign: "center",
      styleHover: {
        borderColor: "#dadce0",
        boxShadow: "rgba(0, 0, 0, .1) 0 1px 1px",
        color: "#202124",
      }
    },
  };


  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: isOpen ? "600px" : "0px",
        overflow: "hidden",
        backgroundColor: "#f4f4f4",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
        transition: "width 0.3s ease",
        padding: isOpen ? "20px" : "0px",
      }}
    >

      {isOpen && chartData && (
        <div>
          <button onClick={onClose} style={{ float: "right" }}>Close</button>
          <h2>Country: {country.code}</h2>
          <p>Indicator Value: {country.value}</p>

          <div style={styles.predictFormDiv}>
            <form>
              <label class="radio-inline">
                <input type="radio" name="predictRadio" onChange={() => {
                  setPredictFormState(PredictFormState.predict);
                  fetchPredict(-1);
                }}
                  checked={predictFormState === PredictFormState.predict} />Predict
              </label>
              <label class="radio-inline">
                <input type="radio" name="predictRadio" onChange={() => {
                  setPredictFormState(PredictFormState.fit);
                  linearRegFit();
                }} checked={predictFormState === PredictFormState.fit} />Fit
              </label>
              <label class="radio-inline">
                <input type="radio" name="predictRadio" onChange={() => setPredictFormState(PredictFormState.info)}
                  checked={predictFormState === PredictFormState.info} />Info
              </label>
            </form>
            {predictFormState === PredictFormState.predict && (
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
            {predictFormState === PredictFormState.fit && (
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
            {predictFormState === PredictFormState.info && (
              <div >
                <h4 style={{ marginBottom: "1px", marginTop: "2px" }}>Predict:</h4>
                <p style={{ marginBottom: "1px", marginTop: "2px" }}>Data length determines the number of years to consider when making the prediction.</p>
                <p style={{ marginBottom: "1px", marginTop: "2px" }}>Predicted years defines the amount of years to predict.</p>
                <h4 style={{ marginBottom: "1px", marginTop: "2px" }}>Fit:</h4>
                <p style={{ marginBottom: "1px", marginTop: "2px" }}>Contains the R² scores of the fitted lines on the data.</p>
              </div>
            )}
          </div>

          <Line ref={chartRef} data={chartData} options={options} />

        </div>
      )
      }
    </div >
  );
};

export default CountryPanel;
