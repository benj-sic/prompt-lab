import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PageLoader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-weave-light-background dark:bg-weave-dark-background z-50 flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex flex-col items-center space-y-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <svg width="64" height="64" viewBox="0 0 64 64" className="logo-svg">
                <rect width="64" height="64" fill="var(--weave-background)" rx="4" ry="4"/>
                <rect x="4" y="4" width="56" height="56" fill="none" stroke="var(--weave-accent)" stroke-width="3" rx="2" ry="2"/>
                <text x="32" y="32" font-family="Inter, Arial, sans-serif" font-size="24" fill="var(--weave-accent)" font-weight="bold" text-anchor="middle" dominant-baseline="middle">PL</text>
              </svg>
            </motion.div>
            <motion.h2
              className="text-2xl font-bold text-weave-light-primary dark:text-weave-dark-primary"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Prompt Lab
            </motion.h2>
            <motion.p
              className="text-weave-light-secondary dark:text-weave-dark-secondary"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Loading your prompt engineering workspace...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 