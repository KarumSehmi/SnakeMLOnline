import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/models/';

const Leaderboard = ({ onSelectModel }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [modelFile, setModelFile] = useState(null);
  const [modelName, setModelName] = useState('');
  const [username, setUsername] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch leaderboard from backend
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(API_URL);
        const sortedLeaderboard = response.data.sort((a, b) => b.score - a.score); // Sort by score descending
        setLeaderboard(sortedLeaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        showSnackbar('Failed to fetch leaderboard.', 'error');
      }
    };

    fetchLeaderboard();
  }, []);

  // Show Snackbar for feedback
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  // Handle model file upload
  const handleModelUpload = async () => {
    if (!username || !modelName || !modelFile) {
      showSnackbar('Please fill in all fields and upload a model file.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('model_name', modelName);
    formData.append('model_file', modelFile);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch updated leaderboard
      const updatedLeaderboard = [...leaderboard, response.data].sort((a, b) => b.score - a.score);
      setLeaderboard(updatedLeaderboard);

      // Reset inputs
      setModelName('');
      setUsername('');
      setModelFile(null);

      showSnackbar('Model uploaded and added to leaderboard!', 'success');
    } catch (error) {
      console.error('Error uploading model:', error);
      if (error.response && error.response.data) {
        const errorMessages = Object.values(error.response.data).flat().join(' ');
        showSnackbar(`Error uploading model: ${errorMessages}`, 'error');
      } else {
        showSnackbar('Failed to upload model. Please try again.', 'error');
      }
    }
  };

  // Handle clicking on a leaderboard entry
  const handleSelectModel = (entry) => {
    onSelectModel(entry); // Pass the selected model to the parent component
  };

  return (
    <Paper
      elevation={6}
      sx={{
        padding: 3,
        borderRadius: 4,
        background: 'linear-gradient(135deg, #ff6e7f, #bfe9ff)',
        color: '#000',
      }}
    >
      <Typography variant="h5" gutterBottom>
        Leaderboard
      </Typography>
      <List>
        {leaderboard.map((entry) => (
          <ListItem key={entry.id} divider button onClick={() => handleSelectModel(entry)}>
            <ListItemText
              primary={`${entry.username} (${entry.model_name})`}
              secondary={`Score: ${entry.score}`}
            />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ marginY: 2 }} />
      <Box sx={{ marginTop: 2 }}>
        <Typography variant="subtitle1">Upload Your Model</Typography>
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          sx={{ marginBottom: 2 }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Model Name"
          variant="outlined"
          fullWidth
          sx={{ marginBottom: 2 }}
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        />
        <input
          type="file"
          accept=".onnx"
          onChange={(e) => setModelFile(e.target.files[0])}
          style={{ marginBottom: 16 }}
        />
        <Button variant="contained" color="primary" fullWidth onClick={handleModelUpload}>
          Upload Model
        </Button>
      </Box>
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

export default Leaderboard;
