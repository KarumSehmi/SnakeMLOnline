import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimulationMode from './SimulationMode';
import TrainingPanel from './TrainingPanel';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import TrainingVisualization from './TrainingVisualization';   {/* New component */}
import Navbar from './Navbar';  
function App() {
  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: { main: '#6a11cb' },
      background: { default: '#121212', paper: '#1e1e1e' },
      text: { primary: '#ffffff' },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />  {/* New component */}
        <Routes>
          <Route path="/" element={<SimulationMode />} />
          <Route path="/train-model" element={<TrainingPanel />} />
          <Route path="/training-visualization/:jobId" element={<TrainingVisualization />} /> {/* New route */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
