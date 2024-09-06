// BinningSettings.js
import React, { useState } from 'react';
import "./BinningSettings.css";

const BinningSettings = ({ isVisible, onClose, onSave,binningSettings }) => {

  const { maxbinsSettings= 5,
          stepSettings= null, 
          niceSettings= true } = binningSettings

  const [useMaxbins, setUseMaxbins] = useState(stepSettings?false:true);
  const [maxbins, setMaxbins] = useState(maxbinsSettings);
  const [useStep, setUseStep] = useState(stepSettings? true:false);
  const [step, setStep] = useState(stepSettings);
  const [nice, setNice] = useState(niceSettings);

  const handleSave = () => {
    onSave({ useMaxbins, maxbins, useStep, step, nice });
    onClose();
  };

  const handleMaxbinsChange = (checked) => {
    setUseMaxbins(checked);
    if (checked) {
      setUseStep(false);
      setStep(null);
    }
  };

  const handleStepChange = (checked) => {
    setUseStep(checked);
    if (checked) {
      setUseMaxbins(false);
    }
  };

  return (
    isVisible && (
      <div className="binning-settings-overlay">
        <div className="binning-settings-modal">
          <h2>Binning Settings</h2>
          <label>
            <input
              type="checkbox"
              checked={useMaxbins}
              onChange={(e) => handleMaxbinsChange(e.target.checked)}
            />
            Use Max Bins
          </label>
          {useMaxbins && (
            <input
              type="number"
              value={maxbins}
              min={2}
              onChange={(e) => setMaxbins(parseInt(e.target.value, 10))}
            />
          )}
          <label>
            <input
              type="checkbox"
              checked={useStep}
              onChange={(e) => handleStepChange(e.target.checked)}
            />
            Use Step
          </label>
          {useStep && (
            <input
              type="number"
              value={step}
              step="0.1"
              onChange={(e) => setStep(parseFloat(e.target.value))}
            />
          )}
          <label>
            Nice:
            <input
              type="checkbox"
              checked={nice}
              onChange={(e) => setNice(e.target.checked)}
            />
          </label>
          <div className="button-group">
            <button onClick={handleSave}>Save</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    )
  );
};

export default BinningSettings;
