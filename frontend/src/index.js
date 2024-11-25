import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // If you have CSS

// Create the root element
const container = document.getElementById('root');
const root = createRoot(container); // Create a root with React 18 API

// Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
