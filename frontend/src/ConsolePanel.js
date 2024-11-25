import React, { forwardRef } from 'react';
import { Paper, Typography, Button, Slider, Box, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

const ConsolePanel = forwardRef(({ onStart, onStop, speed, setSpeed }, ref) => {
  const handleSpeedChange = (event, newValue) => {
    setSpeed(newValue);
  };

  return (
    <Paper
      elevation={6}
      sx={{
        padding: 3,
        borderRadius: 4,
        background: '#2c3e50',
        color: 'white',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Typography variant="h5" gutterBottom>
        Simulation Console
      </Typography>
      <Box
        ref={ref}
        sx={{
          height: 200,
          overflowY: 'auto',
          padding: 2,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          fontSize: '0.9rem',
        }}
      >
        <Typography>Logs will appear here...</Typography>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box>
        <Typography variant="subtitle1">Game Speed</Typography>
        <Slider
          value={speed}
          onChange={handleSpeedChange}
          min={1}
          max={30}
          sx={{ color: '#e74c3c' }}
        />
        <Typography>Current Speed: {speed}</Typography>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
        <Button onClick={onStart} variant="contained" color="success" startIcon={<PlayArrowIcon />}>
          Start
        </Button>
        <Button onClick={onStop} variant="contained" color="error" startIcon={<StopIcon />}>
          Stop
        </Button>
      </Box>
    </Paper>
  );
});

export default ConsolePanel;
