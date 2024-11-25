import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button } from '@mui/material';

const Navbar = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, padding: 2 }}>
      <Button variant="contained" component={Link} to="/">
        Simulation
      </Button>
      <Button variant="contained" component={Link} to="/train-model">
        Train Model
      </Button>
    </Box>
  );
};

export default Navbar;
