import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import axios from 'axios';
import { scaleLinear } from "d3-scale";


const geoUrl =
  "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const Map = ({dateBeg, dateEnd, indicator}) => {
  const [data, setData] = useState([]);
  const [DynRangeGDP, setDynRangeGDP] = useState(3); // dynamic range for GDP growth
  // Fetch data from api and parses it(for now) to the format that is used in the map
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get(`/api/datalayer/${indicator}?dateBeg=${dateBeg}&dateEnd=${dateEnd}`);
        setData(result.data);
        setDynRangeGDP(3 * (dateEnd  - dateBeg));
      } catch (error) {

        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [dateBeg, dateEnd, indicator]);
  
    
  //TODO: change logic based on indicator, add dynamic range or smth
  const colorScales = {
    gdpchange: scaleLinear().domain([-DynRangeGDP, DynRangeGDP]).range(["red", "green"]),
    ur: scaleLinear().domain([3, -3]).range(["red", "green"]),
    cpi: scaleLinear().domain([-3, 3]).range(["green", "red"]),
  };
  // choose color for the country
  const getCountryColor = (countryCode) => {
    const countryData = data[countryCode];
    if (!countryData || countryData.value === null) return "#EEE";
    return colorScales[indicator](countryData);
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
                onClick={() => console.log(countryCode)}
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
