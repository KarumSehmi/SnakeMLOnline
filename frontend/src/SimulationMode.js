import React, { useState, useRef } from 'react';
import GameCanvas from './GameCanvas';
import ConsolePanel from './ConsolePanel';
import Leaderboard from './Leaderboard';
import ModelUploader from './modelUploader';
import { Container, Grid, Typography } from '@mui/material';
import * as ort from 'onnxruntime-web';
import axios from 'axios';

const SimulationMode = () => {
  const [speed, setSpeed] = useState(10);
  const [currentModel, setCurrentModel] = useState(null);
  const consoleRef = useRef(null);
  const canvasRef = useRef(null);

  const logToConsole = (message) => {
    if (consoleRef.current) {
      const logDiv = document.createElement('p');
      logDiv.textContent = message;
      consoleRef.current.appendChild(logDiv);
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  };

  const handleStart = () => {
    if (!currentModel) {
      logToConsole('Please load a model before starting.');
      return;
    }
    canvasRef.current.startGame();
  };

  const handleStop = () => {
    canvasRef.current.stopGame();
  };

  const handleSelectModel = async (entry) => {
    const modelUrl = entry.model_file; // URL to the model file

    try {
      // Fetch the model file from the server
      const response = await axios.get(modelUrl, { responseType: 'arraybuffer' });
      const arrayBuffer = response.data;
      const model = await ort.InferenceSession.create(arrayBuffer);
      console.log('Model loaded:', model);

      // Log model properties
      console.log('Model inputNames:', model.inputNames);
      console.log('Model outputNames:', model.outputNames);
      console.log('Model inputMetadata:', model.inputMetadata);
      console.log('Model outputMetadata:', model.outputMetadata);

      setCurrentModel(model);
      logToConsole(`Model "${entry.model_name}" by ${entry.username} loaded.`);
    } catch (error) {
      logToConsole(`Error loading model: ${error.message}`);
      console.error('Model loading error:', error);
      alert('Failed to load the selected model. It may be invalid or corrupted.');
    }
  };
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" align="center" gutterBottom>
        AI-Powered Snake Simulation
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <ConsolePanel
            ref={consoleRef}
            onStart={handleStart}
            onStop={handleStop}
            speed={speed}
            setSpeed={setSpeed}
          />
          <ModelUploader logToConsole={logToConsole} setCurrentModel={setCurrentModel} />
        </Grid>
        <Grid item xs={12} md={8}>
          <GameCanvas
            ref={canvasRef}
            speed={speed}
            logToConsole={logToConsole}
            currentModel={currentModel}
          />
        </Grid>
        <Grid item xs={12}>
          <Leaderboard onSelectModel={handleSelectModel} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default SimulationMode;
