import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'full' | 'icon' | 'text';
}

const Logo = ({ className = '', size = 'md', showText = true, variant = 'full' }: LogoProps) => {
  const [customLogo, setCustomLogo] = useState<string | null>(null);

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

  // If we have a custom logo and it's not icon-only variant, show custom logo
  if (customLogo && variant !== 'icon') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
          <img
            src={customLogo}
            alt="Point Art Solutions Logo"
            className="w-full h-full object-contain"
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
          <circle cx="60" cy="60" r="50" fill="#2c3e50" stroke="#34495e" strokeWidth="2"/>
          <circle cx="60" cy="60" r="38" fill="#e74c3c"/>
          <circle cx="60" cy="60" r="25" fill="#ffffff" opacity="0.9"/>
          <path d="M 35 45 Q 30 40 30 50 Q 30 65 35 70 Q 40 75 45 70 L 50 75 L 45 80 L 35 75 Q 25 70 25 55 Q 25 40 35 45 Z" fill="#2c3e50"/>
          <path d="M 75 40 Q 85 35 85 45 Q 85 55 75 65 L 75 75 L 70 65 Q 65 55 65 45 Q 65 35 75 40 Z" fill="#e74c3c"/>
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
            <circle cx="60" cy="60" r="50" fill="#2c3e50" stroke="#34495e" strokeWidth="2"/>
            {/* Inner circle */}
            <circle cx="60" cy="60" r="38" fill="#e74c3c"/>
            {/* Central white circle */}
            <circle cx="60" cy="60" r="25" fill="#ffffff" opacity="0.9"/>
            
            {/* Profile silhouette */}
            <path d="M 35 45 Q 30 40 30 50 Q 30 65 35 70 Q 40 75 45 70 L 50 75 L 45 80 L 35 75 Q 25 70 25 55 Q 25 40 35 45 Z" fill="#2c3e50"/>
            
            {/* Location pin element */}
            <path d="M 75 40 Q 85 35 85 45 Q 85 55 75 65 L 75 75 L 70 65 Q 65 55 65 45 Q 65 35 75 40 Z" fill="#e74c3c"/>
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