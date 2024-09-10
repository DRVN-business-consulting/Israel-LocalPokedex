import React from "react";
import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemeProvider } from "../../src/context/MyTheme";

export default function TabLayout() {
  return (
    <ThemeProvider>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            title: "All Pokemon",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name="catching-pokemon"
                size={size}
                color={focused ? "#f0f" : "gray"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name="favorite"
                size={size}
                color={focused ? "#f0f" : "gray"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="AppSettings"
          options={{
            title: "App Settings",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name="settings"
                size={size}
                color={focused ? "#f0f" : "gray"}
              />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
