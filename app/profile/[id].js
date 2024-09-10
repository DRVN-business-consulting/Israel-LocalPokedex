import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const POKEDEX_BG_IMAGE = require("../../assets/Images/pokedex_bg.png");

const typeColors = {
  Normal: "#A8A878",
  Fire: "#F08030",
  Water: "#6890F0",
  Grass: "#78C850",
  Electric: "#F8D030",
  Ice: "#98D8D8",
  Fighting: "#C03028",
  Poison: "#A040A0",
  Ground: "#E0C068",
  Flying: "#A890F0",
  Psychic: "#F85888",
  Bug: "#A8B820",
  Rock: "#B8A038",
  Ghost: "#705898",
  Dark: "#705848",
  Dragon: "#7038F8",
  Steel: "#B8B8D0",
  Fairy: "#EE99AC",
  Unknown: "#000000",
};

export default function ViewProfile() {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  useEffect(() => {
    if (!id) {
      console.error("No ID found");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const storedPokemon = await AsyncStorage.getItem(`pokemon_${id}`);
        if (storedPokemon !== null) {
          const pokemon = JSON.parse(storedPokemon);
          console.log("Retrieved Pokémon data:", pokemon); // Log data for debugging
          setProfile(pokemon);
          setEditedProfile(pokemon); // Set editable data
        } else {
          throw new Error("No data found for the given ID");
        }

        // Fetch Pokémon image from the filesystem
        const imagePath = FileSystem.documentDirectory + `pokemon_${id}.png`;
        const imageInfo = await FileSystem.getInfoAsync(imagePath);
        if (imageInfo.exists) {
          setImageUri(imagePath);
        } else {
          console.error("Image not found in filesystem");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleSaveChanges = async () => {
    try {
      await AsyncStorage.setItem(
        `pokemon_${id}`,
        JSON.stringify(editedProfile)
      );
      setProfile(editedProfile); // Update displayed profile after saving
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const {
    name = {},
    type = [],
    profile: profileDetails = {},
    description = "No description available",
  } = profile;

  const textColor = typeColors[type[0]] || typeColors.Unknown; // Use the first type for color

  return (
    <View style={styles.container}>
      <Image source={POKEDEX_BG_IMAGE} style={styles.backgroundImage} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Pokédex</Text>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text>No image available</Text>
          </View>
        )}
        {isEditing ? (
          <>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={editedProfile.name.english || ""}
              onChangeText={(text) =>
                setEditedProfile({ ...editedProfile, name: { english: text } })
              }
            />
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={editedProfile.description || ""}
              onChangeText={(text) =>
                setEditedProfile({ ...editedProfile, description: text })
              }
            />
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={editedProfile.profile?.species || ""}
              onChangeText={(text) =>
                setEditedProfile({
                  ...editedProfile,
                  profile: { ...editedProfile.profile, species: text },
                })
              }
            />
            <Button
              title="Save Changes"
              style={{ margin: 10 }}
              onPress={handleSaveChanges}
            />
            <Button title="Cancel" onPress={() => setIsEditing(false)} />
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: textColor }]}>
              {name.english || "Unknown"}
            </Text>
            <Text style={[styles.text, { color: textColor }]}>
              <Text style={styles.boldText}>Type: </Text>
              {type.join(", ") || "Unknown"}
            </Text>
            <Text style={[styles.text, { color: textColor }]}>
              <Text style={styles.boldText}>Species: </Text>
              {profileDetails.species || "Unknown"}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    paddingBottom: 16,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 5,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 5,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: "bold",
  },
  input: {
    fontSize: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
