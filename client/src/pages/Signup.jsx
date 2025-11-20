// File: client/src/pages/Signup.jsx
// Purpose: Signup page component
// Dependencies: React, useAuth, Input, Button, Card

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import styles from './Login.module.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Check password requirements in real-time
    if (name === 'password') {
      setPasswordChecks({
        minLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value)
      });
    }
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordChecks.minLength || !passwordChecks.hasUppercase || 
               !passwordChecks.hasLowercase || !passwordChecks.hasNumber) {
      newErrors.password = 'Password does not meet all requirements';
    }
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const { confirmPassword, ...signupData } = formData;
      await signup(signupData);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ general: error.message || 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.header}>
          <h1>Join Community Circle</h1>
          <p>Create your account to get started</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Phone (Optional)"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Create a password"
              required
            />

            {/* Password Requirements Checklist */}
            <div style={{ 
              marginTop: '-0.5rem', 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#F9FAFB', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Password must contain:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    color: passwordChecks.minLength ? '#10B981' : '#9CA3AF',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    {passwordChecks.minLength ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordChecks.minLength ? '#10B981' : '#6B7280' }}>
                    At least 8 characters
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    color: passwordChecks.hasUppercase ? '#10B981' : '#9CA3AF',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    {passwordChecks.hasUppercase ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordChecks.hasUppercase ? '#10B981' : '#6B7280' }}>
                    One uppercase letter (A-Z)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    color: passwordChecks.hasLowercase ? '#10B981' : '#9CA3AF',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    {passwordChecks.hasLowercase ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordChecks.hasLowercase ? '#10B981' : '#6B7280' }}>
                    One lowercase letter (a-z)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    color: passwordChecks.hasNumber ? '#10B981' : '#9CA3AF',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    {passwordChecks.hasNumber ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordChecks.hasNumber ? '#10B981' : '#6B7280' }}>
                    One number (0-9)
                  </span>
                </div>
              </div>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              required
            />

            {errors.general && (
              <div className={styles.errorBox}>{errors.general}</div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className={styles.submitButton}
            >
              Create Account
            </Button>
          </form>

          <div className={styles.footer}>
            <p>
              Already have an account?{' '}
              <Link to="/login" className={styles.link}>
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Signup;