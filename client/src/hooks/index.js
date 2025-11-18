// File: client/src/hooks/index.js
// Purpose: Export all custom hooks
// Dependencies: React, Contexts, Services

import { useContext, useState, useEffect, useCallback } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import { LocationContext } from '../contexts/LocationContext';
import { AlertContext } from '../contexts/AlertContext';
import circleService from '../services/circleService';
import checkInService from '../services/checkInService';

// Socket hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Location hook
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

// Alerts hook
export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

// Circles hook
export const useCircles = () => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCircles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await circleService.getMyCircles();
      setCircles(response.data.circles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCircle = async (circleData) => {
    try {
      setError(null);
      const response = await circleService.createCircle(circleData);
      setCircles((prev) => [response.data.circle, ...prev]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const joinCircle = async (inviteCode) => {
    try {
      setError(null);
      const response = await circleService.joinCircleByCode(inviteCode);
      setCircles((prev) => [response.data.circle, ...prev]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const leaveCircle = async (circleId) => {
    try {
      setError(null);
      await circleService.leaveCircle(circleId);
      setCircles((prev) => prev.filter((c) => c.id !== circleId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const inviteMember = async (circleId, email) => {
    try {
      setError(null);
      return await circleService.inviteToCircle(circleId, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  return {
    circles,
    loading,
    error,
    fetchCircles,
    createCircle,
    joinCircle,
    leaveCircle,
    inviteMember
  };
};

// Check-ins hook
export const useCheckIns = () => {
  const [checkIns, setCheckIns] = useState([]);
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCheckIns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await checkInService.getMyCheckIns();
      setCheckIns(response.data.checkIns || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveCheckIns = useCallback(async () => {
    try {
      const response = await checkInService.getMyActiveCheckIns();
      setActiveCheckIns(response.data.checkIns || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const createCheckIn = async (checkInData) => {
    try {
      setError(null);
      const response = await checkInService.createCheckIn(checkInData);
      setActiveCheckIns((prev) => [response.data.checkIn, ...prev]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const completeCheckIn = async (checkInId, notes) => {
    try {
      setError(null);
      const response = await checkInService.completeCheckIn(checkInId, notes);
      setActiveCheckIns((prev) => prev.filter((c) => c.id !== checkInId));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchActiveCheckIns();
  }, [fetchActiveCheckIns]);

  return {
    checkIns,
    activeCheckIns,
    loading,
    error,
    fetchCheckIns,
    createCheckIn,
    completeCheckIn
  };
};
