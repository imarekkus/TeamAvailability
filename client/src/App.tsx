import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import CalendarPage from "@/pages/calendar";
import { useState } from "react";
import { User } from "@shared/schema";
import ThemeToggle from "./components/ThemeToggle";

function Router() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <Switch>
      {!currentUser ? (
        <Route path="/">
          <LoginPage onLogin={handleLogin} />
        </Route>
      ) : (
        <Route path="/">
          <CalendarPage user={currentUser} onLogout={handleLogout} />
        </Route>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="relative min-h-screen bg-background text-foreground">
          <ThemeToggle className="absolute top-4 right-4" />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
