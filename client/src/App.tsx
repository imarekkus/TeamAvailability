import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import CalendarPage from "@/pages/calendar";
import { useState, useEffect } from "react";
import { User } from "@shared/schema";
import ThemeToggle from "./components/ThemeToggle";

function Router({ currentUser, setCurrentUser }: { currentUser: User | null; setCurrentUser: (user: User | null) => void }) {
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState<boolean>(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches // start with system theme
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <div className="absolute top-4 right-4">
            <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
          </div>
          <Router currentUser={currentUser} setCurrentUser={setCurrentUser} />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
