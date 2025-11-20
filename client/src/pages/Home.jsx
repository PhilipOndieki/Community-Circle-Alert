// File: client/src/pages/Home.jsx
// Purpose: Landing page with immersive hero section
// Design: Emotionally resonant hero communicating safety and sisterhood
// Dependencies: React, React Router, Framer Motion

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-display font-bold text-primary-700"
            >
              Community Circle Alert
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Link
                to="/login"
                className="text-neutral-700 hover:text-primary-600 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2.5 bg-white border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Sign Up
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with Gradient Overlay (fallback if image doesn't exist) */}
        <div className="absolute inset-0 z-0">
          {/* Try to load the image, fallback to gradient */}
          <img
            src="/Nairobi_Tech_Circle_laptop.png"
            alt="Women in tech community"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'linear-gradient(135deg, #6B46C1 0%, #9F7AEA 50%, #FF6B9D 100%)';
            }}
          />
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight text-safe-shadow"
          >
            SAFER TOGETHER
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-3xl md:text-4xl lg:text-5xl font-light text-white/95 mb-6 max-w-4xl mx-auto leading-tight text-safe-shadow"
          >
            Building the digital safety net
            <br />
            African women in tech deserve
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center justify-center gap-3 text-xl md:text-2xl text-white/85 mb-12"
          >
            <span>Real-time support</span>
            <span className="text-accent-400">•</span>
            <span>Trusted circles</span>
            <span className="text-accent-400">•</span>
            <span>Peace of mind</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <Link
              to="/signup"
              className="inline-block px-12 py-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-lg font-bold rounded-2xl shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-300 mb-6"
            >
              Start Building Your Circle
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-white/70 text-lg"
          >
            Already have an account?{' '}
            <Link to="/login" className="text-white underline hover:text-accent-300 transition-colors">
              Sign in here
            </Link>
          </motion.p>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex flex-col items-center gap-2 text-white/60">
            <span className="text-sm font-medium">Scroll to explore</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-safe">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Three simple steps to stay connected and protected with your tech community
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '👥',
                title: 'Create Your Circle',
                description: 'Build trusted groups with women in your tech community'
              },
              {
                icon: '📍',
                title: 'Share & Check-In',
                description: "Let your circle know when you're safe during events"
              },
              {
                icon: '🚨',
                title: 'Instant Alerts',
                description: 'One tap sends immediate help requests to your circle'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-soft hover:shadow-medium transition-shadow duration-300"
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-primary-700 mb-3">{feature.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-neutral-600">
            &copy; {new Date().getFullYear()} Community Circle Alert. Building safer tech communities across Africa.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
