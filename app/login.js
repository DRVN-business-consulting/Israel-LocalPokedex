import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  Button,
  ImageBackground,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../src/context/AuthContext";

const POKEDEX_BG_IMAGE = require("../assets/Images/pokedex_bg.png");

const SHIFT = 3; // Number of positions to shift for the Caesar cipher
const HARDCODED_PASSWORD = "1"; // Hardcoded password for comparison

// Helper function to encrypt/decrypt using Caesar Shift
const caesarShift = (str, shift) => {
  return str.replace(/[a-z]/gi, (char) => {
    const charCode = char.charCodeAt(0);
    const base = charCode >= 65 && charCode <= 90 ? 65 : 97; // Uppercase or lowercase
    return String.fromCharCode(((charCode - base + shift) % 26) + base);
  });
};

const Login = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setIsLoggedIn } = useAuth();

  useEffect(() => {
    // Encrypt the hardcoded password and store it in SecureStore (only done once)
    const storeEncryptedPassword = async () => {
      const encryptedPassword = caesarShift(HARDCODED_PASSWORD, SHIFT);
      await SecureStore.setItemAsync("encryptedPassword", encryptedPassword);
    };

    storeEncryptedPassword();
  }, []);

  const handleLogin = async () => {
    // Encrypt the entered password
    const encryptedInputPassword = caesarShift(password, SHIFT);

    // Retrieve the stored encrypted password from SecureStore
    const storedEncryptedPassword =
      await SecureStore.getItemAsync("encryptedPassword");

    // Compare the encrypted input password with the stored one
    if (encryptedInputPassword === storedEncryptedPassword) {
      setIsLoggedIn(true);
      setError("");
      router.push("/(tabs)");
    } else {
      setError("Incorrect Password");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={POKEDEX_BG_IMAGE}
        resizeMode="cover"
        style={styles.background}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View>
            <Text style={styles.title}>Pokédex Login</Text>
            <TextInput
              placeholder="Enter Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Login" onPress={handleLogin} />
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: 250,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  error: {
    color: "red",
    marginBottom: 20,
  },
});

export default Login;
