// File: client/src/hooks/useAuth.js
// Purpose: Custom hook for authentication operations
// Dependencies: React, AuthContext

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;
