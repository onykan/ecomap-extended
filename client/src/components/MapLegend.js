import React /*, { useEffect, useState }*/ from 'react';
//const ns = 'http://www.w3.org/2000/svg';

const MapLegend = ({id, stops, colors}) => {
    if (stops.length < 2 || stops.length !== colors.length) return <div>Error creating map legend</div>;

    function mapRange(mn, mx, v) {
        return (v - mn) / (mx - mn) * 100;
    }

    const min = stops.at(0);
    const max = stops.at(stops.length - 1);
    if (min >= max) return <div>Error creating map legend</div>;

    const stopMap = new Map();
    for (let i = 0; i < stops.length; i++) {
        stopMap.set(mapRange(min, max, stops.at(i)), colors.at(i));
    }

    const stopList = [];
    let keynum = 0;
    stopMap.forEach((val, key) => { stopList.push( <stop key={"stop" + keynum++} offset={key + "%"} stopColor={val}/> ) });

    return <div id={id}>
        <div id={id + "Inner"}>
            <div id={id + "Gradient"}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
                    <defs>
                        <linearGradient id="gradient">
                            {stopList}
                        </linearGradient>
                    </defs>
                    <rect width="100" height="100" fill="url('#gradient')"/>
                </svg>
            </div>
            <div id={id + "Numbers"}>
                <div>{new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short", }).format(min)}</div>
                <div>{new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short", }).format(max)}</div>
            </div>
        </div>
    </div>;
}

export default MapLegend;