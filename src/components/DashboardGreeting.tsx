import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";

const DashboardGreeting = () => {
    const { profile, user } = useUser();
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) setGreeting("Good Morning");
            else if (hour < 18) setGreeting("Good Afternoon");
            else setGreeting("Good Evening");
        };

        updateGreeting();
        // Update every minute to ensure correctness around hour boundaries
        const interval = setInterval(updateGreeting, 60000);
        return () => clearInterval(interval);
    }, []);

    // Prefer profile full name, fallback to email name, or generic "User"
    const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

    // Capitalize first letter of display name if it comes from email
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    return (
        <div className="flex flex-col">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight animate-in fade-in slide-in-from-left-4 duration-700">
                {greeting}, {formattedName}!
            </h2>
            <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-left-4 duration-700 delay-150">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                <p className="text-gray-600 text-lg font-medium">Welcome to your dashboard</p>
            </div>
        </div>
    );
};

export default DashboardGreeting;
