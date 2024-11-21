import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import axios from 'axios';
import { scaleLinear } from "d3-scale";
import CountryPanel from "./CountryPanel";
import { Tooltip } from 'react-tooltip';

const geoUrl =
  "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const Map = ({dateBeg, dateEnd, indicator, countryNames}) => {
  const [data, setData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [yearIsSame, setYearIsSame] = useState(false);

  // Fetch data from api
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = dateBeg === dateEnd 
          ? `/api/datalayer/${indicator}?dateBeg=${dateBeg}&dateEnd=${dateEnd}`
          : `/api/datalayer/${indicator}aapc?dateBeg=${dateBeg}&dateEnd=${dateEnd}`;
        const result = await axios.get(url);
        setData(result.data);
        console.log("Data fetched:", result.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
    setYearIsSame(dateBeg === dateEnd);
  }, [dateBeg, dateEnd, indicator]);
   
  // Define color scales for each indicator
  const colorScales = {
    gdp: scaleLinear().domain([-3,3]).range(["red", "green"]),
    ur: scaleLinear().domain([1, -1]).range(["red", "green"]),
    cpi: scaleLinear().domain([-1, 1, 10]).range(["red", "green", "red"]),
    //if (yearIsSame) we need to use different color scale
    gdpC: scaleLinear().domain([0,300000000000]).range(["red", "green"]),
    //TODO fix color scale for urC and cpiC
    urC: scaleLinear().domain([1, -1]).range(["red", "green"]),
    cpiC: scaleLinear().domain([-1, 1, 10]).range(["red", "green", "red"]),
  };

  // choose color for the country
  const getCountryColor = (countryCode) => {
    const countryData = data[countryCode];
    if (!countryData) return "#EEE";
    const value = yearIsSame ? countryData[dateBeg] : countryData;
    if (value === null) return "#EEE";
    if (yearIsSame) {
      // Different coloring logic when year is the same
      return colorScales[indicator+"C"](value);
    } else {
      // Existing coloring logic when years are different
      return colorScales[indicator](value);
    }
  };

  // Handle country click to open panel with country data
  const handleCountryClick = (countryCode) => {
    console.log("countryCode", countryCode);
    const countryData = data[countryCode];
    setSelectedCountry({ code: countryCode, ...countryData });
    setIsPanelOpen(true);
  };

  //TODO: fix excessive re-rendering when hovering countries. Maybe use React.memo?
  // Handle mouse enter to show tooltip with country data
  const handleMouseEnter = (countryCode) => {
    const countryData = data[countryCode];
    const countryName = countryNames[countryCode] || countryCode;
    // Ensure countryData is not undefined
    const value = countryData ? (yearIsSame ? countryData[dateBeg] : countryData) : null;
    // Ugly but works
    setTooltipContent(`${countryName}
                       <br /> ${yearIsSame ? indicator + " " + value : "Yearly change " + (value ? (value.toFixed(1) + "%") : "No data")}`);
  }

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedCountry(null);
  };

  return (
    <>
      <ComposableMap data-tooltip-id="tip"
                     data-tooltip-html={tooltipContent}>
        <Sphere stroke="#EAEAEC" fill="#1a1a1a"/>
        <Graticule stroke="white" strokeWidth={0.3}/>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryCode = geo.id;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getCountryColor(countryCode)}
                  onMouseEnter={() => handleMouseEnter(countryCode)}
                  onMouseLeave={() => {
                    setTooltipContent("");
                  }}
                  onClick={() => handleCountryClick(countryCode)}          
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
      <Tooltip id="tip" float={true} />
    
    <CountryPanel country={selectedCountry} isOpen={isPanelOpen} onClose={closePanel} />
    </>
  );
};

export default Map;
