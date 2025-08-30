import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Component to display a warning banner when the application
 * is running in development mode
 */
const DevelopmentModeBanner = () => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Check if development mode is active
    const isDevelopmentMode = localStorage.getItem('mock_auth_active') === 'true';
    setVisible(isDevelopmentMode);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-purple-600 text-white p-2 text-center text-sm z-50 shadow-lg flex items-center justify-center">
      <div className="flex-1">
        <strong>Development Mode Active</strong>
        <span className="hidden sm:inline"> - Using mock data and authentication</span>
      </div>
      <button 
        onClick={() => setVisible(false)}
        className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default DevelopmentModeBanner;