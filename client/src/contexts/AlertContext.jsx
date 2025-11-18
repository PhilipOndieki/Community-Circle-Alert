// File: client/src/contexts/AlertContext.jsx
// Purpose: Alert context for managing alerts and notifications
// Dependencies: React, alertService, SocketContext

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import alertService from '../services/alertService';
import { SocketContext } from './SocketContext';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { on, off } = useContext(SocketContext);

  // Listen for real-time alert events
  useEffect(() => {
    const handleNewAlert = (data) => {
      setActiveAlerts((prev) => [data.alert, ...prev]);
      // Show browser notification if permitted
      showNotification('New Alert!', data.alert.title);
    };

    const handleAlertAcknowledged = (data) => {
      setActiveAlerts((prev) =>
        prev.map((alert) =>
          alert.id === data.alertId
            ? { ...alert, acknowledgments: [...(alert.acknowledgments || []), data.acknowledgment] }
            : alert
        )
      );
    };

    const handleAlertResolved = (data) => {
      setActiveAlerts((prev) =>
        prev.filter((alert) => alert.id !== data.alertId)
      );
    };

    on('alert:new', handleNewAlert);
    on('alert:acknowledged', handleAlertAcknowledged);
    on('alert:resolved', handleAlertResolved);

    return () => {
      off('alert:new', handleNewAlert);
      off('alert:acknowledged', handleAlertAcknowledged);
      off('alert:resolved', handleAlertResolved);
    };
  }, [on, off]);

  const fetchMyAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await alertService.getMyAlerts();
      setAlerts(response.data.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerAlert = async (alertData) => {
    try {
      setError(null);
      const response = await alertService.createAlert(alertData);
      setActiveAlerts((prev) => [response.data.alert, ...prev]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const acknowledgeAlert = async (alertId, response, notes) => {
    try {
      setError(null);
      return await alertService.acknowledgeAlert(alertId, response, notes);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resolveAlert = async (alertId, resolutionStatus, notes) => {
    try {
      setError(null);
      const result = await alertService.resolveAlert(alertId, resolutionStatus, notes);
      setActiveAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' });
    }
  };

  const value = {
    alerts,
    activeAlerts,
    isLoading,
    error,
    fetchMyAlerts,
    triggerAlert,
    acknowledgeAlert,
    resolveAlert
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};
