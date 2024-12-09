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

const PanelForm = ({ country, setChartData, fetchCountryData, setRedraw }) => {
  const [panelFormState, setPredictFormState] = useState(panelState.normal);
  const [r2_scores, setR2Scores] = useState([]);
  const [predictDataLen, setPredictDataLen] = useState(0);
  const [predictData, setPredictData] = useState({ labels: [], datasets: [] });
  const [predictYears, setPredict] = useState(0);
  const predictRef = useRef(null);
  const predictDataLenRef = useRef(null);


  const fetchPredict = (years = predictYears) => {
    try {
      axios.get(`/api/country/${country.code}/data?` + new URLSearchParams({
        predict: years,
        predict_data_len: predictDataLen,
        compress: "y",
      })).then((response) => {
        const predict = response.data[country.code].predict;
        const indData = response.data[country.code].indicators;

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
      });
    } catch (error) {
      console.error("Error fetching predict data:", error);
    }
  }

  const linearRegFit = () => {
    try {
      axios.get(`/api/country/${country.code}/data?` + new URLSearchParams({
        fit: "y",
      })).then((response) => {
        const fit_data = response.data[country.code].fit
        const indData = response.data[country.code].indicators;


        let r2Scores = [];
        const labels = Object.keys(indData.GDP).map(e => Number(e));
        let datasets = [];
        Object.keys(indData).forEach((key) => {
          datasets.push({
            label: key,
            data: Object.values(indData[key]),
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
            data: fit_data[key].y_hat,
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
      });
    } catch (error) {
      console.error("Error fetching predict data:", error);
    }
  };


  const handlePredictSubmit = async (event) => {
    event.preventDefault();
    fetchPredict();
  };

  useEffect(() => {
    switch (panelFormState) {
      case panelState.normal:
        setRedraw(false);
        fetchCountryData();
        break;
      case panelState.predict:
        setRedraw(true);
        fetchPredict();
        break;
      case panelState.fit:
        setRedraw(true);
        linearRegFit();
        break;
      case panelState.info:
        setRedraw(false);
        break;
    }
  }, [panelFormState]);

  return (
    <div style={styles.predictFormDiv}>
      <form style={styles.radioBlock}>
        <label class="radio-inline">
          <input type="radio" name="predictRadio" onChange={() => {
            setPredictFormState(panelState.normal);
          }}
            checked={panelFormState === panelState.normal} />Normal
        </label>
        <label class="radio-inline">
          <input type="radio" name="predictRadio" onChange={() => {
            setPredictFormState(panelState.predict);
          }}
            checked={panelFormState === panelState.predict} />Predict
        </label>
        <label class="radio-inline">
          <input type="radio" name="predictRadio" onChange={() => {
            setPredictFormState(panelState.fit);
          }} checked={panelFormState === panelState.fit} />Fit
        </label>
        <label class="radio-inline">
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
            <label for="data_len">Prediction data length:</label>
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
            <label for="predict_years">Predicted years:</label>
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
