import React, { useRef, useState } from 'react';
import '../styles/IndicatorForm.css';

const IndicatorForm = ({ dateBeg, dateEnd, indicator, setDateBeg, setDateEnd, setIndicator }) => {
  const dateBegRef = useRef(null);
  const dateEndRef = useRef(null);
  const indicatorRef = useRef(null);
  const [error, setError] = useState('');
  const [currentDateBeg, setCurrentDateBeg] = useState(dateBeg);
  const [currentDateEnd, setCurrentDateEnd] = useState(dateEnd);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (validateValues()) {
      const newDateBeg = dateBegRef.current.value;
      const newDateEnd = dateEndRef.current.value;
      const newIndicator = indicatorRef.current.value;

      setDateBeg(newDateBeg);
      setDateEnd(newDateEnd);
      setIndicator(newIndicator);

      console.log({ dateBeg: newDateBeg, dateEnd: newDateEnd, indicator: newIndicator });
    }
  };

  const validateValues = () => {
    const newDateBeg = dateBegRef.current.value;
    const newDateEnd = dateEndRef.current.value;

    if (newDateBeg > newDateEnd) {
      setError('Start year should be before or same as end year');
      return false;
    }

    setError(''); // Clear any previous errors if validation passes
    return true;
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        <input
          class="slider"
          type="range"
          name="dateBeg"
          ref={dateBegRef}
          defaultValue={dateBeg}
          min="1960"
          max="2023"
          onChange={() => setCurrentDateBeg(dateBegRef.current.value)}
        />
        <span>Begin year: {currentDateBeg}</span>
      </label>
      <label>

        <input
          class="slider"
          type="range"
          name="dateEnd"
          ref={dateEndRef}
          defaultValue={dateEnd}
          min="1960"
          max="2023"
          onChange={() => setCurrentDateEnd(dateEndRef.current.value)}

        />
        <span>End year: {currentDateEnd}</span>

      </label>
      <div id="Indicator">
        Indicator:
        <select ref={indicatorRef} defaultValue={indicator} id="dropdown"
        >
          <option value="gdp">GDP</option>
          <option value="ur">Unemployment Rate</option>
          <option value="cpi">Inflation Rate (CPI)</option>
        </select>
        <input type="submit" value="Submit" />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

    </form>
  );
};

export default IndicatorForm;
