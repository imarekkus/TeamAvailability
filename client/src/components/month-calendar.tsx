import { DateAvailability } from "@shared/schema";
import { Star } from "lucide-react";
import { getDaysInMonth, getFirstDayOfMonth } from "@/lib/calendar-utils";

interface MonthCalendarProps {
  monthName: string;
  dates: {
    start: string;
    end: string;
    year: number;
    month: number;
  };
  availabilityData: DateAvailability[];
  userId: number;
  onToggleAvailability: (date: string) => void;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthCalendar({
  monthName,
  dates,
  availabilityData,
  userId,
  onToggleAvailability,
}: MonthCalendarProps) {
  const daysInMonth = getDaysInMonth(dates.year, dates.month);
  const firstDayOfMonth = getFirstDayOfMonth(dates.year, dates.month);
  
  // Create an array for the days in the month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Create an array for the empty cells before the first day
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  // Create a map of date to availability for quick lookup
  const dateAvailabilityMap = new Map<string, DateAvailability>();
  availabilityData.forEach(avail => {
    dateAvailabilityMap.set(avail.date, avail);
  });
  
  // Check if a user is available on a specific date
  const isUserAvailable = (date: string) => {
    const availability = dateAvailabilityMap.get(date);
    if (!availability) return false;
    return availability.availableUsers.some(user => user.id === userId);
  };
  
  // Check if all users are available on a specific date
  const isAllAvailable = (date: string) => {
    const availability = dateAvailabilityMap.get(date);
    if (!availability) return false;
    return availability.allAvailable;
  };
  
  // Get a count of all unique users from the availability data
  const getUserCount = () => {
    // Create a Set to track unique user IDs
    const uniqueUserIds = new Set<number>();
    
    // Process all the availability data to find all unique users
    availabilityData.forEach(dateData => {
      dateData.availableUsers.forEach(user => {
        uniqueUserIds.add(user.id);
      });
    });
    
    // Return the count of unique users, or at least 1 to avoid division by zero
    return Math.max(uniqueUserIds.size, 1);
  };
  
  // Calculate total number of users in the system
  const totalUsers = getUserCount();
    
  // Determine the appropriate availability class based on percentage of available users
  const getAvailabilityClass = (date: string) => {
    const availability = dateAvailabilityMap.get(date);
    const userAvailable = isUserAvailable(date);
    const allAvailable = isAllAvailable(date);
    
    // If this user is not available, but others are
    if (!userAvailable && availability && availability.availableUsers.length > 0) {
      const availableCount = availability.availableUsers.length;
      const availabilityPercentage = availableCount / totalUsers;
      
      if (availabilityPercentage === 1) return 'availability-full';
      if (availabilityPercentage >= 0.7) return 'availability-high';
      if (availabilityPercentage >= 0.3) return 'availability-medium';
      if (availabilityPercentage > 0) return 'availability-low';
      return 'availability-none';
    }
    
    // Standard coloring for the current user's availability
    if (allAvailable) return 'bg-all-available';
    if (userAvailable) {
      // If the user is available, check if there are others also available
      if (availability && availability.availableUsers.length > 1) {
        // Show a slightly different shade when the user is available and others are too
        return 'bg-available';
      } else {
        // Just the current user is available
        return 'bg-available';
      }
    }
    
    // Current user is not available
    return 'bg-unavailable';
  };
  
  // Format a day number to a full date string
  const formatDateString = (day: number) => {
    return `${dates.year}-${String(dates.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  // Generate a helpful tooltip text for each day
  const getTooltipText = (date: string) => {
    const availability = dateAvailabilityMap.get(date);
    const userAvailable = isUserAvailable(date);
    
    if (!availability) return 'No availability data';
    
    const availableCount = availability.availableUsers.length;
    const availabilityPercentage = Math.round((availableCount / totalUsers) * 100);
    
    const availableNames = availability.availableUsers
      .map(user => user.username)
      .join(', ');
      
    if (availability.allAvailable) {
      return `Everyone is available! (${availableCount} people): ${availableNames}`;
    }
    
    if (availableCount === 0) {
      return 'Nobody is available on this day';
    }
    
    if (userAvailable) {
      if (availableCount === 1) {
        return 'Only you are available on this day';
      } else {
        return `You and ${availableCount - 1} others are available (${availabilityPercentage}%): ${availableNames}`;
      }
    }
    
    return `${availableCount} people are available (${availabilityPercentage}%): ${availableNames}`;
  };
  
  return (
    <div className="flex-1 min-w-[280px]">
      <h2 className="text-xl font-semibold mb-4">{monthName}</h2>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before the month starts */}
        {emptyCells.map(i => (
          <div key={`empty-${i}`} className="w-full"></div>
        ))}
        
        {/* Actual days of the month */}
        {days.map(day => {
          const dateString = formatDateString(day);
          const available = isUserAvailable(dateString);
          const allAvailable = isAllAvailable(dateString);
          
          return (
            <button
              key={dateString}
              type="button" 
              disabled={false}
              className={`calendar-day aspect-square ${getAvailabilityClass(dateString)} rounded-md cursor-pointer flex items-center justify-center shadow-sm relative`}
              onClick={() => onToggleAvailability(dateString)}
              title={getTooltipText(dateString)}
            >
              <span className="text-white font-medium">{day}</span>
              {dateAvailabilityMap.get(dateString) && dateAvailabilityMap.get(dateString)!.availableUsers.length > 0 && (
                <span className="text-white/80 text-[10px] absolute top-1 right-1 font-medium">
                  {dateAvailabilityMap.get(dateString)!.availableUsers.length}
                </span>
              )}
              {allAvailable && (
                <div className="star-icon">
                  <Star className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
