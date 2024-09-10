import React, { useContext } from "react";
import { StyleSheet, View, Text, Button, Switch, Alert } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { ThemeContext } from "../../src/context/MyTheme"; // Adjust the import path as needed
import { useRouter } from "expo-router";

const AppSettings = () => {
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const router = useRouter();

  // Determine if the current theme is dark mode
  const isDarkMode = theme.background === "#121212";

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => {
          setIsLoggedIn(false);
          router.push("/login"); // Redirect to login screen
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.info, { color: theme.text }]}>
        Current Theme: {isDarkMode ? "Dark Mode" : "Light Mode"}
      </Text>
      <Switch
        value={isDarkMode}
        onValueChange={toggleTheme}
        style={styles.switch}
        accessibilityLabel="Toggle Theme"
      />
      {isLoggedIn && (
        <Button
          title="Logout"
          onPress={handleLogout}
          accessibilityLabel="Logout"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  info: {
    fontSize: 18,
    marginBottom: 20,
  },
  switch: {
    marginBottom: 20,
  },
});

export default AppSettings;
