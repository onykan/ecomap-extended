import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import axios from 'axios';
import { scaleBand, scaleLinear, scalePow } from "d3-scale";


// Changed the map to this version to get ISO3 codes for the countries
const geoUrl =
  "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const Map = ({dateBeg, dateEnd}) => {
  const [data, setData] = useState([]);
  /// Fetch data from api and parses it to the format that is used in the map
  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get('api/indicator/gdp?dateBeg='+dateBeg+'&dateEnd='+dateEnd+'');
      parsedata(result.data);
    };
    fetchData();
  }, [dateBeg, dateEnd]);
  
  /// Parses the data so the gdp is a persentual change from the first year to the last year
  /// Sets the data to the state
  /// If first or last year is null, the gdp is set to null
  //If given years have only one data point, the gdp is set to null
  const parsedata = (data) => {
      const newData = {};
      Object.keys(data).forEach(countryCode => {
        const countryData = data[countryCode];
        
        const gdpLast = countryData[0].value;
        const gdpFirst = countryData[countryData.length-1].value;

        if (gdpFirst != null && gdpLast != null && countryData.length > 1) {
          const gdpChangePersentage = ((gdpLast / gdpFirst)-1) * 100;
          newData[countryCode] = {gdp: gdpChangePersentage, countryiso3code: countryCode};
        }
        else {
          newData[countryCode] = {gdp: null, countryiso3code: countryCode};
        }
      });
      setData(newData);
  };
    
  /// First checks which geography is which country with iso3 code
  /// uses d3 linear color scale to get a color for the country based on the gdp persentage
  /// Right now the scale is from -3 to 3 based on the normal yearly gpd change
  const getCountryColor = (countryName) => {
    const countryData = Object.values(data).flat().find((entry) => entry.countryiso3code === countryName);
    if (!countryData) return "#EEE";

    const colorScale = scaleLinear().domain([-3,3]).range(["red", "green"]);
    const { gdp: gdp } = countryData;
    return colorScale(gdp);

  }

  return (
    <ComposableMap>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const countryName = geo.id;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={getCountryColor(countryName)}
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
