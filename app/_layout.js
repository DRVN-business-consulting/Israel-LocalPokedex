import React from "react";
import { Stack } from "expo-router";
import { PokemonProvider } from "../src/context/PokemonContext";
import { ThemeProvider } from "../src/context/MyTheme";
import { AuthProvider } from "../src/context/AuthContext";

export default function AppLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PokemonProvider>
          <Stack>
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                title: "My Tabs",
                headerShown: false,
                headerStyle: {
                  backgroundColor: "#f0f",
                },
                headerTintColor: "yellow",
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                title: "Pokemon Info",
                headerShown: true,
              }}
            />
          </Stack>
        </PokemonProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
