// File: client/src/index.js
// Purpose: React application entry point
// Dependencies: React, ReactDOM, App

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css'; 
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
