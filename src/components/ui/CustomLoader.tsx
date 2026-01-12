import React from 'react';
import { cn } from "@/lib/utils";

interface CustomLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    className?: string;
}

const CustomLoader: React.FC<CustomLoaderProps> = ({
    size = 'md',
    fullScreen = false,
    className
}) => {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    const dotSizes = {
        sm: "w-1.5 h-1.5",
        md: "w-3 h-3",
        lg: "w-4 h-4"
    };

    const LoaderContent = (
        <div className={cn("relative animate-orbit", sizeClasses[size], className)} aria-label="Loading">
            {/* Top Left - Pink */}
            <div className={cn("absolute top-0 left-0 rounded-full bg-brand-pink", dotSizes[size])} />

            {/* Top Right - Blue */}
            <div className={cn("absolute top-0 right-0 rounded-full bg-brand-blue", dotSizes[size])} />

            {/* Bottom Right - Pink */}
            <div className={cn("absolute bottom-0 right-0 rounded-full bg-brand-pink", dotSizes[size])} />

            {/* Bottom Left - Black */}
            <div className={cn("absolute bottom-0 left-0 rounded-full bg-brand-black", dotSizes[size])} />
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                {LoaderContent}
            </div>
        );
    }

    return LoaderContent;
};

export default CustomLoader;
