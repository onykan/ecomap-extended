// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IndicatorForm from './components/IndicatorForm';
import Map from './components/Map';
import IndicatorsInfo from './components/IndicatorsInfo';
import './App.css';

const App = () => {
  const [dateBeg, setDateBeg] = useState('2022');
  const [dateEnd, setDateEnd] = useState('2023');
  const [indicator, setIndicator] = useState('gdp');
  const [indicators, setIndicators] = useState([]);
  const [indicatorsInfoOpen, setIndInfoVisible] = useState(false);
  const [countryNames, setCountryNames] = useState({});

  useEffect(() => {
    const fetchCountryNames = async () => {
      try {
        const result = await axios.get('/api/country/all/name');
        setCountryNames(result.data);
      } catch (error) {
        console.error('Error fetching country names:', error);
      }
    };
    const fetchIndicators = async () => {
      try {
        const url = `/api/indicators`
        const result = await axios.get(url);
        setIndicators(result.data);
      } catch (error) {
        console.error("Error fetching indicators:", error);
      }
    };
    fetchCountryNames();
    fetchIndicators();
  }, []);

  return (
    <div >
      <div id="wideTopbar">
        <div id="topbar">
          <div id="Title">
            <h1>World EcoMap</h1>
            <p>This map shows the selected indicator for each country. The color of a country corresponds to the value of the indicator.
              You can select the indicator and the year range to display.</p>
            <p>The data used in this project is sourced from the World Bank Open Data platform. For more information, visit <a href='https://data.worldbank.org'>World Bank Open Data</a>.</p>
          </div>
          <IndicatorForm
            id="indicatorform"
            dateBeg={dateBeg}
            dateEnd={dateEnd}
            indicator={indicator}
            setDateBeg={setDateBeg}
            setDateEnd={setDateEnd}
            setIndicator={setIndicator}
          />
        </div>
        <div id='Help'>
          <div style={{ display: "block", position: "relative", width: "40%", minWidth: "20em" }}>
            <button onClick={() => { setIndInfoVisible(!indicatorsInfoOpen) }} style={{ padding: 3, width: "100px" }}>Indicators</button>
            <IndicatorsInfo showInfo={indicatorsInfoOpen} indicators={indicators} />
          </div>
          <div style={{ borderLeft: '1px solid lightblue', paddingLeft: '2em' }}>
            <h2>Help</h2>
            <p>Choose a start and end year to see the percentual change of data in the assigned years. </p>
            <p>Using only one year gives the absolute value of chosen indicator for the chosen year. </p>
            <p>Click a country to see detailed information about the chosen country. </p>
          </div>

        </div>
      </div >
      <Map
        dateBeg={dateBeg}
        dateEnd={dateEnd}
        indicator={indicator}
        countryNames={countryNames}
      />
    </div >
  );
}

export default App;
