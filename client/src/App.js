// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IndicatorForm from './components/IndicatorForm';
import Map from './components/Map';

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
    <div>
      <IndicatorForm 
        dateBeg={dateBeg} 
        dateEnd={dateEnd} 
        indicator={indicator} 
        setDateBeg={setDateBeg} 
        setDateEnd={setDateEnd} 
        setIndicator={setIndicator} 
      />
      <Map 
        dateBeg={dateBeg}
        dateEnd={dateEnd} 
        indicator={indicator}
        countryNames={countryNames}
      />
    </div>
  );
}

export default App;
