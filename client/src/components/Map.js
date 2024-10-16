import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import axios from 'axios';

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const Map = () => {
  const [data, setData] = useState([]);
/*
  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get('http://localhost:3001/api/countries');
      setData(result.data);
      console.log(result.data)
    };
    fetchData();
  }, []);
  */

  const getCountryColor = (countryName) => {
    const countryData = data.find((country) => country.country === countryName);
    if (!countryData) return "#EEE"
    console.log(countryData)
    const { gdp } = countryData;

    if (gdp > 10000) return "#4CAF50" //green
    if (gdp > 1000) return "#FFC107" //yellow
    return "#F44336" //red
  }

  return (
    <ComposableMap>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => {
        
            const countryName = geo.properties.name; // by name TEMPORARILY
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                //fill={getCountryColor(countryName)}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#2B6CB0", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
};

export default Map
