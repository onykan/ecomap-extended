import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, plugins } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  plugins
);

const CountryPanel = ({ country, isOpen, onClose }) => {
  const predictRef = useRef(null);
  const [predictYears, setPredict] = useState(0);
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
      try {
        axios.get(`/api/country/${country.code}/data`)
          .then((response) => {
            const data = response.data[country.code].info;
            setCountryData(data);

            const cData = response.data[country.code].indicators

            console.log("data", cData);
            const labels = Object.keys(cData.GDP);
            console.log("labels", labels);
            let i = 0;
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
  }
    , [country, isOpen]);

  const options = {

    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: 'GDP of Country',
      }
    }
  }

  if (!chartData) {
    return null;
  }

  const handlePredictSubmit = async (event) => {
    event.preventDefault();
    let pYears = predictRef.current.value;
    setPredict(pYears);

    try {
      axios.get(`/api/country/${country.code}/data?predict=${pYears}&compress=y`)
        .then((response) => {
          const predict = response.data[country.code].predict;
          const indData = response.data[country.code].indicators;

          const labelsData = Object.keys(indData.GDP);
          const datasetsData = Object.keys(indData).map((key) => {
            return {
              label: key,
              data: Object.values(indData[key]),
              borderColor: 'rgba(75,192,192,1)'
            }
          });

          if (pYears <= 0) {
            setChartData({
              labels: labelsData,
              datasets: datasetsData,
            })
            return;
          }

          // TODO: get last year from data
          let lastYear = 2023;
          let labels = [lastYear];
          for (let i = 1; i <= pYears; i++) {
            labels.push(lastYear + i);
          }
          const datasets = Object.keys(predict).map((key) => {
            let dataset = {
              label: key,
              data: [],
              segment: {}
            };
            dataset.data.push({ x: lastYear, y: indData[key][lastYear] });
            Object.entries(predict[key]).forEach(([k, val]) => {
              dataset.data.push({ x: Number(k), y: val });
              dataset.borderColor = 'rgba(255,0,0,1)';
            })
            return dataset;
          }
          );
          setPredictData({
            labels: labels,
            datasets: datasets,
          })
          const updatedLabels = [...labelsData];
          const updatedDatasets = [...datasetsData];
          labels.forEach(e => { updatedLabels.push(e) });
          datasets.forEach(e => { updatedDatasets.push(e) });

          setChartData({ labels: Array.from(new Set(updatedLabels.map(Number))).sort((a, b) => a - b), datasets: updatedDatasets });

          console.log("chart data", chartData);

        });
    } catch (error) {
      console.error("Error fetching predict data:", error);
    }

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

          <form onSubmit={handlePredictSubmit}>
            <label>
              Predict:
              <input
                type="number"
                name="predict"
                min={0}
                max={10}
                ref={predictRef}
                defaultValue={predictYears}
                onChage={() => setPredict(predictRef.current.value)}
              />
            </label>
            <input type="submit" value="Submit" />
          </form>

          <Line data={chartData} options={options} />


        </div>
      )}
    </div>
  );
};

export default CountryPanel;
