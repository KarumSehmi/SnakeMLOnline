import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Slider,
  Button,
  Box,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API_URL = 'http://127.0.0.1:8000/api/';

const TrainingPanel = () => {
  const [learningRate, setLearningRate] = useState(0.01); // Default learning rate
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [jobId, setJobId] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  const handleLearningRateChange = (event, newValue) => {
    setLearningRate(newValue);
  };

  const handleStartTraining = async () => {
    try {
      const response = await axios.post(`${API_URL}training-jobs/`, {
        username: 'YourUsername', // Replace or get from user input
        learning_rate: learningRate,
      });
      const { job_id } = response.data;
      setJobId(job_id);
      showSnackbar('Training started!', 'success');
      checkTrainingStatus(job_id);
    } catch (error) {
      console.error(error);
      showSnackbar('Failed to start training.', 'error');
    }
  };

  const checkTrainingStatus = (jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}training-jobs/${jobId}/`);
        const status = response.data.status;
        setTrainingStatus(status);
        if (status === 'COMPLETED' || status === 'FAILED') {
          clearInterval(intervalId);
          if (status === 'COMPLETED') {
            showSnackbar('Training completed!', 'success');
          } else {
            showSnackbar('Training failed.', 'error');
          }
        }
      } catch (error) {
        console.error(error);
        clearInterval(intervalId);
      }
    }, 5000); // Check every 5 seconds
  };

  const handleDownloadModel = async () => {
    try {
      const response = await axios.get(`${API_URL}training-jobs/${jobId}/download_model/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'trained_model.onnx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error(error);
      showSnackbar('Failed to download model.', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  return (
    <Paper
      elevation={6}
      sx={{
        padding: 3,
        borderRadius: 4,
        background: '#1e1e1e',
        color: 'white',
        maxWidth: 600,
        margin: 'auto',
        marginTop: 4,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Train Your AI Model
      </Typography>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="subtitle1">Learning Rate</Typography>
        <Slider
          value={learningRate}
          onChange={handleLearningRateChange}
          min={0.0001}
          max={0.1}
          step={0.0001}
          valueLabelDisplay="auto"
          sx={{ color: '#6a11cb' }}
        />
        <Typography>Current Learning Rate: {learningRate.toFixed(4)}</Typography>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleStartTraining}
        disabled={jobId && trainingStatus === 'RUNNING'}
      >
        {trainingStatus === 'RUNNING' ? 'Training in Progress...' : 'Start Training'}
      </Button>
  
      {trainingStatus === 'COMPLETED' && (
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={handleDownloadModel}
          sx={{ marginTop: 2 }}
        >
          Download Trained Model
        </Button>
      )}
  
      {jobId && (
        <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={() => navigate(`/training-visualization/${jobId}`)}
          sx={{ marginTop: 2 }}
        >
          View Training Visualization
        </Button>
      )}
  
      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
  
};

export default TrainingPanel;
