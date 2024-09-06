import React, { useState, useEffect } from 'react';
import { VegaLite } from 'react-vega';
import { pairplot } from '../utils/helperPairPlot';
import { binColorValues } from '../utils/binColorValues';
import Spinner from '../components/Spinner';
import './OutputSpaceTab.css';

const OutputSpaceTab = ({
  data,
  availableDimensions,
  availableOutputVariables,
  availableInputVariables,
  availablePatients,
  plotSpec,
  setPlotSpec,
  selectedDimensions,
  setSelectedDimensions,
  selectedDimensionIndex,
  setSelectedDimensionIndex,
  selectedInputVariable,
  setSelectedInputVariable,
  selectedOutputVariable,
  setSelectedOutputVariable,
  toolTip,
  legend,
  binningSettings,
  selectedPatient,
}) => {
  const [fudgeFactor, setFudgeFactor] = useState(5);
  const [tempFudgeFactor, setTempFudgeFactor] = useState(5);
  const [uniqueValues, setUniqueValues] = useState([]);
  const [trueValue, setTrueValue] = useState(null);
  const [tempThreshold, setTempThreshold] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isParametersVisible, setIsParametersVisible] = useState(false);
  const [isDensityOutActive, setIsDensityOutActive] = useState(false);


  useEffect(() => {
    if (selectedOutputVariable) {
      const unique = Array.from(new Set(data.map(item => item[selectedOutputVariable]).filter(value => value !== null)));
      setUniqueValues(unique);
      setTrueValue(unique.length < 10 ? unique[0] : Math.min(...unique));
      setTempThreshold(unique.length < 10 ? unique[0] : Math.min(...unique))
    }
  }, [selectedOutputVariable, data]);

  useEffect(() => {
    const createPlot = () => {
      setLoading(true);
      let nBins = 10;
      const filteredData = data.filter(patient => availablePatients.includes(patient.ID));
      const dataframeNew = selectedInputVariable?binColorValues(filteredData, selectedInputVariable, binningSettings):filteredData;
      const dataframeNewNew = selectedOutputVariable?binColorValues(dataframeNew, selectedOutputVariable, binningSettings):dataframeNew;
      const options = {
        vars: selectedDimensions,
        hueIn: `${selectedInputVariable}Bin${binningSettings.maxbins}`,
        hueOut: isDensityOutActive ? selectedOutputVariable : `${selectedOutputVariable}Bin${binningSettings.maxbins}`,
        palette: 'deep',
        showTooltips: toolTip,
        densityBandwith: fudgeFactor,
        trueValue: trueValue,
        legendIn: legend[selectedInputVariable] || false,
        legendOut: legend[selectedOutputVariable] || false,
        densityOut: isDensityOutActive,
        selectedPatient: selectedPatient
      };
      const spec = pairplot(dataframeNewNew, options);
      setPlotSpec(spec);
      setLoading(false);
    };
    createPlot();
  }, [selectedDimensions, selectedInputVariable, selectedOutputVariable, data, setPlotSpec, fudgeFactor, trueValue, availablePatients, toolTip, legend, isDensityOutActive, setIsDensityOutActive,binningSettings]);

  const handleDimensionChange = (event) => {
    const value = parseInt(event.target.value);
    setSelectedDimensionIndex(value);
    setSelectedDimensions(availableDimensions.slice(0, value));
  };

  const handleVariableChange = (setter) => (event) => setter(event.target.value);

  const handleSliderChange = (setter) => (event) => setter(parseFloat(event.target.value));

  const handleMouseUp = (setter, value) => setter(value);

  const handleCheckboxChange = (event) => setTrueValue(event.target.value);

  const toggleParametersVisibility = () => setIsParametersVisible(!isParametersVisible);

  const toggleDensityPlot = () => { setIsDensityOutActive(!isDensityOutActive); setIsParametersVisible(false) };

  return (
    <div>
      {availableDimensions.length > 0 ? (
        <div className="output-space-tab">
          <div className="select-container">
            <div className="select-group">
              <label htmlFor="colorDimension">Select Number of Dimensions: </label>
              <input
                type="number"
                id="colorDimension"
                min="1"
                max={availableDimensions.length}
                value={selectedDimensionIndex}
                onChange={handleDimensionChange}
              />
            </div>
            <div className="output-group">
              <div className="select-group">
                <label htmlFor="colorOutput">Select Output Clinical Variable: </label>
                <select
                  id="colorOutput"
                  name="colorOutput"
                  value={selectedOutputVariable}
                  onChange={handleVariableChange(setSelectedOutputVariable)}
                >
                  <option value="">--Select--</option>
                  {availableOutputVariables.map((variable) => (
                    <option key={variable} value={variable}>
                      {variable}
                    </option>
                  ))}
                </select>
              </div>
              <button className="toggle-button" onClick={toggleDensityPlot}>
                {isDensityOutActive ? "Scatter Plot" : "Density Plot"}
              </button>
            </div>
            <div className="select-group">
              <label htmlFor="colorInput">Select Input Clinical Variable: </label>
              <select
                id="colorInput"
                name="colorInput"
                value={selectedInputVariable}
                onChange={handleVariableChange(setSelectedInputVariable)}
              >
                <option value="">--Select--</option>
                {availableInputVariables.map((variable) => (
                  <option key={variable} value={variable}>
                    {variable}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="content-container">
            <button className="toggle-button" onClick={toggleParametersVisibility} disabled={isDensityOutActive === false || !selectedOutputVariable}>
              {isParametersVisible ? "Hide Parameters" : "Show Parameters"}
            </button>
            {isParametersVisible && selectedOutputVariable && (
              <div className="parameters-section">
                <div className="slider-group">
                  <label htmlFor="fudgeFactor"> Fudge Factor</label>
                  <input
                    type="range"
                    id="fudgeFactor"
                    name="fudgeFactor"
                    min="0"
                    max="20"
                    step="1"
                    value={tempFudgeFactor}
                    onChange={handleSliderChange(setTempFudgeFactor)}
                    onMouseUp={() => handleMouseUp(setFudgeFactor, tempFudgeFactor)}
                  />
                  <span>{tempFudgeFactor}</span>
                </div>

                {uniqueValues.length > 0 && (
                  <div className="true-value-selection">
                    {uniqueValues.length < 5 ? (
                      <div className="checkbox-group">
                        <label>Positive Value:</label>
                        {uniqueValues.map((value) => (
                          <div key={value} className="checkbox-container">
                            <input
                              type="checkbox"
                              id={`trueValue-${value}`}
                              name="trueValue"
                              value={value}
                              checked={trueValue == value}
                              onChange={handleCheckboxChange}
                            />
                            <label htmlFor={`trueValue-${value}`}>{value}</label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="slider-group">
                        <label htmlFor="trueValueThreshold">Select Threshold</label>
                        <input
                          type="range"
                          id="trueValueThreshold"
                          name="trueValueThreshold"
                          min={Math.min(...uniqueValues)}
                          max={Math.max(...uniqueValues)}
                          step="0.1"
                          value={tempThreshold}
                          onChange={handleSliderChange(setTempThreshold)}
                          onMouseUp={() => handleMouseUp(setTrueValue, tempThreshold)}
                        />
                        {<span>{tempThreshold.toFixed(2)}</span> }
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="plot-section">
              {loading ? (
                <Spinner />
              ) : plotSpec ? (
                <VegaLite spec={plotSpec} />
              ) : (
                <div>Loading...</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className='data-no-information'>
          <div className='no-information-box'>No information available</div>
        </div>
      )}
    </div>
  );
};

export default OutputSpaceTab;
