import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import zoomPlugin from "chartjs-plugin-zoom";
import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, plugins } from 'chart.js';
import '../styles/CountryPanel.css';
import PanelForm from "./PanelForm";
import CountryInfo from "./CountryInfo";

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

const CountryPanel = ({ country, isOpen, onClose }) => {
  const chartRef = useRef(null);
  const [countryData, setCountryData] = useState([]);
  const [showCountryInfo, setCountryInfo] = useState(false);
  // mock data for when the county is not loaded
  const [options, setOptions] = useState({});
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

  useEffect(() => {
    if (country && isOpen) {
      let opts = getOptions();
      setOptions(opts);
    }
  }, [chartData]);

  const toggleCountryInfo = (event) => {
    event.preventDefault();
    setCountryInfo(!showCountryInfo);
  }

  const fetchCountryData = () => {
    // chartRef.current.resetZoom();
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

  ///These are the options for the chart
  const getOptions = () => {
    return {
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

            const indexes = datasets.reduce(function(ind, e, i) {
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
            text: function(context) {
              ///determines dataset y axis label
              const datasets = context.chart.data.datasets;
              const chart = context.chart;
              let datasetLabel = '';
              datasets.forEach((dataset, i) => {
                if (chart.isDatasetVisible(i)) {
                  datasetLabel = dataset.label;
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
          <button onClick={() => { setCountryInfo(false); onClose(); }} style={{ float: "right" }}>Close</button>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ marginBottom: 0 }}>Country: {countryData.name} ({country.code})</h2>
            <button hidden onClick={toggleCountryInfo} style={{ padding: 0, paddingRight: 1, paddingLeft: 1, border: 'none' }}>&#9432;</button>
          </div>
          <CountryInfo showInfo={showCountryInfo} countryData={countryData} />

          <p>Indicator Value: {country.value}</p>

          <PanelForm country={country} isOpen={isOpen} setChartData={setChartData} fetchCountryData={fetchCountryData} />
          <Line style={{ color: 'lightblue' }} ref={chartRef} data={chartData} options={options} />
        </div >
      )}
    </div >
  )
}

export default CountryPanel;
