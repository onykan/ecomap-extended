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

  // Fetch data from api
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get(`/api/datalayer/${indicator}aapc?dateBeg=${dateBeg}&dateEnd=${dateEnd}`);
        setData(result.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [dateBeg, dateEnd, indicator]);
   
  // Define color scales for each indicator
  const colorScales = {
    gdp: scaleLinear().domain([-3,3]).range(["red", "green"]),
    //TODO: logic for ur
    ur: scaleLinear().domain([1, -1]).range(["red", "green"]),
    cpi: scaleLinear().domain([-1, 1, 10]).range(["red", "green", "red"]),
  };

  // choose color for the country
  const getCountryColor = (countryCode) => {
    const countryData = data[countryCode];
    if (!countryData || countryData.value === null) return "#EEE";
    return colorScales[indicator](countryData);
  };

  // Handle country click to open panel with country data
  const handleCountryClick = (countryCode) => {
    console.log("countryCode", countryCode);
    const countryData = data[countryCode];
    setSelectedCountry({ code: countryCode, ...countryData });
    setIsPanelOpen(true);
  };

  // Handle mouse enter to show tooltip with country data
  const handleMouseEnter = (countryCode) => {
    const countryData = data[countryCode];
    const countryName = countryNames[countryCode] || countryCode;
    setTooltipContent(`${countryName}
                       <br /> Yearly change: ${countryData ? (countryData.toFixed(1) + "%") : "No data"}`);
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
