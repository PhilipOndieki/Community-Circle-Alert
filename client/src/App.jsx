// File: client/src/App.jsx
// Purpose: Main App component with routing
// Dependencies: React, React Router, Context Providers

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { AlertProvider } from './contexts/AlertContext';
import { LocationProvider } from './contexts/LocationContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AlertProvider>
          <LocationProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Placeholder for future routes */}
                <Route
                  path="/circles"
                  element={
                    <ProtectedRoute>
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2>Circles Page</h2>
                        <p>Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/checkin"
                  element={
                    <ProtectedRoute>
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2>Check-In Page</h2>
                        <p>Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2>Alerts Page</h2>
                        <p>Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2>Profile Page</h2>
                        <p>Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route
                  path="*"
                  element={
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <h1>404 - Page Not Found</h1>
                      <p>The page you're looking for doesn't exist.</p>
                      <a href="/dashboard">Go to Dashboard</a>
                    </div>
                  }
                />
              </Routes>
            </Router>
          </LocationProvider>
        </AlertProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
