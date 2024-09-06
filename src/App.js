// src/App.js
import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Tabs from './components/Tabs';
import FileUpload from './components/FileUploadTab';
import './App.css';

function App() {
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [filesRead, setFilesRead] = useState(false);
  const [file, setFile] = useState(null);
  const [db, setDb] = useState(null);

  // function to handle file drop
  const handleDrop = (event) => {
    // Prevent the default behavior for the drop event
    event.preventDefault();
    
    // Retrieve the first file from the list of files being dragged and dropped
    const droppedFile = event.dataTransfer.files[0];
  
    // Check if the file type is JSON
    if (droppedFile.type !== 'application/json') {
      // Display an error message if the file is not a JSON file
      toast.error('Only JSON files are allowed.');
      return;
    }
    
    // Update the state with the dropped file
    setFile(droppedFile);
    // Indicate that files have been uploaded
    setFilesUploaded(true);
  };
  

  // function to handle file selection
  const handleFileChange = (event) => {
    // Retrieve the first file from the file input element
    const selectedFile = event.target.files[0];
  
    // Check if the file type is JSON
    if (selectedFile.type !== 'application/json') {
      // Display an error message if the file is not a JSON file
      toast.error('Only JSON files are allowed.');
      return;
    }
  
    // Update the state with the selected file
    setFile(selectedFile);
    // Indicate that files have been uploaded
    setFilesUploaded(true);
  };
  

  // read .json
  const readJsonPromise = (file) => {
    return new Promise((resolve, reject) => {
      // Create a new FileReader object to read the contents of the file
      const reader = new FileReader();
  
      // Define the onload event handler to process the file once it has been read
      reader.onload = (event) => {
        try {
          // Attempt to parse the file content as JSON
          const data = JSON.parse(event.target.result);
          // If successful, resolve the Promise with the parsed data
          resolve(data);
        } catch (e) {
          // If an error occurs during parsing, reject the Promise with the error
          reject(e);
        }
      };
  
      // Define the onerror event handler to handle any errors that occur during reading
      reader.onerror = reject;
  
      // Initiate reading the file as text
      reader.readAsText(file);
    });
  };
  

  const handleAccept = () => {
    // Check if a file has been selected
    if (file) {
      // Read the JSON file using the readJsonPromise function
      readJsonPromise(file)
        .then((data) => {
          // Define the required keys that should be present in the JSON data
          const requiredKeys = [
            'dataframe',
            'availableDimensions',
            'availableInputClinicalVar',
            'availableOutputClinicalVar',
            'availableGroupByVar',
            'availableTemporalFeatures'
          ];
  
          // Filter out the keys that are missing in the JSON data
          const missingKeys = requiredKeys.filter((key) => !(key in data));
  
          // Check if there are no missing keys
          if (missingKeys.length === 0) {
            // Update the state with the parsed JSON data
            setDb(data);
            // Indicate that the files have been successfully read
            setFilesRead(true);
          } else {
            // Display an error message listing the missing keys
            toast.error(`The JSON file is missing the following keys: ${missingKeys.join(', ')}`);
            // Call handleCancel function to reset or cancel the operation
            handleCancel();
          }
        })
        .catch((e) => {
          // Display an error message if there is an issue reading the JSON file
          toast.error('Error reading the JSON file.');
        });
    } else {
      // Display an error message if no file has been selected
      toast.error('Please select a file.');
    }
  };
  

  const handleCancel = () => {
    // Reset the file state to null, indicating no file is selected
    setFile(null);
    
    // Update the state to indicate that no files have been uploaded
    setFilesUploaded(false);
  };
  

  const handleLogout = () => {
    // Update the state to indicate that no files have been read
    setFilesRead(false)

    // Reset the file state to null, indicating no file is selected
    setFile(null);

    // Update the state to indicate that no files have been uploaded
    setFilesUploaded(false);
  };

  return (
    <div className="App">
      {/* Container for displaying toast notifications */}
      <ToastContainer />
  
      {/* Conditional rendering based on whether files have been read */}
      {filesRead ? (
        // If files have been read, render the Tabs component
        <Tabs 
          db={db} 
          handleLogout={handleLogout}
        />
      ) : (
        // If files have not been read, render the file upload section
        <div>
          {/* Application header */}
          <header className="App-header">
            <h1>MKL Visualization Tool</h1>
          </header>
          
          {/* Container for the dropzone and file upload controls */}
          <div className="dropzone-container">
            {/* FileUpload component handles file interactions */}
            <FileUpload
              file={file}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              handleAccept={handleAccept}
              handleCancel={handleCancel}
              filesUploaded={filesUploaded}
            />
          </div>
        </div>
      )}
    </div>
  );
  
}

export default App;
