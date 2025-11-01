import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Clock Status Context
 * Provides real-time clock status updates across the application
 * without polling - updates happen immediately when actions occur
 */

const ClockStatusContext = createContext();

export const useClockStatus = () => {
  const context = useContext(ClockStatusContext);
  if (!context) {
    throw new Error('useClockStatus must be used within ClockStatusProvider');
  }
  return context;
};

export const ClockStatusProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Trigger a refresh across all components listening to clock status
  const triggerClockRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const value = {
    refreshTrigger,
    triggerClockRefresh
  };

  return (
    <ClockStatusContext.Provider value={value}>
      {children}
    </ClockStatusContext.Provider>
  );
};
