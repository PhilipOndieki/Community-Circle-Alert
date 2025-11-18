// File: client/src/services/alertService.js
// Purpose: Alert API service
// Dependencies: api

import api from './api';

const alertService = {
  // Get all user's alerts
  getMyAlerts: (status) => {
    const params = status ? { status } : {};
    return api.get('/alerts', { params });
  },

  // Get alerts for a circle
  getCircleAlerts: (circleId, status) => {
    const params = status ? { status } : {};
    return api.get(`/alerts/circle/${circleId}`, { params });
  },

  // Get active alerts for a circle
  getCircleActiveAlerts: (circleId) =>
    api.get(`/alerts/circle/${circleId}/active`),

  // Get alert by ID
  getAlertById: (alertId) => api.get(`/alerts/${alertId}`),

  // Create panic alert
  createAlert: (alertData) => api.post('/alerts', alertData),

  // Acknowledge alert
  acknowledgeAlert: (alertId, response, notes) =>
    api.post(`/alerts/${alertId}/acknowledge`, { response, notes }),

  // Resolve alert
  resolveAlert: (alertId, resolutionStatus, notes) =>
    api.put(`/alerts/${alertId}/resolve`, { resolutionStatus, notes }),

  // Cancel alert
  cancelAlert: (alertId, reason) =>
    api.put(`/alerts/${alertId}/cancel`, { reason }),

  // Mark as false alarm
  markFalseAlarm: (alertId, reason) =>
    api.put(`/alerts/${alertId}/false-alarm`, { reason }),

  // Delete alert
  deleteAlert: (alertId) => api.delete(`/alerts/${alertId}`),

  // Get alert statistics for circle
  getCircleAlertStats: (circleId) =>
    api.get(`/alerts/circle/${circleId}/stats`)
};

export default alertService;
