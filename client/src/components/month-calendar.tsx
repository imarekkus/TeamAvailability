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
  
  // Format a day number to a full date string
  const formatDateString = (day: number) => {
    return `${dates.year}-${String(dates.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
            <div
              key={dateString}
              className={`calendar-day aspect-square ${available ? 'bg-available' : 'bg-unavailable'} rounded-md cursor-pointer flex items-center justify-center shadow-sm`}
              onClick={() => onToggleAvailability(dateString)}
            >
              <span className="text-white font-medium">{day}</span>
              {allAvailable && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <Star className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
