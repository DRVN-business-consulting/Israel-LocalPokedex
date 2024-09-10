// src/context/PokemonContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PokemonContext = createContext();

export const usePokemon = () => useContext(PokemonContext);

export const PokemonProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(new Set());
  const [pokemonData, setPokemonData] = useState([]);

  useEffect(() => {
    // Load favorites from AsyncStorage when the context mounts
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem("favorites");
        if (storedFavorites) {
          setFavorites(new Set(JSON.parse(storedFavorites)));
        }
      } catch (error) {
        console.error("Failed to load favorites from AsyncStorage:", error);
      }
    };

    loadFavorites();
  }, []);

  useEffect(() => {
    // Save favorites to AsyncStorage whenever they change
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem(
          "favorites",
          JSON.stringify(Array.from(favorites))
        );
      } catch (error) {
        console.error("Failed to save favorites to AsyncStorage:", error);
      }
    };

    saveFavorites();
  }, [favorites]);

  const toggleFavorite = (pokemonId) => {
    setFavorites((prevFavorites) => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(pokemonId)) {
        newFavorites.delete(pokemonId);
      } else {
        newFavorites.add(pokemonId);
      }
      return newFavorites;
    });
  };

  return (
    <PokemonContext.Provider
      value={{ favorites, toggleFavorite, pokemonData, setPokemonData }}
    >
      {children}
    </PokemonContext.Provider>
  );
};
