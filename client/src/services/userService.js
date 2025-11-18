// File: client/src/services/userService.js
// Purpose: User profile API service
// Dependencies: api

import api from './api';

const userService = {
  // Get user profile
  getProfile: () => api.get('/users/profile'),

  // Update user profile
  updateProfile: (profileData) => api.put('/users/profile', profileData),

  // Update privacy settings
  updatePrivacySettings: (settings) => api.put('/users/privacy', settings),

  // Update user location
  updateLocation: (locationData) => api.put('/users/location', locationData),

  // Toggle location sharing
  toggleLocationSharing: (isSharing) =>
    api.put('/users/location/sharing', { isSharing }),

  // Add emergency contact
  addEmergencyContact: (contactData) =>
    api.post('/users/emergency-contacts', contactData),

  // Update emergency contact
  updateEmergencyContact: (contactId, contactData) =>
    api.put(`/users/emergency-contacts/${contactId}`, contactData),

  // Delete emergency contact
  deleteEmergencyContact: (contactId) =>
    api.delete(`/users/emergency-contacts/${contactId}`),

  // Get user by ID
  getUserById: (userId) => api.get(`/users/${userId}`)
};

export default userService;
