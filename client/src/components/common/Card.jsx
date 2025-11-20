// File: client/src/components/common/Card.jsx
// Purpose: Redesigned Card component with Framer Motion animations
// Design: Soft, inviting containers with rounded corners and gentle shadows
// Dependencies: React, Framer Motion

import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  onClick,
  hover = false,
  padding = 'normal',
  shadow = 'soft'
}) => {
  // Padding variants: Generous spacing for breathing room
  const paddingStyles = {
    none: '',
    compact: 'p-4',
    normal: 'p-6',
    spacious: 'p-8',
  };

  // Shadow variants: Soft elevation creates safe feel
  const shadowStyles = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16)' } : {}}
      onClick={onClick}
      className={`
        bg-white rounded-2xl transition-all duration-300
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${onClick ? 'cursor-pointer' : ''}
        ${hover ? 'hover:shadow-strong' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default Card;
