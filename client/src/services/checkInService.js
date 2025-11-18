// File: client/src/services/checkInService.js
// Purpose: Check-in API service
// Dependencies: api

import api from './api';

const checkInService = {
  // Get all user's check-ins
  getMyCheckIns: (status) => {
    const params = status ? { status } : {};
    return api.get('/checkins', { params });
  },

  // Get active check-ins for user
  getMyActiveCheckIns: () => api.get('/checkins/active'),

  // Get check-ins for a circle
  getCircleCheckIns: (circleId, status) => {
    const params = status ? { status } : {};
    return api.get(`/checkins/circle/${circleId}`, { params });
  },

  // Get active check-ins for a circle
  getCircleActiveCheckIns: (circleId) =>
    api.get(`/checkins/circle/${circleId}/active`),

  // Get check-in by ID
  getCheckInById: (checkInId) => api.get(`/checkins/${checkInId}`),

  // Create new check-in
  createCheckIn: (checkInData) => api.post('/checkins', checkInData),

  // Complete check-in
  completeCheckIn: (checkInId, notes) =>
    api.put(`/checkins/${checkInId}/complete`, { notes }),

  // Cancel check-in
  cancelCheckIn: (checkInId) => api.put(`/checkins/${checkInId}/cancel`),

  // Update check-in location
  updateCheckInLocation: (checkInId, longitude, latitude) =>
    api.put(`/checkins/${checkInId}/location`, { longitude, latitude }),

  // Acknowledge check-in
  acknowledgeCheckIn: (checkInId, message) =>
    api.post(`/checkins/${checkInId}/acknowledge`, { message }),

  // Delete check-in
  deleteCheckIn: (checkInId) => api.delete(`/checkins/${checkInId}`),

  // Get overdue check-ins
  getOverdueCheckIns: () => api.get('/checkins/overdue')
};

export default checkInService;
