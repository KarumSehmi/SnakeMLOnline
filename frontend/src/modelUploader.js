// ModelUploader.js
import React, { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import * as ort from 'onnxruntime-web';

function ModelUploader({ logToConsole, setCurrentModel }) {
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const model = await ort.InferenceSession.create(arrayBuffer);
        setCurrentModel(model);
        logToConsole(`Model "${file.name}" loaded successfully!`);
      } catch (error) {
        logToConsole(`Error loading model: ${error.message}`);
        console.error(error);
      }
    }
  };

  return (
    <Box sx={{ mb: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Upload ONNX Model
      </Typography>
      <input
        type="file"
        accept=".onnx"
        style={{ display: 'none' }}
        id="model-upload"
        onChange={handleFileChange}
      />
      <label htmlFor="model-upload">
        <Button
          variant="contained"
          component="span"
          color="primary"
          sx={{
            textTransform: 'none',
            margin: '10px',
          }}
        >
          Upload Model
        </Button>
      </label>
      {fileName && (
        <Typography variant="body2" color="textSecondary">
          Selected Model: {fileName}
        </Typography>
      )}
    </Box>
  );
}

export default ModelUploader;
