import React from "react";
import { Stack } from "expo-router";
import { ThemeProvider } from "../../src/context/MyTheme";

export default function ProfileLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Pokemon Detail",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="[id]"
          options={{
            title: "Pokemon Detail",
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
