// App.js
import React, { useState } from 'react';
import IndicatorForm from './components/IndicatorForm';
import Map from './components/Map';

const App = () => {
  const [dateBeg, setDateBeg] = useState('2022');
  const [dateEnd, setDateEnd] = useState('2023');
  const [indicator, setIndicator] = useState('gdpchange');

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
      <Map dateBeg={dateBeg} dateEnd={dateEnd} indicator={indicator} />
    </div>
  );
}

export default App;
