import React, { useRef, useState } from 'react';

const IndicatorForm = ({ dateBeg, dateEnd, indicator, setDateBeg, setDateEnd, setIndicator }) => {
  const dateBegRef = useRef(null);
  const dateEndRef = useRef(null);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (validateValues()) {
      const newDateBeg = dateBegRef.current.value;
      const newDateEnd = dateEndRef.current.value;

      setDateBeg(newDateBeg);
      setDateEnd(newDateEnd);
      
      console.log({ dateBeg: newDateBeg, dateEnd: newDateEnd });
    }
  };

  const validateValues = () => {
    const newDateBeg = dateBegRef.current.value;
    const newDateEnd = dateEndRef.current.value;

    if (newDateBeg > newDateEnd) {
      setError('Start year should be before end year');
      return false;
    }
    if (newDateEnd - newDateBeg > 30) {
      setError('The maximum range is 30 years');
      return false;
    }
    setError(''); // Clear any previous errors if validation passes
    return true;
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Begin year:
        <input
          type="number"
          name="dateBeg"
          ref={dateBegRef}
          defaultValue={dateBeg}
          min="1960"
          max="2023"
        />
      </label>
      <label>
        End year:
        <input
          type="number"
          name="dateEnd"
          ref={dateEndRef}
          defaultValue={dateEnd}
          min="1960"
          max="2023"
        />
      </label>
      <label>
        Indicator:
        <select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
          <option value="gdp">GDP</option>
          <option value="ur">Unemployment Rate</option>
          <option value="cpi">Inflation Rate (CPI)</option>
        </select>
      </label>
      <input type="submit" value="Submit" />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
};

export default IndicatorForm;
