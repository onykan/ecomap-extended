import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

let styles = {
  radioBlock: {
    display: "flex",
    width: "50%",
  },

  predictFormDiv: {
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    padding: "10px",
    width: "100%",
    borderRadius: "8px",
  },

  form: {
    display: "flex",
    padding: "10px",
    maxWidth: "250px",
    borderRadius: "8px",
  },

  formGroup: {
    display: "flex",
    alignItems: "center",
    marginBottom: "5px",
  },

  label: {
    width: "100px",
    fontSize: "16px",
  },

  input: {
    width: "40px",
    marginLeft: "auto",
    padding: "5px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "12px",
  },
};

const panelState = {
  normal: 'normal',
  predict: 'predict',
  fit: 'fit',
  info: 'info'
}

const PanelForm = ({ country, isOpen, setChartData, fetchCountryData }) => {
  const [panelFormState, setPredictFormState] = useState(panelState.normal);
  const [r2_scores, setR2Scores] = useState([]);
  const [predictDataLen, setPredictDataLen] = useState(0);
  const [predictData, setPredictData] = useState({ labels: [], datasets: [] });
  const [predictYears, setPredict] = useState(0);
  const predictRef = useRef(null);
  const predictDataLenRef = useRef(null);


  const fetchPredict = (years = predictYears) => {
    axios.get(`/api/country/${country.code}/data?` + new URLSearchParams({
      predict: years,
      predict_data_len: predictDataLen,
      compress: "y",
    })).then((response) => {
      let predict = response.data[country.code].predict;
      let indData = response.data[country.code].indicators;

      // Removes null indicators
      indData = Object.fromEntries(
        Object.entries(indData).filter(([key]) => indData[key] != null)
      );
      predict = Object.fromEntries(
        Object.entries(predict).filter(([key]) => predict[key] != null)
      );

      const labelsData = Object.keys(indData.GDP).map(e => Number(e));
      const max_year = Math.max(...labelsData) + 1;
      labelsData.push(max_year);
      const datasetsData = Object.keys(indData).map((key) => {
        const dataset = {
          label: key,
          data: Object.entries(indData[key])
            .map(([k, val]) => ({ x: Number(k), y: val })),
          borderColor: 'rgba(0,0,0,1)',
          usePointStyle: true,
          pointRadius: 0,
          hidden: true,
          hitRadius: 10,
          scale: 'y',
        };
        return dataset;
      });

      if (years <= 0) {
        setChartData({
          labels: labelsData,
          datasets: datasetsData,
        })
        return;
      }

      let labels = [];
      for (let i = 1; i <= years; i++) {
        labels.push(max_year + i);
      }
      const datasets = Object.keys(predict).map((key) => {
        let dataset = {
          label: key,
          data: [],
          borderColor: 'rgba(255,0,0,1)',
          usePointStyle: true,
          pointRadius: 0,
          hidden: true,
          hitRadius: 10,
          scale: 'y',
        };

        const maxYearForInd = Math.max(...Object.keys(indData[key]).map(Number));
        dataset.data.push({ x: maxYearForInd, y: indData[key][maxYearForInd] });
        Object.entries(predict[key]).forEach(([k, val]) => {
          dataset.data.push({ x: Number(k), y: val });
        })
        return dataset;
      }
      );
      setPredictData({
        labels: labels,
        datasets: datasets,
      })
      let updatedLabels = [...labelsData];
      let updatedDatasets = [...datasetsData];
      labels.forEach(e => { updatedLabels.push(e) });
      datasets.forEach(e => { updatedDatasets.push(e) });

      setChartData({ labels: Array.from(new Set(updatedLabels.map(Number))).sort((a, b) => a - b), datasets: updatedDatasets });
    }).catch(function (error) {
      console.error("Error fetching predict data:", error);
      return {
        labels: [0, 0, 0],
        datasets: [
          {
            label: 'Error fetching data',
            data: [0, 0, 0],
            borderColor: 'rgba(0,0,0,1)',
          }
        ]
      }
    })
  }

  const linearRegFit = () => {
    axios.get(`/api/country/${country.code}/data?` + new URLSearchParams({
      fit: "y",
      compress: "y",
    })).then((response) => {
      const fit_data = response.data[country.code].fit
      const indData = response.data[country.code].indicators;

      let r2Scores = [];
      const labels = Object.keys(indData.GDP).map(e => Number(e));
      const max_year = Math.max(...labels);
      labels.push(max_year + 1);
      let datasets = [];
      Object.keys(indData).forEach((key) => {
        datasets.push({
          label: key,
          data: Object.keys(indData[key]).reduce((dataset, k) => {
            dataset.push({ x: Number(k), y: indData[key][k] });
            return dataset;
          }, []),
          borderColor: 'rgba(0,0,0,1)',
          usePointStyle: true,
          pointRadius: 0,
          hidden: true,
          hitRadius: 10,
          scale: 'y',
        });
      });
      Object.keys(fit_data).forEach((key) => {
        datasets.push({
          label: key,
          data: Object.keys(fit_data[key].y_hat).reduce((dataset, k) => {
            dataset.push({ x: Number(fit_data[key].x[k]), y: fit_data[key].y_hat[k] });
            return dataset;
          }, []),
          borderColor: 'rgba(255,0,0,1)',
          usePointStyle: true,
          pointRadius: 0,
          hidden: true,
          hitRadius: 10,
          scale: 'y',
        });
        r2Scores.push([key, fit_data[key].r2]);
      });

      setR2Scores(r2Scores);
      setChartData({ labels: labels, datasets: datasets });
    }).catch(function (error) {
      console.error("Error fetching predict data:", error);
      return {
        labels: [0, 0, 0],
        datasets: [
          {
            label: 'Error fetching data',
            data: [0, 0, 0],
            borderColor: 'rgba(0,0,0,1)',
          }
        ]
      }
    })
  };


  const handlePredictSubmit = async (event) => {
    event.preventDefault();
    fetchPredict();
  };

  useEffect(() => {
    if (country && isOpen) {
      const fetchNormalData = async () => {
        let cData = await fetchCountryData();
        setChartData(cData);
      }
      switch (panelFormState) {
        case panelState.normal:
          fetchNormalData();
          break;
        case panelState.predict:
          fetchPredict();
          break;
        case panelState.fit:
          linearRegFit();
          break;
        case panelState.info:
          break;
      }
    }
  }, [country, panelFormState]);

  return (
    <div style={styles.predictFormDiv}>
      <form style={styles.radioBlock}>
        <label className="radio-inline">
          <input type="radio" name="predictRadio" onChange={() => {
            setPredictFormState(panelState.normal);
          }}
            checked={panelFormState === panelState.normal} />Normal
        </label>
        <label className="radio-inline">
          <input type="radio" name="predictRadio" onChange={() => {
            setPredictFormState(panelState.predict);
          }}
            checked={panelFormState === panelState.predict} />Predict
        </label>
        <label className="radio-inline">
          <input type="radio" name="predictRadio" onChange={() => {
            setPredictFormState(panelState.fit);
          }} checked={panelFormState === panelState.fit} />Fit
        </label>
        <label className="radio-inline">
          <input type="radio" name="predictRadio" onChange={() => {
            setPredictFormState(panelState.info)
          }}
            checked={panelFormState === panelState.info} />Info
        </label>
      </form>
      {panelFormState === panelState.predict && (
        <div></div>
      )}
      {panelFormState === panelState.predict && (
        <form onSubmit={handlePredictSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="data_len">Prediction data length:</label>
            <input
              style={styles.input}
              type="number"
              name="predict_data_len"
              min={0}
              max={100}
              ref={predictDataLenRef}
              defaultValue={predictDataLen}
              onChange={() => setPredictDataLen(predictDataLenRef.current.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="predict_years">Predicted years:</label>
            <input
              style={styles.input}
              type="number"
              name="predict"
              min={0}
              max={20}
              ref={predictRef}
              defaultValue={predictYears}
              onChange={() => setPredict(predictRef.current.value)}
            />
          </div>
          <input type="submit" value="Predict" style={styles.button} />
        </form>
      )}
      {panelFormState === panelState.fit && (
        <div>
          <b>R² scores:</b>
          {
            Array.from({ length: r2_scores.length }).map((_, i) => (
              <div key={i}>
                <span style={{ display: 'inline-block', width: '100px' }}>{r2_scores[i][0]}: </span>
                <span>{Number(r2_scores[i][1]).toFixed(2)}</span>
              </div>
            ))
          }
        </div>
      )}
      {panelFormState === panelState.info && (
        <div>
          <h4 style={{ marginBottom: "1px", marginTop: "2px" }}>Predict:</h4>
          <p style={{ marginBottom: "1px", marginTop: "2px" }}>Data length determines the number of years to consider when making the prediction.</p>
          <p style={{ marginBottom: "1px", marginTop: "2px" }}>Predicted years defines the amount of years to predict.</p>
          <h4 style={{ marginBottom: "1px", marginTop: "2px" }}>Fit:</h4>
          <p style={{ marginBottom: "1px", marginTop: "2px" }}>Contains the R² scores of the fitted lines on the data.</p>
        </div>
      )}
    </div>
  );
}

export default PanelForm
