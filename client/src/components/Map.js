import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import axios from 'axios';
import { scaleLinear } from "d3-scale";


const geoUrl =
  "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const Map = ({dateBeg, dateEnd, indicator}) => {
  const [data, setData] = useState([]);

  // Fetch data from api and parses it(for now) to the format that is used in the map
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get(`api/indicator/${indicator}?dateBeg=${dateBeg}&dateEnd=${dateEnd}`);
        parseData(result.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [dateBeg, dateEnd, indicator]);
  
  // moving to backend?
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

          newData[countryCode] = { value: changePercentage, countryiso3code: countryCode };
        }
      } else {
        newData[countryCode] = { value: null, countryiso3code: countryCode };
      }
    });

    setData(newData);
  };
    
  //TODO: change logic based on indicator, add dynamic range or smth
  const colorScales = {
    gdp: scaleLinear().domain([-3, 3]).range(["red", "green"]),
    ur: scaleLinear().domain([3, -3]).range(["red", "green"]),
    cpi: scaleLinear().domain([-3, 3]).range(["green", "red"]),
  };
  // choose color for the country
  const getCountryColor = (countryCode) => {
    const countryData = data[countryCode];
    if (!countryData || countryData.value === null) return "#EEE";
    return colorScales[indicator](countryData.value);
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
