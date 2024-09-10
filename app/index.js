import React from "react";
import { View, StatusBar } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import Login from "./login";
import TabLayout from "./(tabs)/_layout";

const Index = () => {
  const { isLoggedIn } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      {isLoggedIn ? <TabLayout /> : <Login />}
    </View>
  );
};

export default Index;
