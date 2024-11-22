import React, { useEffect, useState } from 'react';
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
  const [countryData, setCountryData] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [1,2,3],
    datasets: [
      {
        label: 'Loading...',
        data: [0,0,0],
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
          const datasets = Object.keys(cData).map((key) => {
            return {
              label: key,
              data: Object.values(cData[key]),
              borderColor: 'rgba(75,192,192,1)',
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

      responsive : true,
      plugins: {
      legend: {position: "top"},
      title: {
      display: true,
      text: 'GDP of Country',
      }
  }}

  if (!chartData) {
    return null;
  }

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

            <Line data={chartData} options={options}/>
          
          
        </div>
      )}
    </div>
  );
};

export default CountryPanel;
