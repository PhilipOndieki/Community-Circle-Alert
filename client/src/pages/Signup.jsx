// File: client/src/pages/Signup.jsx
// Purpose: Redesigned signup page with warm, welcoming design
// Design: Safety-first onboarding experience with password strength indicator
// Dependencies: React, React Router, useAuth, Input, Button, Card, Framer Motion

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black text-white mb-3"
          >
            Join Community Circle
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/90 text-lg"
          >
            Create your account to stay safe with your community
          </motion.p>
        </div>

        {/* Signup Card */}
        <Card padding="spacious" shadow="strong">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter your full name"
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="your.email@example.com"
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              label="Phone (Optional)"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Create a strong password"
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {/* Password Requirements Checklist */}
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="font-semibold text-neutral-700 mb-3 text-sm">
                Password must contain:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { check: passwordChecks.minLength, label: 'At least 8 characters' },
                  { check: passwordChecks.hasUppercase, label: 'One uppercase (A-Z)' },
                  { check: passwordChecks.hasLowercase, label: 'One lowercase (a-z)' },
                  { check: passwordChecks.hasNumber, label: 'One number (0-9)' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${item.check ? 'text-success-500' : 'text-neutral-300'}`}>
                      {item.check ? '✓' : '○'}
                    </span>
                    <span className={`text-sm ${item.check ? 'text-success-600' : 'text-neutral-500'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Re-enter your password"
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            {errors.general && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-danger-50 border-2 border-danger-200 rounded-xl text-danger-700 text-sm font-medium"
              >
                {errors.general}
              </motion.div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              size="large"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-neutral-100 text-center">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>

        {/* Trust Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-white/80 text-sm"
        >
          <p>🔒 Your data is encrypted and secure</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;
