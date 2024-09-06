// src/components/GeneralOverviewTab.js
import React, { useState } from 'react';
import './GeneralOverviewTab.css';
import arrowUp from '../icons/up.png';
import arrowDown from '../icons/down.png';

// GeneralOverviewTab component to manage the general overview UI
const GeneralOverviewTab = ({
  datasetDescription,
  availableDimensions,
  availableOutputVariables,
  availableInputVariables,
  availablePatients,
  availableTemporalFeatures,
  setSelectedDimensions,
  selectedDimensions,
  setSelectedPatients,
  selectedPatients,
  setSelectedInputVariables,
  selectedInputVariables,
  setSelectedOutputVariables,
  selectedOutputVariables,
  setSelectedTemporalFeatures,
  selectedTemporalFeatures
}) => {
  // State to manage the collapse state of each summary item
  const [collapsedStates, setCollapsedStates] = useState({
    Patients: true,
    Dimensions: true,
    InputClinicalVariables: true,
    OutputClinicalVariables: true,
    TemporalFeatures: true
  });

  // Function to toggle the collapse state of a specific summary item
  const toggleCollapse = (key) => {
    setCollapsedStates((prevState) => ({
      ...prevState,
      [key]: !prevState[key]
    }));
  };

  // Function to select or deselect all items
  const toggleSelectAll = (availableItems, selectedItems, setSelectedItems) => {
    setSelectedItems(selectedItems.length === availableItems.length ? [] : availableItems);
  };

  // Function to handle individual item selection
  const handleItemClick = (item, selectedItems, setSelectedItems) => {
    setSelectedItems(
      selectedItems.includes(item)
        ? selectedItems.filter((selected) => selected !== item)
        : [...selectedItems, item]
    );
  };

  return (
    <div className="general-overview-tab">
      <div className="data-description">
        <h3>Dataset Description</h3>
        <div className="description-box">
          <p>{datasetDescription || "No description available."}</p>
        </div>
      </div>
      <div className="summary">
        {[
          { title: 'Patients', items: availablePatients, selected: selectedPatients, setSelected: setSelectedPatients },
          { title: 'Dimensions', items: availableDimensions, selected: selectedDimensions, setSelected: setSelectedDimensions },
          { title: 'Input Clinical Variables', items: availableInputVariables, selected: selectedInputVariables, setSelected: setSelectedInputVariables },
          { title: 'Output Clinical Variables', items: availableOutputVariables, selected: selectedOutputVariables, setSelected: setSelectedOutputVariables },
          { title: 'Temporal Features', items: availableTemporalFeatures, selected: selectedTemporalFeatures, setSelected: setSelectedTemporalFeatures }
        ].map(({ title, items, selected, setSelected }) => (
          <SummaryItem
            key={title}
            title={title}
            availableItems={items}
            selectedItems={selected}
            isCollapsed={collapsedStates[title.replace(/\s+/g, '')]}
            toggleCollapse={() => toggleCollapse(title.replace(/\s+/g, ''))}
            toggleSelectAll={() => toggleSelectAll(items, selected, setSelected)}
            handleItemClick={(item) => handleItemClick(item, selected, setSelected)}
          />
        ))}
      </div>
    </div>
  );
};

// SummaryItem component to manage individual summary sections
const SummaryItem = ({ title, availableItems, selectedItems, isCollapsed, toggleCollapse, toggleSelectAll, handleItemClick }) => (
  <div className="summary-item">
    <h3>{title}</h3>
    <p>
      {availableItems.length} available
      <button onClick={toggleCollapse}>
        <img src={isCollapsed ? arrowDown : arrowUp} alt="Toggle Arrow" className="toggle-arrow" />
      </button>
    </p>
    {!isCollapsed && (
      <div>
        <ul>
          <li
            onClick={toggleSelectAll}
            className={`toggle-button ${selectedItems.length === availableItems.length ? 'selected' : ''}`}
          >
            Select All
          </li>
          {availableItems.map((item, index) => (
            <li
              key={index}
              onClick={() => handleItemClick(item)}
              className={`output-variable ${selectedItems.includes(item) ? 'selected' : ''}`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default GeneralOverviewTab;
