// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IndicatorForm from './components/IndicatorForm';
import Map from './components/Map';
import MapLegend from './components/MapLegend';
import './App.css';
import { Title } from 'chart.js';

const App = () => {
  const [dateBeg, setDateBeg] = useState('2022');
  const [dateEnd, setDateEnd] = useState('2023');
  const [indicator, setIndicator] = useState('gdp');
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
    fetchCountryNames();
  }, []);

  return (
    <div >
      <div id="wideTopbar">
        <div id="topbar">
          <div id="Title">
            <h1>World EcoMap</h1>
            <p>          This map shows the selected indicator for each country. The color of a country corresponds to the value of the indicator.
              You can select the indicator and the year range to display.</p>
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
          <h2>Help</h2>
          <p>TODO: Click on a country to see the value of the indicator.</p>

        </div>
      </div>
      <Map
        dateBeg={dateBeg}
        dateEnd={dateEnd}
        indicator={indicator}
        countryNames={countryNames}
      />
      <MapLegend
        id="maplegend"
        stops={[0, 100000000000, 500000000000]}
        colors={["red", "white", "green"]}
      />
    </div>
  );
}

export default App;
