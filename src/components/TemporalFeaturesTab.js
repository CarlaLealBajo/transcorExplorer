// src/components/TemporalFeaturesTab.js
import React, { useEffect, useState, useMemo } from 'react';
import { VegaLite } from 'react-vega';
import Spinner from '../components/Spinner'; // Import the spinner component
import { temporalFeaturesPlot } from '../utils/helperTemporalFeatures';
import { binColorValues } from '../utils/binColorValues';


// Function to chunk an array into smaller arrays of a given size
const chunkArray = (array, chunkSize) => {
  if (!array) return []; // Handle null or undefined array
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

// Function to create a plot specification
const createPlotSpec = async (data, features, selectedOutputVariable, toolTip, legend,nBins,selectedPatient) => {
  if (!data || !features) return null; // Handle null or undefined data and features
  const options = {
    vars: features,
    hueOut: selectedOutputVariable ? `${selectedOutputVariable}Bin${nBins}` : selectedOutputVariable,
    palette: 'deep',
    showTooltips: toolTip,
    legend: legend[selectedOutputVariable] || false,
    selectedPatient: selectedPatient
  };
  return temporalFeaturesPlot(data, options);
};

// TemporalFeaturesTab component to manage temporal feature plots
const TemporalFeaturesTab = ({
  data,
  availableOutputVariables,
  availablePatients,
  selectedOutputVariable,
  setSelectedOutputVariable,
  availableTemporalFeatures,
  plotSpecTemporal,
  setPlotSpecTemporal,
  activePaneNumber,
  setActivePaneNumber,
  toolTip,
  legend,
  selectedPatient,
  setSelectedPatient,
  binningSettings
}) => {
  const [loading, setLoading] = useState(false);

  // Chunk the available temporal features into groups of 3
  const chunkedFeatures = useMemo(() => chunkArray(availableTemporalFeatures, 3), [availableTemporalFeatures]);

  // Update the plot whenever dependencies change
  useEffect(() => {
    const updatePlot = async () => {
      let nBins = 5;
      setLoading(true);
      const features = chunkedFeatures[activePaneNumber];
      if (features && features.length > 0) {
        const filteredData = data.filter(patient => availablePatients.includes(patient.ID));
        const dataframeNew = selectedOutputVariable ? binColorValues(filteredData, selectedOutputVariable, binningSettings) : filteredData;
        const spec = await createPlotSpec(dataframeNew, features, selectedOutputVariable, toolTip, legend,binningSettings.maxbins,selectedPatient);
        setPlotSpecTemporal(spec);
      } else {
        setPlotSpecTemporal(null); // Set plotSpec to null if no features are available
      }
      setLoading(false);
    };
    updatePlot();
  }, [selectedOutputVariable, data, activePaneNumber, chunkedFeatures, availablePatients, toolTip, legend, setPlotSpecTemporal,  selectedPatient,setSelectedPatient,binningSettings]);

  // Handle changing to the next pane
  const handleNext = () => {
    if (activePaneNumber < chunkedFeatures.length - 1) {
      setPlotSpecTemporal(null);
      setActivePaneNumber((prevPane) => prevPane + 1);
    }
  };

  // Handle changing to the previous pane
  const handlePrevious = () => {
    if (activePaneNumber > 0) {
      setActivePaneNumber((prevPane) => prevPane - 1);
    }
  };

  // Handle changing the selected output variable
  const handleColorOutVariableChange = (event) => {
    setSelectedOutputVariable(event.target.value);
  };
  const handlePatientChange = (event) => {
    setSelectedPatient(event.target.value);
  };

  return (
    <div>
      {availableTemporalFeatures.length > 0 ? (
        <div>

          <div className="select-container">
            <div className="select-group">
              <label htmlFor="colorOutput">Group by: </label>
              <select
                id="colorOutput"
                name="colorOutput"
                value={selectedOutputVariable}
                onChange={handleColorOutVariableChange}
              >
                <option value="">--Select--</option>
                {availableOutputVariables.map((variable) => (
                  <option key={variable} value={variable}>
                    {variable}
                  </option>
                ))}
              </select>
            </div>
            <div className="select-group">
              <label htmlFor="selectedPatient">Select a Patient: </label>
              <select
                id="selectedPatient"
                name="selectedPatient"
                value={selectedPatient}
                onChange={handlePatientChange}
              >
                <option value="">--Select--</option>
                {availablePatients.map((variable) => (
                  <option key={variable} value={variable}>
                    {variable}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pane bottom-pane">
            {loading ? <Spinner /> : plotSpecTemporal ? <VegaLite spec={plotSpecTemporal} /> : <div>Loading...</div>}
          </div>

          <div className="button-container">
            <button onClick={handlePrevious} disabled={activePaneNumber === 0}>
              Previous
            </button>
            <button onClick={handleNext} disabled={activePaneNumber === chunkedFeatures.length - 1}>
              Next
            </button>
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


export default TemporalFeaturesTab;
