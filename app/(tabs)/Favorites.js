import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
} from "react-native";
import { usePokemon } from "../../src/context/PokemonContext";
import { useRouter } from "expo-router";
import { ThemeContext } from "../../src/context/MyTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const POKEDEX_BG_IMAGE = require("../../assets/Images/pokedex_bg.png");

export default function Favorite() {
  const { pokemonData, favorites, toggleFavorite } = usePokemon();
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const fetchFavoriteData = async () => {
      setLoading(true);
      try {
        const favoritePokemons = pokemonData.filter((pokemon) =>
          favorites.has(pokemon.id)
        );

        const uniquePokemons = Array.from(
          new Map(
            favoritePokemons.map((pokemon) => [pokemon.id, pokemon])
          ).values()
        );

        const loadedFavorites = await Promise.all(
          uniquePokemons.map(async (pokemon) => {
            const localImageUri = await AsyncStorage.getItem(
              `@pokemon_image_${pokemon.id}`
            );

            const imageUri = localImageUri || pokemon.image.local;

            // Check if the image file exists
            const imageInfo = imageUri
              ? await FileSystem.getInfoAsync(imageUri)
              : { exists: false };

            if (!imageInfo.exists) {
              console.warn(`Image not found at URI: ${imageUri}`);
            }

            return {
              ...pokemon,
              imageUri: imageInfo.exists ? imageUri : FALLBACK_IMAGE_URI, // Use a fallback URI
            };
          })
        );

        setFilteredFavorites(loadedFavorites);
      } catch (error) {
        console.error("Error fetching favorite Pokémon data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteData();
  }, [favorites, pokemonData]);

  const handlePokemonPress = (id) => {
    router.push(`/profile/${id}`);
  };

  const storePokemonImage = async (id, uri) => {
    if (!uri) {
      console.error(
        "Invalid URI: Cannot store Pokémon image with a null or undefined URI."
      );
      return;
    }

    try {
      // If the URI is a file URI, just store it directly
      if (uri.startsWith("file://")) {
        await AsyncStorage.setItem(`@pokemon_image_${id}`, uri);
      } else {
        // Handle HTTP URIs if needed
        const localUri = FileSystem.documentDirectory + `${id}.png`;
        await FileSystem.downloadAsync(uri, localUri);
        await AsyncStorage.setItem(`@pokemon_image_${id}`, localUri);
      }
    } catch (error) {
      console.error("Error storing Pokémon image URI:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={theme.statusBarText}
          backgroundColor={theme.statusBarBackground}
        />
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (filteredFavorites.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <StatusBar
          barStyle={theme.statusBarText}
          backgroundColor={theme.statusBarBackground}
        />
        <Text style={[styles.title, { color: theme.text }]}>
          No Favorites Yet
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={theme.statusBarText}
        backgroundColor={theme.statusBarBackground}
      />
      <ImageBackground
        source={POKEDEX_BG_IMAGE}
        resizeMode="cover"
        style={styles.background}
      >
        <Text style={[styles.title]}>Pokédex</Text>

        <FlatList
          data={filteredFavorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.pokemonItem,
                { backgroundColor: theme.background },
              ]}
            >
              <TouchableOpacity
                style={styles.pokemonDetails}
                onPress={() => handlePokemonPress(item.id)}
              >
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.pokemonImage}
                  onError={() =>
                    console.log(`Failed to load image for ID: ${item.id}`)
                  }
                />
                <Text style={[styles.pokemonText, { color: theme.text }]}>
                  {item.name.english}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  favorites.has(item.id) && styles.favoriteButtonActive,
                ]}
                onPress={() => {
                  toggleFavorite(item.id);
                  storePokemonImage(item.id, item.imageUri);
                }}
              >
                <Text style={styles.favoriteButtonText}>
                  {favorites.has(item.id) ? "❤️" : "🤍"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.flatListContent}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 99,
    marginBottom: 7,
    textAlign: "center",
  },
  flatListContent: {
    paddingBottom: 7,
    paddingTop: 1,
    marginLeft: 10,
    maxWidth: 363,
    paddingLeft: 10,
  },
  pokemonItem: {
    padding: 11,
    marginVertical: 2,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pokemonDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  pokemonImage: {
    width: 50,
    height: 50,
    marginRight: 15,
    borderRadius: 25,
  },
  pokemonText: {
    fontSize: 18,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButtonText: {
    fontSize: 24,
  },
  favoriteButtonActive: {
    color: "red",
  },
});
