// File: client/src/pages/Dashboard.jsx
// Purpose: Redesigned dashboard as safety command center
// Design: Warm, empowering interface with clear visual hierarchy
// Dependencies: React, React Router, hooks, components, Framer Motion

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import { useAlerts, useCircles, useCheckIns } from '../hooks';
import { useContext } from 'react';
import { LocationContext } from '../contexts/LocationContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { circles } = useCircles();
  const { activeCheckIns } = useCheckIns();
  const { triggerAlert } = useAlerts();
  const { location, startSharing, isSharing } = useContext(LocationContext);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState('');
  const [triggering, setTriggering] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSharing) startSharing();
  }, [isSharing, startSharing]);

  const handlePanicButton = () => setShowPanicConfirm(true);

  const confirmPanic = async () => {
    if (!location || !selectedCircle) {
      alert('Please select a circle and ensure location is enabled');
      return;
    }

    try {
      setTriggering(true);
      await triggerAlert({
        circle: selectedCircle,
        type: 'panic',
        severity: 'critical',
        title: 'PANIC ALERT!',
        message: `${user.name} has triggered a panic alert and needs immediate assistance!`,
        location: {
          coordinates: [location.longitude, location.latitude],
          address: ''
        }
      });
      setShowPanicConfirm(false);
    } catch (error) {
      alert('Failed to send panic alert: ' + error.message);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-safe">
      {/* Header */}
      <header className="bg-white shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-primary-700">Community Circle Alert</h1>
              <p className="text-sm text-neutral-600 mt-1">Welcome back, {user?.name} 👋</p>
            </div>
            <Button variant="ghost" size="small" onClick={async () => { await logout(); navigate('/login'); }}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Safety Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-8 bg-gradient-to-r from-success-400 to-success-500 rounded-3xl text-white shadow-medium"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">You're Safe ✓</h2>
              <p className="text-success-50 text-lg">Connected to {circles.length} safety circles</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate('/checkin')}>
                Check In
              </Button>
              <Button variant="ghost" className="!border-white !text-white hover:!bg-white hover:!text-success-600" onClick={() => navigate('/circles')}>
                View Circles
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { title: 'My Circles', value: circles.length, icon: '👥', color: 'primary', action: () => navigate('/circles') },
            { title: 'Active Check-Ins', value: activeCheckIns.length, icon: '📍', color: 'accent', action: () => navigate('/checkin') },
            { title: 'Location Sharing', value: isSharing ? 'Active' : 'Inactive', icon: isSharing ? '✓' : '✗', color: isSharing ? 'success' : 'warning', action: isSharing ? null : startSharing }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover padding="spacious" onClick={stat.action} className="group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-5xl p-4 bg-${stat.color}-100 rounded-2xl group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                </div>
                <h3 className="text-neutral-600 font-semibold mb-2">{stat.title}</h3>
                <p className={`text-4xl font-black text-${stat.color}-600`}>{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <Card padding="spacious">
          <h3 className="text-2xl font-bold text-primary-700 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {activeCheckIns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-lg mb-4">No active check-ins</p>
                <Button onClick={() => navigate('/checkin')}>Create Check-In</Button>
              </div>
            ) : (
              activeCheckIns.map((checkIn, index) => (
                <div key={index} className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                  <p className="font-semibold text-primary-700">{checkIn.locationName}</p>
                  <p className="text-sm text-neutral-600 mt-1">Expected return: {new Date(checkIn.expectedReturnTime).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>

      {/* Floating Panic Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePanicButton}
        className="fixed bottom-8 right-8 w-20 h-20 bg-danger-500 text-white rounded-full shadow-strong hover:shadow-glow-accent flex items-center justify-center text-2xl font-black z-50 animate-pulse-slow"
        title="Trigger Panic Alert"
      >
        SOS
      </motion.button>

      {/* Panic Confirmation Modal */}
      <AnimatePresence>
        {showPanicConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => !triggering && setShowPanicConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-strong"
            >
              <h2 className="text-3xl font-black text-danger-600 mb-4">Trigger Panic Alert?</h2>
              <p className="text-neutral-700 mb-6 text-lg">This will send an immediate alert to all members of your selected circle.</p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Select Circle *</label>
                <select
                  value={selectedCircle}
                  onChange={(e) => setSelectedCircle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-danger-400 focus:ring-4 focus:ring-danger-100 transition-all"
                >
                  <option value="">Select a circle...</option>
                  {circles.map((circle) => (
                    <option key={circle._id} value={circle._id}>{circle.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button variant="danger" onClick={confirmPanic} loading={triggering} fullWidth>
                  Send Alert
                </Button>
                <Button variant="ghost" onClick={() => setShowPanicConfirm(false)} disabled={triggering} fullWidth>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
