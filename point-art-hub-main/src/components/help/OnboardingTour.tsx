import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'none';
  actionText?: string;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  tourType: 'first-time' | 'new-feature' | 'custom';
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onComplete,
  tourType
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Define tour steps based on tour type
  const getTourSteps = (): TourStep[] => {
    switch (tourType) {
      case 'first-time':
        return [
          {
            id: 'welcome',
            title: 'Welcome to Point Art Hub! 🎉',
            content: 'Let\'s take a quick tour to get you familiar with the key features. This will only take 2 minutes.',
            target: 'body',
            placement: 'bottom'
          },
          {
            id: 'dashboard',
            title: 'Your Dashboard',
            content: 'This is your command center. Here you can see inventory overview, recent sales, and quick stats at a glance.',
            target: '.dashboard-overview',
            placement: 'bottom'
          },
          {
            id: 'navigation',
            title: 'Navigation Menu',
            content: 'Use these buttons to navigate between different sections: Customers, Reports, Analytics, Invoices, and Settings.',
            target: 'header',
            placement: 'bottom'
          },
          {
            id: 'modules',
            title: 'Inventory Modules',
            content: 'Each tab represents a different type of inventory. Click on them to manage stationery, gifts, embroidery, machines, and art services.',
            target: '.modules-tabs',
            placement: 'top'
          },
          {
            id: 'add-item',
            title: 'Adding Items',
            content: 'Use the "Add New Item" button to add products to your inventory. All fields marked with * are required.',
            target: '.add-item-button',
            placement: 'left',
            action: 'click',
            actionText: 'Try clicking it!'
          },
          {
            id: 'record-sale',
            title: 'Recording Sales',
            content: 'Click "Record Sale" next to any item to process a sale. Stock levels are automatically updated.',
            target: '.record-sale-button',
            placement: 'left',
            action: 'click',
            actionText: 'Give it a try!'
          },
          {
            id: 'help',
            title: 'Getting Help',
            content: 'Look for the ? icons throughout the app for contextual help, or visit the Help Center for detailed guides.',
            target: '.help-icon',
            placement: 'bottom'
          },
          {
            id: 'complete',
            title: 'You\'re All Set! ✨',
            content: 'You now know the basics of Point Art Hub. Explore the features and don\'t hesitate to check the Help Center if you need guidance.',
            target: 'body',
            placement: 'bottom'
          }
        ];
      
      case 'new-feature':
        return [
          {
            id: 'notifications',
            title: 'New: Notification System 🔔',
            content: 'Stay informed with real-time notifications for low stock, sales milestones, and system events.',
            target: '.notification-bell',
            placement: 'bottom'
          },
          {
            id: 'backup',
            title: 'New: Backup & Restore 🗄️',
            content: 'Protect your data with automated backups and easy restore functionality in Settings > Advanced.',
            target: '.settings-button',
            placement: 'bottom'
          },
          {
            id: 'analytics',
            title: 'Enhanced: Analytics Dashboard 📊',
            content: 'Discover powerful new insights with interactive charts and performance metrics.',
            target: '.analytics-button',
            placement: 'bottom'
          }
        ];
      
      default:
        return [];
    }
  };

  const tourSteps = getTourSteps();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
    // Mark tour as completed in localStorage
    localStorage.setItem(`tour_${tourType}_completed`, 'true');
  };

  const handleSkip = () => {
    setIsVisible(false);
    onClose();
  };

  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (!isVisible || !currentTourStep) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
      
      {/* Tour Card */}
      <div className="fixed z-50 max-w-sm mx-4">
        <Card className="border-0 shadow-2xl bg-white">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  <span className="font-semibold">Tour Guide</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Step {currentStep + 1} of {tourSteps.length}</span>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  {Math.round(progress)}%
                </Badge>
              </div>
              
              <Progress value={progress} className="mt-2 h-2 bg-white/20" />
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                {currentTourStep.title}
              </h3>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                {currentTourStep.content}
              </p>

              {currentTourStep.action && currentTourStep.actionText && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <Lightbulb className="h-4 w-4" />
                    <span className="font-medium">{currentTourStep.actionText}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="text-gray-600"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="text-gray-600"
                  >
                    Skip Tour
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {currentStep === tourSteps.length - 1 ? 'Complete' : 'Next'}
                    {currentStep < tourSteps.length - 1 && (
                      <ChevronRight className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Hook to manage tour state
export const useOnboardingTour = () => {
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showNewFeatureTour, setShowNewFeatureTour] = useState(false);

  useEffect(() => {
    // Check if user has completed first-time tour
    const hasCompletedFirstTime = localStorage.getItem('tour_first-time_completed');
    if (!hasCompletedFirstTime) {
      setIsFirstTimeUser(true);
    }

    // Check if user has seen new features
    const hasSeenNewFeatures = localStorage.getItem('tour_new-feature_completed');
    const appVersion = '1.3.0'; // Current app version
    const lastSeenVersion = localStorage.getItem('last_seen_version');
    
    if (hasCompletedFirstTime && (!hasSeenNewFeatures || lastSeenVersion !== appVersion)) {
      setShowNewFeatureTour(true);
    }
  }, []);

  const markVersionSeen = () => {
    localStorage.setItem('last_seen_version', '1.3.0');
  };

  return {
    isFirstTimeUser,
    showNewFeatureTour,
    setIsFirstTimeUser,
    setShowNewFeatureTour,
    markVersionSeen
  };
};

export default OnboardingTour;