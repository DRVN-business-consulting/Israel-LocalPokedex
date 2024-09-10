// src/context/PokemonContext.js
import React, { createContext, useState, useContext } from "react";

const PokemonContext = createContext();

export const usePokemon = () => useContext(PokemonContext);

export const PokemonProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(new Set());
  const [pokemonData, setPokemonData] = useState([]);

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
