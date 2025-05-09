import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, DateAvailability } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import MonthCalendar from "@/components/month-calendar";
import UserList from "@/components/user-list";
import { getMonthRange } from "@/lib/calendar-utils";
import { Star } from "lucide-react";

interface CalendarPageProps {
  user: User;
  onLogout: () => void;
}

export default function CalendarPage({ user, onLogout }: CalendarPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get date ranges for current and next month
  const now = new Date();
  const currentMonthDates = getMonthRange(now.getFullYear(), now.getMonth());
  const nextMonthDates = getMonthRange(
    now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
    now.getMonth() === 11 ? 0 : now.getMonth() + 1
  );
  
  // Format month names
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthName = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Query for availability data
  const { data: availabilityData, isLoading, error } = useQuery({
    queryKey: ['/api/availability/dates', currentMonthDates.start, nextMonthDates.end],
    queryFn: async () => {
      const res = await fetch(`/api/availability/dates?startDate=${currentMonthDates.start}&endDate=${nextMonthDates.end}`);
      if (!res.ok) throw new Error('Failed to fetch availability data');
      return res.json() as Promise<DateAvailability[]>;
    }
  });
  
  // Query for users list
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load calendar data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const handleToggleAvailability = async (date: string) => {
    try {
      // Show loading toast
      toast({
        title: "Updating...",
        description: "Saving your availability",
      });
      
      const response = await fetch('/api/availability/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, date }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update availability');
      }
      
      // Wait for the response to process before continuing
      await response.json();
      
      // Invalidate and refetch queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/availability/dates'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/users'] })
      ]);
      
      // Wait for the queries to be refetched
      await queryClient.refetchQueries({ 
        queryKey: ['/api/availability/dates', currentMonthDates.start, nextMonthDates.end],
        exact: true 
      });
      
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast({
        title: "Error",
        description: "Failed to update your availability. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Availability Calendar</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Welcome, {user.username}</span>
                <Button 
                  variant="ghost" 
                  className="text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => onLogout()}
                  type="button"
                >
                  Logout
                </Button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-unavailable rounded"></div>
                <span className="text-sm">Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-available rounded"></div>
                <span className="text-sm">Available (You)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-all-available rounded relative flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm">Everyone Available</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">Click on a day to mark your availability. Days where everyone is available will be highlighted.</p>
            
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-8">
                <MonthCalendar
                  monthName={currentMonthName}
                  dates={currentMonthDates}
                  availabilityData={availabilityData || []}
                  userId={user.id}
                  onToggleAvailability={handleToggleAvailability}
                />
                
                <MonthCalendar
                  monthName={nextMonthName}
                  dates={nextMonthDates}
                  availabilityData={availabilityData || []}
                  userId={user.id}
                  onToggleAvailability={handleToggleAvailability}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <UserList users={users || []} />
      </div>
    </div>
  );
}
