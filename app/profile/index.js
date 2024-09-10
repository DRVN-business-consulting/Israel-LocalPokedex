import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PokemonProfile() {
  const { id } = useSearchParams(); // Getting the Pokemon ID from search params
  const [pokemon, setPokemon] = useState(null); // State to store the fetched Pokemon
  const [loading, setLoading] = useState(true); // Loading state to show loader

  useEffect(() => {
    const fetchPokemonFromStorage = async () => {
      setLoading(true); // Set loading true while fetching
      try {
        const storedPokemon = await AsyncStorage.getItem(`pokemon_${id}`); // Fetch Pokemon from AsyncStorage using the id
        if (storedPokemon !== null) {
          const parsedPokemon = JSON.parse(storedPokemon); // Parse the JSON to get the object
          setPokemon(parsedPokemon); // Set the Pokemon state with fetched details
        } else {
          console.error("Pokémon not found in AsyncStorage."); // Error handling if Pokemon is not found
        }
      } catch (error) {
        console.error("Error fetching Pokémon from AsyncStorage:", error); // Catch and log any errors
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchPokemonFromStorage(); // Trigger the async function on component mount
  }, [id]); // Effect will re-run if the `id` changes

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />{" "}
        {/* Loading spinner */}
      </SafeAreaView>
    );
  }

  if (!pokemon) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Pokémon not found</Text>{" "}
        {/* Error text if no Pokémon found */}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={{ uri: pokemon.image.hires }} // Display high-resolution Pokémon image
          style={styles.pokemonImage}
        />
        <Text style={styles.pokemonName}>{pokemon.name.english}</Text>{" "}
        {/* Display Pokémon name */}
        <Text style={styles.pokemonType}>
          Type: {pokemon.type.join(", ")}
        </Text>{" "}
        {/* Display Pokémon type(s) */}
        {/* You can add more Pokémon details here if needed */}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pokemonImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  pokemonType: {
    fontSize: 18,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
});
