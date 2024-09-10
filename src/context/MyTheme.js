import React, { createContext, useState } from "react";

// Define themes with background and text colors
const themes = {
  light: {
    background: "#FFFFFF",
    text: "#000000",
  },
  dark: {
    background: "#121212",
    text: "#FFFFFF",
  },
};

// Create the context
export const ThemeContext = createContext();

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.light);

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === themes.light ? themes.dark : themes.light
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
