import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import axios from 'axios';
import { scaleBand, scaleLinear, scalePow } from "d3-scale";


// Changed the map to this version to get ISO3 codes for the countries
const geoUrl =
  "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const Map = ({dateBeg, dateEnd, indicator}) => {
  const [data, setData] = useState([]);

  // Fetch data from api and parses it to the format that is used in the map
  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get(`api/indicator/${indicator}?dateBeg=${dateBeg}&dateEnd=${dateEnd}`);
      parseData(result.data);
    };
    fetchData();
  }, [dateBeg, dateEnd, indicator]);
  
  // does stuff
  const parseData = (apiData) => {
    const newData = {};

    Object.keys(apiData).forEach((countryCode) => {
      const countryData = apiData[countryCode];
      const firstYear = countryData[countryData.length - 1];
      const lastYear = countryData[0];

      if (firstYear && lastYear && countryData.length > 1) {
        const firstValue = firstYear.value;
        const lastValue = lastYear.value;
        if (firstValue != null && lastValue != null) {
          let changePercentage = ((lastValue / firstValue) - 1) * 100;

          // Apply color logic based on the indicator type
          if (indicator === 'gdp') {
            newData[countryCode] = { value: changePercentage, countryiso3code: countryCode };
          } else if (indicator === 'ur') {
            // Inverse scale for Unemployment Rate: Higher values (more unemployment) in red
            newData[countryCode] = { value: changePercentage, countryiso3code: countryCode };
          } else if (indicator === 'cpi') {
            // Consumer Price Index change
            newData[countryCode] = { value: changePercentage, countryiso3code: countryCode };
          }
        }
      } else {
        newData[countryCode] = { value: null, countryiso3code: countryCode };
      }
    });

    setData(newData);
  };
    
  // First checks which geography is which country with iso3 code

  const getCountryColor = (countryCode) => {
    const countryData = data[countryCode];
    if (!countryData || countryData.value === null) return "#EEE";

    let colorScale;
    if (indicator === 'gdp') {
      // GDP Green for positive growth, red for negative growth
      colorScale = scaleLinear().domain([-3, 3]).range(["red", "green"]);
    } else if (indicator === 'ur') {
      // Higher unemployment in red, lower in green
      colorScale = scaleLinear().domain([3, -3]).range(["red", "green"]);
    } else if (indicator === 'cpi') {
      // Higher inflation in red, lower inflation in green
      colorScale = scaleLinear().domain([-3, 3]).range(["green", "red"]);
    }

    return colorScale(countryData.value);
  };

  return (
    <ComposableMap>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const countryCode = geo.id;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={getCountryColor(countryCode)}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#2B6CB0", outline: "none", cursor: "pointer"},
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

export default Map;
