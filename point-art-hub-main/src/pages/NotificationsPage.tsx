import React from 'react';
import NotificationCenter from '@/components/NotificationCenter';

const NotificationsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-2xl flex items-center justify-center">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Notification Center
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Stay informed with real-time alerts, milestones, and system updates
            </p>
          </div>
        </div>

        {/* Notification Center Component */}
        <NotificationCenter />
      </div>
    </div>
  );
};

export default NotificationsPage;