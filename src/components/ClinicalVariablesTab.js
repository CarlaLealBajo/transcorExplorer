import React, { useEffect, useState } from "react";
import { VegaLite } from "react-vega";
import { histplot } from "../utils/helperHistogram";
import { binColorValues } from "../utils/binColorValues";
import { computeStats } from "../utils/helperStatistics copy";
// import BinningSettings from "./BinningSettings"; // Import the new component
import "./ClinicalVariablesTab.css";

const ClinicalVariablesTab = ({
  data,
  availableInputVariables,
  availableOutputVariables,
  availablePatients,
  plotSpecClinical,
  setPlotSpecClinical,
  plotSpecClinicalMatrix,
  setPlotSpecClinicalMatrix,
  selectedInputVariable,
  setSelectedInputVariable,
  selectedOutputVariable,
  setSelectedOutputVariable,
  importantVariables,
  legend,
  binningSettings
}) => {
  const [statsResults, setStatsResults] = useState([]);
  const [activePane, setActivePane] = useState(false);
  // const [isBinningSettingsVisible, setIsBinningSettingsVisible] = useState(false);
  // const [binningSettings, setBinningSettings] = useState({ maxbins: 5,  nice: true });

  useEffect(() => {
    const createPlot = async () => {
      const filteredData = data.filter((patient) =>
        availablePatients.includes(patient.ID)
      );
      const dataframeNew = selectedOutputVariable
        ? binColorValues(filteredData, selectedOutputVariable, binningSettings)
        : filteredData;
      const options = {
        hueIn: selectedInputVariable,
        hueOut: selectedOutputVariable
          ? `${selectedOutputVariable}Bin${binningSettings.maxbins}`
          : selectedOutputVariable,
        palette: "deep",
        showTooltips: true,
        legend: legend[selectedOutputVariable] || false,
        width: 1400,
        height: 800,
      };

      let stats = {};
      for (const v of availableInputVariables) {
        stats[v] = computeStats(
          dataframeNew,
          v,
          selectedOutputVariable
            ? `${selectedOutputVariable}Bin${binningSettings.maxbins}`
            : selectedOutputVariable
        );
      }

      setPlotSpecClinical(histplot(dataframeNew, options));

      setStatsResults(
        formatStats(
          computeStats(
            dataframeNew,
            selectedInputVariable,
            selectedOutputVariable
              ? `${selectedOutputVariable}Bin${binningSettings.maxbins}`
              : selectedOutputVariable
          )
        )
      );

      const optionsMatrix = {
        vars: availableInputVariables,
        hueIn: selectedInputVariable,
        hueOut: selectedOutputVariable
          ? `${selectedOutputVariable}Bin${binningSettings.maxbins}`
          : selectedOutputVariable,
        palette: "deep",
        showTooltips: true,
        legend: legend[selectedOutputVariable] || false,
        plotWidth: 400,
        plotHeight: 170,
        stats: stats,
      };
      setPlotSpecClinicalMatrix(histplot(dataframeNew, optionsMatrix));
    };
    createPlot();
  }, [
    selectedInputVariable,
    selectedOutputVariable,
    data,
    setPlotSpecClinical,
    setPlotSpecClinicalMatrix,
    availablePatients,
    legend,
    importantVariables,
    binningSettings,
  ]);

  const formatStats = (stats) => {
    if (selectedOutputVariable) {
      return [
        <div
          key="overall"
          className="stats-box"
          style={{ backgroundColor: "#8C8C8C" }}
        >
          <h3>Overall Statistics</h3>
          <p>N = {stats.All.N.toFixed(0)}</p>
          <p>{stats.All.pValueDisplay}</p>
        </div>,
        ...Object.keys(stats)
          .filter((group) => group !== "null" && group !== "All")
          .sort()
          .map((group, index) => (
            <div
              key={group}
              className="stats-box"
              style={{ backgroundColor: generateColor(index) }}
            >
              <h3>Group {legend[selectedOutputVariable]?.[group] || group}</h3>
              <p>N = {stats[group].N.toFixed(0)}</p>
              <p>{stats[group].statistics}</p>
            </div>
          )),
      ];
    } else {
      return (
        <div className="stats-box" style={{ backgroundColor: "#8C8C8C" }}>
          <h3>Overall Statistics</h3>
          <p>N = {stats.All.N.toFixed(0)}</p>
        </div>
      );
    }
  };

  const generateColor = (index) => {
    const colors = [
      "#55A868",
      "#DD8452",
      "#C44E52",
      "#4C72B0",
      "#8172B3",
      "#937860",
      "#DA8BC3",
      "#8C8C8C",
      "#CCB974",
      "#64B5CD",
    ];
    return colors[index % colors.length];
  };

  const handleInputChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const togglePane = () => {
    setActivePane(!activePane);
  };

  return (
    <div>
      {/* <div className="header">
        <button className="btn-binning-settings" onClick={() => setIsBinningSettingsVisible(true)}>Binning Settings</button>
      </div>
      <BinningSettings
        isVisible={isBinningSettingsVisible}
        onClose={() => setIsBinningSettingsVisible(false)}
        onSave={setBinningSettings}
      /> */}
      {availableInputVariables.length > 0 ? (
        <div>
          {activePane === false ? (
            <div className="pane top-pane">
              <div className="select-container">
                <div className="select-group">
                  <label htmlFor="colorOutput">Group by: </label>
                  <select
                    id="colorOutput"
                    name="colorOutput"
                    value={selectedOutputVariable}
                    onChange={handleInputChange(setSelectedOutputVariable)}
                  >
                    <option value="">--Select--</option>
                    {availableOutputVariables.map((variable) => (
                      <option key={variable} value={variable}>
                        {variable}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="switch-container">
                  <span>All</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={activePane}
                      onChange={togglePane}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span>Single</span>
                </div>
              </div>
              <div className="matrix-plot">
                {plotSpecClinicalMatrix && (
                  <VegaLite spec={plotSpecClinicalMatrix} />
                )}
              </div>
            </div>
          ) : (
            <div className="pane bottom-pane">
              <div className="select-container">
                <div className="select-group">
                  <label htmlFor="colorOutput">Group by: </label>
                  <select
                    id="colorOutput"
                    name="colorOutput"
                    value={selectedOutputVariable}
                    onChange={handleInputChange(setSelectedOutputVariable)}
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
                  <label htmlFor="colorInput">Select Clinical Variable: </label>
                  <select
                    id="colorInput"
                    name="colorInput"
                    value={selectedInputVariable}
                    onChange={handleInputChange(setSelectedInputVariable)}
                  >
                    <option value="">--Select--</option>
                    {availableInputVariables.map((variable) => (
                      <option key={variable} value={variable}>
                        {variable}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="switch-container">
                  <span>All</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={activePane}
                      onChange={togglePane}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span>Single</span>
                </div>
              </div>
              <div className="split-pane">
                <div className="left-pane">
                  <div className="statistics">
                    <div className="stats-container">{statsResults}</div>
                  </div>
                </div>
                <div className="right-pane">
                  {plotSpecClinical && <VegaLite spec={plotSpecClinical} />}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='data-no-information'>
          <div className='no-information-box'>No information available</div>
        </div>
      )}
    </div>
  );
  
};

export default ClinicalVariablesTab;
