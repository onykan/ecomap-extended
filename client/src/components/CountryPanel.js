import React from 'react';

const CountryPanel = ({ country, isOpen, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: isOpen ? "300px" : "0px",
        overflow: "hidden",
        backgroundColor: "#f4f4f4",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
        transition: "width 0.3s ease",
        padding: isOpen ? "20px" : "0px",
      }}
    >
      {isOpen && country && (
        <div>
          <button onClick={onClose} style={{ float: "right" }}>Close</button>
          <h2>Country: {country.code}</h2>
          <p>Indicator Value: {country.value}</p>
        </div>
      )}
    </div>
  );
};

export default CountryPanel;
