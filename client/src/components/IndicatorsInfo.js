import '../App.css';

const IndicatorsInfo = ({ showInfo, indicators }) => {
  return (
    showInfo && (
      <div style={{ float: "right", width: "20em" }}>
        {indicators && indicators.map((indicator, i) => (
          <div style={{ width: '100%' }} key={i}>
            <span style={{ display: 'inline-block', width: "100px" }}>{indicator.id}: </span>
            <span>{indicator.name}</span>
            <div class="ind-tooltip"> &#9432;
              <span class="ind-tooltiptext">{indicator.description}</span>
            </div>
          </div>
        ))}
      </div>
    )
  );
}

export default IndicatorsInfo
