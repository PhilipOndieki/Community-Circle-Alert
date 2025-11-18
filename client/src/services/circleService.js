// File: client/src/services/circleService.js
// Purpose: Circle management API service
// Dependencies: api

import api from './api';

const circleService = {
  // Get all user's circles
  getMyCircles: () => api.get('/circles'),

  // Get circle by ID
  getCircleById: (circleId) => api.get(`/circles/${circleId}`),

  // Create new circle
  createCircle: (circleData) => api.post('/circles', circleData),

  // Update circle
  updateCircle: (circleId, circleData) =>
    api.put(`/circles/${circleId}`, circleData),

  // Delete circle
  deleteCircle: (circleId) => api.delete(`/circles/${circleId}`),

  // Get circle members
  getCircleMembers: (circleId) => api.get(`/circles/${circleId}/members`),

  // Invite user to circle
  inviteToCircle: (circleId, email) =>
    api.post(`/circles/${circleId}/invite`, { email }),

  // Join circle by invite code
  joinCircleByCode: (inviteCode) => api.post(`/circles/join/${inviteCode}`),

  // Leave circle
  leaveCircle: (circleId) => api.post(`/circles/${circleId}/leave`),

  // Remove member from circle
  removeMember: (circleId, userId) =>
    api.delete(`/circles/${circleId}/members/${userId}`),

  // Update member role
  updateMemberRole: (circleId, userId, role) =>
    api.put(`/circles/${circleId}/members/${userId}/role`, { role }),

  // Regenerate invite code
  regenerateInviteCode: (circleId) =>
    api.post(`/circles/${circleId}/regenerate-code`)
};

export default circleService;
