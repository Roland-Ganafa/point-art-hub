import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'full' | 'icon' | 'text';
}

const Logo = ({ className = '', size = 'md', showText = true, variant = 'full' }: LogoProps) => {
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Check for custom logo in localStorage
    const savedLogo = localStorage.getItem('customLogo');
    if (savedLogo && savedLogo !== 'default') {
      setCustomLogo(savedLogo);
    }
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg', 
    lg: 'text-xl'
  };

  // Handle image loading
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // If we have a custom logo and it's not icon-only variant, show custom logo
  if (customLogo && variant !== 'icon' && !imageError) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
          {!imageLoaded && (
            <div className="w-full h-full bg-gray-200 animate-pulse rounded" />
          )}
          <img
            src={customLogo}
            alt="Point Art Solutions Logo"
            className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        </div>
        {showText && variant === 'full' && (
          <div className="flex flex-col leading-tight">
            <div className={`font-bold ${textSizeClasses[size]} leading-none`}>
              <span className="text-foreground">Point</span>
              <span className="text-pink-600 ml-1">Art</span>
            </div>
            <span className="text-xs text-muted-foreground leading-none mt-0.5 font-semibold tracking-wider uppercase">Solutions</span>
          </div>
        )}
      </div>
    );
  }

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <circle cx="60" cy="60" r="50" fill="#2c3e50"/>
          <circle cx="60" cy="60" r="38" fill="#e74c3c"/>
          <circle cx="60" cy="60" r="25" fill="#ffffff"/>
          <path d="M35 45q-5-5-5 5 0 15 5 20 5 5 10 0l5 5-5 5-10-5q-10-5-10-20 0-15 10-10z" fill="#2c3e50"/>
          <path d="M75 40q10-5 10 5 0 10-10 20v10l-5-10q-5-10-5-20 0-10 10-5z" fill="#e74c3c"/>
        </svg>
      </div>
    );
  }

  // Text-only variant
  if (variant === 'text') {
    return (
      <div className={`flex flex-col leading-tight ${className}`}>
        <div className={`font-bold ${textSizeClasses[size]} leading-none`}>
          <span className="text-foreground">Point</span>
          <span className="text-pink-600 ml-1">Art</span>
        </div>
        {showText && (
          <span className="text-xs text-muted-foreground leading-none mt-0.5 font-semibold tracking-wider uppercase">Solutions</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Professional logo icon */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Professional circular design */}
          <g>
            {/* Outer ring */}
            <circle cx="60" cy="60" r="50" fill="#2c3e50"/>
            {/* Inner circle */}
            <circle cx="60" cy="60" r="38" fill="#e74c3c"/>
            {/* Central white circle */}
            <circle cx="60" cy="60" r="25" fill="#ffffff"/>
            
            {/* Profile silhouette */}
            <path d="M35 45q-5-5-5 5 0 15 5 20 5 5 10 0l5 5-5 5-10-5q-10-5-10-20 0-15 10-10z" fill="#2c3e50"/>
            
            {/* Location pin element */}
            <path d="M75 40q10-5 10 5 0 10-10 20v10l-5-10q-5-10-5-20 0-10 10-5z" fill="#e74c3c"/>
          </g>
        </svg>
      </div>
      
      {/* Logo text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`font-bold ${textSizeClasses[size]} leading-none`}>
            <span className="text-foreground">Point</span>
            <span className="text-pink-600 ml-1">Art</span>
          </div>
          <span className="text-xs text-muted-foreground leading-none mt-0.5 font-semibold tracking-wider uppercase">Solutions</span>
        </div>
      )}
    </div>
  );
};

export default Logo;