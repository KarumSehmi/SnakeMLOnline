// TrainingVisualization.js
import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './GameCanvas';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api/';

const TrainingVisualization = () => {
  const { jobId } = useParams();
  const [gameState, setGameState] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchGameState();
    }, 5); // Fetch every 500ms

    return () => clearInterval(intervalId);
  }, []);

  const fetchGameState = async () => {
    try {
      const response = await axios.get(`${API_URL}training-jobs/${jobId}/game_state/`);
      setGameState(response.data);
    } catch (error) {
      console.error('Failed to fetch game state:', error);
    }
  };

  useEffect(() => {
    if (gameState && canvasRef.current) {
      canvasRef.current.updateGameState(gameState);
    }
  }, [gameState]);

  const logToConsole = (message) => {
    console.log(message);
  };

  return (
    <div>
      <h2>Training Visualization</h2>
      <GameCanvas ref={canvasRef} logToConsole={logToConsole} />
    </div>
  );
};

export default TrainingVisualization;
