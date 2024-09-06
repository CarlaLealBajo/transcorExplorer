// src/components/Tabs.js
import React, { useState } from 'react';
import GeneralOverviewTab from './GeneralOverviewTab';
import OutputSpaceTab from './OutputSpaceTab';
import TemporalFeaturesTab from './TemporalFeaturesTab';
import ClinicalVariablesTab from './ClinicalVariablesTab';
import BinningSettings from "./BinningSettings"; // Import the new component

import './Tabs.css';
import folder from '../icons/folder.png';
import Spinner from '../components/Spinner'; // Import the spinner component

const Tabs = ({ db, handleLogout }) => {
  // Destructure the db object to extract required properties
  const {
    dataframe,
    availableDimensions,
    availableInputClinicalVar,
    availableOutputClinicalVar,
    availableGroupByVar,
    availableTemporalFeatures,
    availablePatients,
    toolTip = false,
    datasetDescription = false,
    legend = {}
  } = db;

  // State hooks for managing active tab, selected dimensions, variables, and plot specifications
  const [activeTab, setActiveTab] = useState('Tab1');
  const [activePaneNumber, setActivePaneNumber] = useState(0);
  const [loading, setLoading] = useState(false); // Add loading state

  // Overview
  const [checkPatients, setCheckPatients] = useState(availablePatients);
  const [checkDimensions, setCheckDimensions] = useState(availableDimensions);
  const [checkInputVariables, setCheckInputVariables] = useState(availableInputClinicalVar);
  const [checkOutputVariables, setCheckOutputVariables] = useState(availableOutputClinicalVar);
  const [checkTemporalFeatures, setCheckTemporalFeatures] = useState(availableTemporalFeatures);

  // Clinical Input
  const [selectedHistVariableInput, setSelectedHistVariableInput] = useState(checkInputVariables[0]);
  const [selectedGroupByVariableInput, setSelectedGroupByVariableInput] = useState('');
  const [plotSpecClinicalInput, setPlotSpecClinicalInput] = useState(null);
  const [plotSpecClinicalMatrixInput, setPlotSpecClinicalMatrixInput] = useState(null);

  // Clinical Output
  const [selectedHistVariableOutput, setSelectedHistVariableOutput] = useState(checkOutputVariables[0]);
  const [selectedGroupByVariableOutput, setSelectedGroupByVariableOutput] = useState('');
  const [plotSpecClinicalOutput, setPlotSpecClinicalOutput] = useState(null);
  const [plotSpecClinicalMatrixOutput, setPlotSpecClinicalMatrixOutput] = useState(null);


  // Temporal
  const [plotSpecTemporal, setPlotSpecTemporal] = useState(null);
  const [selectedGroupByVarTemporal, setSelectedGroupByVarTemporal] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');

  // Output Space
  const [selectedDimensions, setSelectedDimensions] = useState(["Dim 1", "Dim 2", "Dim 3", "Dim 4"]);
  const [selectedDimensionIndex, setSelectedDimensionIndex] = useState(4);
  const [selectedInputVariable, setSelectedInputVariable] = useState('');
  const [selectedOutputVariable, setSelectedOutputVariable] = useState('');
  const [plotSpec, setPlotSpec] = useState(null);

  // Binning Settings
  const [isBinningSettingsVisible, setIsBinningSettingsVisible] = useState(false);
  const [binningSettings, setBinningSettings] = useState({ maxbins: 5,step:null,  nice: true });

  // Function to handle tab clicks and simulate loading time
  const handleTabClick = (tab) => {
    setLoading(true); // Set loading to true when a tab is clicked
    setActiveTab(tab);
    setTimeout(() => setLoading(false), 500); // Simulate loading time
  };

  // Map each tab to its respective component
  const tabComponents = {
    Tab1: (
      <GeneralOverviewTab
        datasetDescription={datasetDescription}
        availableDimensions={availableDimensions}
        availableOutputVariables={availableOutputClinicalVar}
        availableInputVariables={availableInputClinicalVar}
        availablePatients={availablePatients}
        availableTemporalFeatures={availableTemporalFeatures}
        setSelectedDimensions={setCheckDimensions}
        selectedDimensions={checkDimensions}
        setSelectedInputVariables={setCheckInputVariables}
        selectedInputVariables={checkInputVariables}
        setSelectedOutputVariables={setCheckOutputVariables}
        selectedOutputVariables={checkOutputVariables}
        setSelectedPatients={setCheckPatients}
        selectedPatients={checkPatients}
        setSelectedTemporalFeatures={setCheckTemporalFeatures}
        selectedTemporalFeatures={checkTemporalFeatures}
      />
    ),
    Tab2: (
      <ClinicalVariablesTab 
        data={dataframe}
        availableDimensions={checkDimensions}
        availableOutputVariables={availableGroupByVar}
        availableInputVariables={checkInputVariables}
        availablePatients={checkPatients}
        plotSpecClinical={plotSpecClinicalInput}
        setPlotSpecClinical={setPlotSpecClinicalInput}
        plotSpecClinicalMatrix={plotSpecClinicalMatrixInput}
        setPlotSpecClinicalMatrix={setPlotSpecClinicalMatrixInput}
        selectedDimensions={selectedDimensions}
        setSelectedDimensions={setSelectedDimensions}
        selectedDimensionIndex={selectedDimensionIndex}
        setSelectedDimensionIndex={setSelectedDimensionIndex}
        selectedInputVariable={selectedHistVariableInput}
        setSelectedInputVariable={setSelectedHistVariableInput}
        selectedOutputVariable={selectedGroupByVariableInput}
        setSelectedOutputVariable={setSelectedGroupByVariableInput}
        legend={legend}
        binningSettings={binningSettings}
      />
    ),
    Tab3: (
      <ClinicalVariablesTab 
        data={dataframe}
        availableDimensions={checkDimensions}
        availableOutputVariables={availableGroupByVar}
        availableInputVariables={checkOutputVariables}
        availablePatients={checkPatients}
        plotSpecClinical={plotSpecClinicalOutput}
        setPlotSpecClinical={setPlotSpecClinicalOutput}
        plotSpecClinicalMatrix={plotSpecClinicalMatrixOutput}
        setPlotSpecClinicalMatrix={setPlotSpecClinicalMatrixOutput}
        selectedDimensions={selectedDimensions}
        setSelectedDimensions={setSelectedDimensions}
        selectedDimensionIndex={selectedDimensionIndex}
        setSelectedDimensionIndex={setSelectedDimensionIndex}
        selectedInputVariable={selectedHistVariableOutput}
        setSelectedInputVariable={setSelectedHistVariableOutput}
        selectedOutputVariable={selectedGroupByVariableOutput}
        setSelectedOutputVariable={setSelectedGroupByVariableOutput}
        legend={legend}
        binningSettings={binningSettings}
      />
    ),
    Tab4: (
      <TemporalFeaturesTab 
        data={dataframe} 
        availableOutputVariables={availableGroupByVar}
        availablePatients={checkPatients}
        plotSpecTemporal={plotSpecTemporal}
        setPlotSpecTemporal={setPlotSpecTemporal}
        selectedOutputVariable={selectedGroupByVarTemporal}
        setSelectedOutputVariable={setSelectedGroupByVarTemporal}
        availableTemporalFeatures={checkTemporalFeatures} 
        activePaneNumber={activePaneNumber}
        setActivePaneNumber={setActivePaneNumber}
        toolTip={toolTip}
        legend={legend}
        selectedPatient={selectedPatient}
        setSelectedPatient={setSelectedPatient}
        binningSettings={binningSettings}
      />
    ),
    Tab5: (
      <OutputSpaceTab
        data={dataframe}
        availableDimensions={checkDimensions}
        availableOutputVariables={checkOutputVariables}
        availableInputVariables={checkInputVariables}
        availablePatients={checkPatients}
        plotSpec={plotSpec}
        setPlotSpec={setPlotSpec}
        selectedDimensions={selectedDimensions}
        setSelectedDimensions={setSelectedDimensions}
        selectedDimensionIndex={selectedDimensionIndex}
        setSelectedDimensionIndex={setSelectedDimensionIndex}
        selectedInputVariable={selectedInputVariable}
        setSelectedInputVariable={setSelectedInputVariable}
        selectedOutputVariable={selectedOutputVariable}
        setSelectedOutputVariable={setSelectedOutputVariable}
        toolTip={toolTip}
        legend={legend}
        binningSettings={binningSettings}
        selectedPatient={selectedPatient}
      />
    ),
  };

  return (
    <div>
      <div className="tabs-header">
        <ul className="tab-list">
          {/* Render tab list items */}
          {['Tab1', 'Tab2', 'Tab3', 'Tab4','Tab5'].map((tab, index) => (
            <li
              key={index}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => handleTabClick(tab)}
            >
              {tab === 'Tab1' && 'General Overview'}
              {tab === 'Tab2' && 'Clinical Variables Input'}
              {tab === 'Tab3' && 'Clinical Variables Output'}
              {tab === 'Tab4' && 'Temporal Features'}
              {tab === 'Tab5' && 'Output Space'}
            </li>
          ))}
        </ul>
        <div className='btn-container'>


          <button className="btn-binning-settings" onClick={() => setIsBinningSettingsVisible(true)}>Binning Settings</button>
          <BinningSettings
            isVisible={isBinningSettingsVisible}
            onClose={() => setIsBinningSettingsVisible(false)}
            onSave={setBinningSettings}
            binningSettings={binningSettings}
          />
            <button className="logout-button" onClick={handleLogout}>
            <img src={folder} alt="Logout" />
          </button>
        </div>
      </div>
      {/* Display loading spinner */}
      {loading ? (
        <div className="spinner-container">
          <Spinner />
        </div>
      ) : (
        <div>{tabComponents[activeTab]}</div>
      )}
    </div>
  );
};

export default Tabs;
