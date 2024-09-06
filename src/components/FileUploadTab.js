// src/components/FileUpload.js

import React, { useRef } from 'react';

const FileUpload = ({ file, handleDrop, handleFileChange, handleAccept, handleCancel, filesUploaded }) => {
  // Prevent the default behavior for the drag over event
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Reference to the file input element
  const inputRef = useRef();

  // Conditional rendering based on whether files have been uploaded
  if (filesUploaded) return (
    <div className='dropzone'>
      <h2>Selected File:</h2>
      {/* Display the name of the selected file */}
      <h2><i>{file.name}</i></h2>  
      <div className="button-container">
        {/* Button to accept and upload the file */}
        <button className="button-accept" onClick={handleAccept}>Upload</button>
        {/* Button to cancel the file selection */}
        <button className="button-cancel" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );

  // Render the dropzone and file input elements
  return (
    <div 
      className='dropzone'
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h2>Drag and Drop Files to Upload</h2>
      <h2>Or</h2>
      {/* Hidden file input element */}
      <input             
        type="file"
        onChange={handleFileChange}
        hidden
        accept=".json"
        ref={inputRef}
      />
      {/* Button to trigger the file input click */}
      <button className="button-select" onClick={() => inputRef.current.click()}>Select Files</button>
    </div>
  );
};

export default FileUpload;
