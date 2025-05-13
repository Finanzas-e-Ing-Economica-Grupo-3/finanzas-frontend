
import React, { useEffect } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Apply dark mode by default when the component mounts
  useEffect(() => {
    // Apply dark class to html element
    document.documentElement.classList.add('dark');
  }, []);

  return <>{children}</>;
};

export default ThemeProvider;
