const CountryInfo = ({ showInfo, countryData }) => {

  return (
    showInfo && (
      <div>
        <div>
          <span style={{ display: 'inline-block', width: '100px' }}>Region: </span>
          <span>{countryData.region}</span>
        </div>
        <div>
          <span style={{ display: 'inline-block', width: '100px' }}>Capital: </span>
          <span>{countryData.capital}</span>
        </div>
        <div>
          <span style={{ display: 'inline-block', width: '100px' }}>Longitude: </span>
          <span>{countryData.longitude}</span>
        </div>
        <div>
          <span style={{ display: 'inline-block', width: '100px' }}>Latitude: </span>
          <span>{countryData.latitude}</span>
        </div>
      </div>
    )
  );
}

export default CountryInfo
