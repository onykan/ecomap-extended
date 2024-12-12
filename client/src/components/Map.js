import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Sphere, Graticule, ZoomableGroup } from "react-simple-maps";
import axios from 'axios';
import { scaleLinear } from "d3-scale";
import CountryPanel from "./CountryPanel";
import { Tooltip } from 'react-tooltip';
import MapLegend from './MapLegend';
import '../styles/Map.css';

const geoUrl =
  "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const Map = ({ dateBeg, dateEnd, indicator, countryNames, gdpData, urData, cpiData }) => {
  const [data, setData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [yearIsSame, setYearIsSame] = useState(false);

  // Fetch data from api or use pre-fetched data
  useEffect(() => {
      if (dateBeg === dateEnd) {
        setYearIsSame(true);
        switch (indicator) {
          case 'gdp':
            console.log("gdpdata", gdpData);
            setData(gdpData);
            break;
          case 'ur':
            setData(urData);
            break;
          case 'cpi':
            setData(cpiData);
            break;
          default:
            setData([]);
        }
      } else {
        setYearIsSame(false);
        const fetchData = async () => {
        try {
          const url = `/api/datalayer/${indicator}aapc?dateBeg=${dateBeg}&dateEnd=${dateEnd}`;
          const result = await axios.get(url);
          setData(result.data);
          console.log("Data fetched:", result.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
    fetchData(); 
  }
  console.log({ data });  
  }, [dateBeg, dateEnd, indicator]);


  // Color scales for different indicators
  const colorScales = {
    gdp: {
      stops: [-8, 0, 8],
      colors: ["red", "white", "green"],
      clamp: true
    },
    ur: {
      stops: [-2, 0, 10],
      colors: ["green", "white", "red"],
      clamp: true
    },
    cpi: {
      stops: [-2, 0, 2, 4, 7],
      colors: ["red", "white", "green", "white", "red"],
      clamp: true
    },
    gdpC: {
      stops: [0, 100000000000, 500000000000],
      colors: ["red", "white", "green"],
      clamp: true
    },
    urC: { 
      stops: [3, 7, 15],
      colors: ["green", "white", "red"],
      clamp: true
    },
    //TODO fix color scale for cpiC
    cpiC: {
      stops: [-1, 1],
      colors: ["white", "white"],
      clamp: true
    }
  }

  // choose color for the country
  const getCountryColor = (countryCode) => {
    const countryData = data[countryCode];
    
    if (!countryData) return "#888";
    const value = yearIsSame ? countryData[dateBeg] : countryData;
    if (value === null) return "#EEE";
    let colSc;
    if (yearIsSame) {
      // Different coloring logic when year is the same
      colSc = colorScales[indicator + "C"];
    } else {
      // Existing coloring logic when years are different
      colSc = colorScales[indicator];
    }
    return scaleLinear().domain(colSc.stops).range(colSc.colors).clamp(colSc.clamp)(value);
  };

  const getGradientStops = () => {
    let colSc;
    if (yearIsSame) colSc = colorScales[indicator + "C"];
    else colSc = colorScales[indicator];
    return colSc.stops;
  }

  const getGradientColors = () => {
    let colSc;
    if (yearIsSame) colSc = colorScales[indicator + "C"];
    else colSc = colorScales[indicator];
    return colSc.colors;
  }

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
    <div
      style={{
        position: "relative",
        height: "30%",
        overflow: "hidden",
        width: isPanelOpen ? "58%" : "100%",
        transition: "width 0.3s ease",

      }
      }
    >
      <div style={{position: "absolute"}}>
        <MapLegend
          id="maplegend"
          stops={getGradientStops()}
          colors={getGradientColors()}
        />
      </div>
      <ComposableMap data-tooltip-id="tip"
        data-tooltip-html={tooltipContent}
      >
        <ZoomableGroup
          center={[0, 0]}
          minZoom={1}
          maxZoom={5}
          translateExtent={[
            [-500, -300], // Top-left corner
            [1300, 900],   // Bottom-right corner
          ]}
        >
          <Sphere stroke="#EAEAEC" fill="#1a1a1a" />
          <Graticule stroke="white" strokeWidth={0.3} />
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
                      hover: { fill: "#2B6CB0", outline: "none", cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <Tooltip id="tip" float={true} />

      <CountryPanel country={selectedCountry} isOpen={isPanelOpen} onClose={closePanel} />
    </div>
  );
};

export default Map;
