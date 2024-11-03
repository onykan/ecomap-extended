/* import React, {useLayoutEffect, useState} from 'react';
import './App.css';
import axios from 'axios';

function App () {
  const [randomStr, setRandomStr] = useState('');
  useLayoutEffect(() => {
    axios.get('/api/json')
    .then(res => {
      setRandomStr(res.data.test)
    })
  })
  return (
    <div>
      {randomStr}
    </div>
  );
}

export default App;
*/
import React, { useState, useRef } from 'react';
import Map from './components/Map';

function App() {
  const [dateBeg, setDateBeg] = useState('2022');
  const [dateEnd, setDateEnd] = useState('2023');
  const [indicator, setIndicator] = useState('gdp');
  const dateBegRef = useRef(null);
  const dateEndRef = useRef(null);

  /// Handles the form submit
  /// sets values to dateBeg and dateEnd
  const handleSubmit = (event) => {
    event.preventDefault();
    if (checkValues()) {
      return;
    }
    const newDateBeg = dateBegRef.current.value;
    const newDateEnd = dateEndRef.current.value;
    setDateBeg(newDateBeg);
    setDateEnd(newDateEnd);
    console.log({ dateBeg: newDateBeg, dateEnd: newDateEnd });

    // You can add any validation or processing here if needed
  };


  /// Checks ways to validate the input
  /// The input must be a number and the year range is from 1960 to 2023
  /// also the end year must be greater than the begin year
  /// Maximum range is 30 years
  function checkValues() {
    const newDateBeg = dateBegRef.current.value;
    const newDateEnd = dateEndRef.current.value;
    if (newDateBeg === '' || newDateEnd === '') {
      alert('Please enter a value for both fields');
      return true;
    }
    if (isNaN(newDateBeg) || isNaN(newDateEnd)) {
      alert('Please enter a valid number');
      return true;
    }
    if (newDateBeg < 1960 || newDateEnd > 2023 || newDateBeg > newDateEnd) {
      alert('Please enter a valid year. The year range is from 1960 to 2023');
      return true;
    }
    if (newDateEnd - newDateBeg > 30) {
      alert('The maximum range is 30 years');
      return true;
    }
    return false;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Begin year:
          <input
            type="text"
            name="datebeg"
            ref={dateBegRef}
            defaultValue={dateBeg}
          />
        </label>
        <label>
          End year:
          <input
            type="text"
            name="dateEnd"
            ref={dateEndRef}
            defaultValue={dateEnd}
          />
        </label>
        <label>
          Indicator:
          <select value={indicator} onChange={(n) => setIndicator(n.target.value)}>
            <option value="gdp">GDP</option>
            <option value="ur">Unemployment Rate</option>
            <option value="cpi">Inflation Rate (CPI)</option>
          </select>
        </label>

        <input type="submit" />
      </form>
      <div>
        <Map dateBeg={dateBeg} dateEnd={dateEnd} indicator={indicator} />
      </div>
    </div>
  );
}

export default App;

