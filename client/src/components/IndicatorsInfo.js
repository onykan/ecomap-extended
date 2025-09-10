import '../App.css';

const IndicatorsInfo = ({ showInfo, indicators }) => {
  return (
    showInfo && (
      <div>
        {indicators && indicators.map((indicator, i) => (
          <div style={{ width: '100%' }} key={i}>
            <div className="ind-tooltip"> &#9432;
              <span className="ind-tooltiptext">{indicator.description}</span>
            </div>
            <span style={{ display: 'inline-block', width: "100px" }}>{indicator.id}: </span>
            <span>{indicator.name}</span>
          </div>
        ))}
      </div>
    )
  );
}

export default IndicatorsInfo
