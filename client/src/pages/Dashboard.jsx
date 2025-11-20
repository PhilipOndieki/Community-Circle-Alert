// File: client/src/pages/Dashboard.jsx
// Purpose: Main dashboard with panic button and quick actions
// Dependencies: React, hooks, components

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useAlerts, useCircles, useCheckIns } from '../hooks';
import { useContext } from 'react';
import { LocationContext } from '../contexts/LocationContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { circles } = useCircles();
  const { activeCheckIns } = useCheckIns();
  const { triggerAlert } = useAlerts();
  const { location, startSharing, isSharing } = useContext(LocationContext);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Request location permission on dashboard load
    if (!isSharing) {
      startSharing();
    }
  }, [isSharing, startSharing]);

  const handlePanicButton = () => {
    setShowPanicConfirm(true);
  };

  const confirmPanic = async (circleId) => {
    if (!location || !circleId) {
      alert('Please select a circle and ensure location is enabled');
      return;
    }

    try {
      setTriggering(true);
      await triggerAlert({
        circle: circleId,
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
      alert('Panic alert sent to your circle members!');
    } catch (error) {
      alert('Failed to send panic alert: ' + error.message);
    } finally {
      setTriggering(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.container}>
          <h1>Community Circle Alert</h1>
          <div className={styles.userInfo}>
            <span>Welcome, {user.name}</span>
            <Button variant="ghost" size="small" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.heroSection}>
            <h2>Your Safety Dashboard</h2>
            <p>Stay connected with your community circles</p>
          </div>

          <div className={styles.quickActions}>
            <Button
              variant="primary"
              size="large"
              onClick={() => navigate('/checkin')}
            >
              Check In
            </Button>
            <Button
              variant="secondary"
              size="large"
              onClick={() => navigate('/circles')}
            >
              View Circles
            </Button>
          </div>

          <div className={styles.grid}>
            <Card>
              <h3>My Circles</h3>
              <p className={styles.stat}>{circles.length}</p>
              <Button
                variant="ghost"
                size="small"
                onClick={() => navigate('/circles')}
              >
                View All
              </Button>
            </Card>

            <Card>
              <h3>Active Check-Ins</h3>
              <p className={styles.stat}>{activeCheckIns.length}</p>
              <Button
                variant="ghost"
                size="small"
                onClick={() => navigate('/checkin')}
              >
                Manage
              </Button>
            </Card>

            <Card>
              <h3>Location Sharing</h3>
              <p className={styles.status}>
                {isSharing ? '✓ Active' : '✗ Inactive'}
              </p>
              <Button
                variant="ghost"
                size="small"
                onClick={isSharing ? null : startSharing}
              >
                {isSharing ? 'Enabled' : 'Enable'}
              </Button>
            </Card>
          </div>
        </div>
      </main>

      {/* Panic Button - Fixed Position */}
      <button
        className={styles.panicButton}
        onClick={handlePanicButton}
        title="Trigger Panic Alert"
      >
        SOS
      </button>

      {/* Panic Confirmation Modal */}
      {showPanicConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Trigger Panic Alert?</h2>
            <p>This will send an immediate alert to all members of your selected circle.</p>

            <div className={styles.circleSelector}>
              <label>Select Circle:</label>
              <select id="circleSelect">
                <option value="">Select a circle...</option>
                {circles.map((circle) => (
                  <option key={circle._id} value={circle._id}>
                    {circle.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="danger"
                onClick={() => {
                  const select = document.getElementById('circleSelect');
                  confirmPanic(select.value);
                }}
                loading={triggering}
              >
                Send Alert
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPanicConfirm(false)}
                disabled={triggering}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
