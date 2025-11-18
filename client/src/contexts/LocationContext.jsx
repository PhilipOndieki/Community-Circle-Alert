// File: client/src/contexts/LocationContext.jsx
// Purpose: Location context for managing geolocation and location sharing
// Dependencies: React, userService

import React, { createContext, useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startSharing = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    try {
      // Request permission and get initial position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy: acc } = position.coords;
      setLocation({ latitude, longitude });
      setAccuracy(acc);
      setError(null);

      // Update server
      await userService.updateLocation({ longitude, latitude });
      await userService.toggleLocationSharing(true);
      setIsSharing(true);

      // Watch position for updates
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon, accuracy: a } = pos.coords;
          setLocation({ latitude: lat, longitude: lon });
          setAccuracy(a);

          // Update server periodically (debounced in production)
          await userService.updateLocation({ longitude: lon, latitude: lat });
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 10000
        }
      );

      setWatchId(id);
    } catch (err) {
      if (err.code === 1) {
        setError('Location permission denied. Please enable location access.');
      } else if (err.code === 2) {
        setError('Location unavailable. Please check your device settings.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError(err.message || 'Failed to get location');
      }
    }
  }, []);

  const stopSharing = useCallback(async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    try {
      await userService.toggleLocationSharing(false);
      setIsSharing(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [watchId]);

  const updateLocation = useCallback(async () => {
    if (!location) return;

    try {
      await userService.updateLocation({
        longitude: location.longitude,
        latitude: location.latitude
      });
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  }, [location]);

  const value = {
    location,
    accuracy,
    isSharing,
    error,
    startSharing,
    stopSharing,
    updateLocation
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
