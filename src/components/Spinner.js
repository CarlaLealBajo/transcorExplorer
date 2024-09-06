// src/components/Spinner.js
import React from 'react';
import './Spinner.css'; // Import the CSS file for spinner styles

const Spinner = () => {
  return (
    <div className="spinner">
      <div className="double-bounce1"></div>
      <div className="double-bounce2"></div>
    </div>
  );
};

export default Spinner;
