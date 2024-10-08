import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Button,
  Alert,
  handleClose,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { useRouter } from "expo-router";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { usePokemon } from "../../src/context/PokemonContext";
import { ThemeContext } from "../../src/context/MyTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system"; // Import FileSystem
import { deactivateKeepAwake } from "expo-keep-awake";
const POKEDEX_BG_IMAGE = require("../../assets/Images/pokedex_bg.png");
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as ImagePicker from "expo-image-picker";

export default function AllPokemon() {
  const { pokemonData, setPokemonData, favorites, toggleFavorite } =
    usePokemon();

  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("");
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const flatListRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pokemonDetails, setPokemonDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const router = useRouter();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPokemonName, setNewPokemonName] = useState("");
  const [newPokemonType, setNewPokemonType] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log("Picked image URI:", uri);
        setSelectedImage(uri); // Set the picked image URI

        // Example filename and usage
        const fileName = "selected-image.png"; // Use a suitable filename
        await copyImage(uri, fileName);
      } else {
        console.log("Image picking was canceled or no image was selected.");
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };
  const copyImage = async (uri, fileName) => {
    if (!uri || !fileName) {
      throw new Error("Invalid URI or file name");
    }

    // Construct the local file URI
    const fileUri = FileSystem.documentDirectory + fileName;
    console.log("File URI:", fileUri);

    try {
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        console.log("File does not exist. Starting copy...");
        // Copy the image to the local file system
        await FileSystem.copyAsync({
          from: uri,
          to: fileUri,
        });
        console.log("Copy successful:", fileUri);
      } else {
        console.log("File already exists:", fileUri);
      }
      return fileUri;
    } catch (error) {
      console.error("Error copying image:", error);
      throw new Error(`Error copying image: ${error.message}`);
    }
  };

  const downloadImage = async (uri, fileName) => {
    if (!uri || !fileName) {
      throw new Error("Invalid URI or file name");
    }

    // Construct the local file URI
    const fileUri = FileSystem.documentDirectory + fileName;
    console.log("File URI:", fileUri);

    try {
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        console.log("File does not exist. Starting download...");
        // Download the image
        const downloadResult = await FileSystem.downloadAsync(uri, fileUri);
        console.log("Download successful:", downloadResult.uri);
      } else {
        console.log("File already exists:", fileUri);
      }
      return fileUri;
    } catch (error) {
      console.error("Error downloading image:", error);
      throw new Error(`Error downloading image: ${error.message}`);
    }
  };

  const processPokemon = async (pokemon) => {
    const fileName = `${pokemon.id}.png`;
    const fileUri = await downloadImage(pokemon.image.hires, fileName);
    pokemon.image.local = fileUri;

    try {
      const pokemonDetails = JSON.stringify(pokemon);
      await AsyncStorage.setItem(`pokemon_${pokemon.id}`, pokemonDetails);
    } catch (error) {
      console.error(
        `Error saving Pokémon to AsyncStorage: pokemon_${pokemon.id}`,
        error
      );
    }
  };

  const fetchAllPokemon = async (page) => {
    const limit = 10;
    setLoading(true);

    try {
      // 1. First, try to use updated data from AsyncStorage
      const storedPokemons = await Promise.all(
        Array.from({ length: limit }, (_, i) =>
          AsyncStorage.getItem(`pokemon_${i + (page - 1) * limit}`)
        )
      );

      const updatedData = storedPokemons
        .map((item) => (item ? JSON.parse(item) : null))
        .filter((item) => item !== null);

      if (updatedData.length > 0) {
        // If there is updated data in AsyncStorage, use it
        setPokemonData((prevData) => {
          const uniqueData = [
            ...prevData,
            ...updatedData.filter(
              (item) => !prevData.some((prevItem) => prevItem.id === item.id)
            ),
          ];
          // console.log(
          //   "Updated Pokémon data after adding AsyncStorage data:",
          //   uniqueData
          // );
          return uniqueData;
        });
      } else {
        // 2. If no updated data in AsyncStorage, fetch from the API
        const response = await fetch(
          `http://192.168.0.57:9090/pokemon?page=${page}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error(
            `Network response was not ok: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          if (data.length < limit) {
            setHasMore(false);
          }

          await Promise.all(data.map((pokemon) => processPokemon(pokemon)));

          // Fetch updated Pokémon data from AsyncStorage
          const updatedDataFromAPI = await Promise.all(
            data.map(async (pokemon) => {
              const storedPokemon = await AsyncStorage.getItem(
                `pokemon_${pokemon.id}`
              );
              return storedPokemon ? JSON.parse(storedPokemon) : pokemon;
            })
          );

          setPokemonData((prevData) => {
            const uniqueData = [
              ...prevData,
              ...updatedDataFromAPI.filter(
                (item) => !prevData.some((prevItem) => prevItem.id === item.id)
              ),
            ];
            // console.log("Final Pokémon data:", uniqueData);
            return uniqueData;
          });
        } else {
          console.error("Fetched data is not an array:", data);
        }
      }
    } catch (error) {
      console.error("Error fetching Pokémon data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    deactivateKeepAwake();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("Screen is focused");
      fetchAllPokemon(page);
    }, [page])
  );

  useEffect(() => {
    if (selectedType === "Null") {
      setFilteredPokemon(
        pokemonData.filter(
          (pokemon) => !pokemon.type || pokemon.type.includes("Null")
        )
      );
    } else if (selectedType) {
      setFilteredPokemon(
        pokemonData.filter((pokemon) => pokemon.type.includes(selectedType))
      );
    } else {
      setFilteredPokemon(pokemonData);
    }
  }, [selectedType, pokemonData]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

  const checkImageExists = async (fileUri) => {
    try {
      const { exists } = await FileSystem.getInfoAsync(fileUri);
      return exists;
    } catch (error) {
      console.error("Error checking image existence:", error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!selectedPokemon) return;

    try {
      const updatedPokemon = {
        ...selectedPokemon,
        name: { ...selectedPokemon.name, english: newName },
      };
      await AsyncStorage.setItem(
        `pokemon_${selectedPokemon.id}`,
        JSON.stringify(updatedPokemon)
      );
      setPokemonData((prevData) =>
        prevData.map((item) =>
          item.id === selectedPokemon.id ? updatedPokemon : item
        )
      );
      setModalVisible(false);
      Alert.alert("Success", "Pokémon name updated successfully!");
    } catch (error) {
      console.error("Error saving Pokémon:", error);
      Alert.alert("Error", "Failed to save Pokémon.");
    }
  };

  const handlePokemonPress = async (id) => {
    try {
      const storedPokemon = await AsyncStorage.getItem(`pokemon_${id}`);
      if (storedPokemon !== null) {
        const pokemonDetails = JSON.parse(storedPokemon);

        const imageExists = await checkImageExists(pokemonDetails.image.local);

        if (!imageExists) {
          const fileName = `${pokemonDetails.id}.png`;
          pokemonDetails.image.local = await downloadImage(
            pokemonDetails.image.hires,
            fileName
          );
        }

        router.push(`/profile/${id}`);
      } else {
        throw new Error(`No Pokémon found in AsyncStorage for ID: ${id}`);
      }
    } catch (error) {
      console.error("Error retrieving Pokémon from AsyncStorage:", error);
    }
  };

  const handleEdit = (pokemon) => {
    setSelectedPokemon(pokemon);
    setNewName(pokemon.name.english);
    setModalVisible(true);
  };

  const handleSelectImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to grant permission to access the media library."
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!pickerResult.cancelled) {
      setSelectedImage(pickerResult.uri);
    }
  };

  const handleCreatePokemon = async () => {
    if (!newPokemonName || !newPokemonType) {
      Alert.alert("Error", "Please provide both name and type.");
      return;
    }

    const newPokemon = {
      id: Date.now(),
      name: { english: newPokemonName },
      type: [newPokemonType],
      image: {
        hires: selectedImage, // Use the picked image URI
        local: null,
      },
    };

    try {
      console.log("Creating Pokémon with image URI:", selectedImage);
      console.log("Creating Pokémon with file name:", `${newPokemon.id}.png`);

      if (selectedImage) {
        const fileName = `${newPokemon.id}.png`;
        const fileUri = await copyImage(selectedImage, fileName); // Use copyImage instead
        newPokemon.image.local = fileUri;
      }

      // Save the Pokémon and update AsyncStorage
      await processPokemon(newPokemon);

      // Update the Pokémon data in state
      setPokemonData((prevData) => {
        const updatedData = [...prevData, newPokemon];
        return updatedData.sort((a, b) => b.id - a.id);
      });

      setIsCreateModalVisible(false); // Close the modal
      Alert.alert("Success", "Pokémon created successfully!");
    } catch (error) {
      console.error("Error creating Pokémon:", error);
      Alert.alert("Error", "Failed to create Pokémon.");
    }
  };

  const getTypeColor = (type) => {
    const typeColors = {
      Normal: "#A8A77A",
      Fire: "#EE8130",
      Water: "#6390F0",
      Grass: "#7AC74C",
      Electric: "#F7D02C",
      Ice: "#96D9D6",
      Fighting: "#C22E28",
      Poison: "#A33EA1",
      Ground: "#E2BF65",
      Flying: "#A98FF3",
      Psychic: "#F95587",
      Bug: "#A6B91A",
      Rock: "#B6A136",
      Ghost: "#735797",
      Dark: "#705746",
      Dragon: "#6F35FC",
      Steel: "#B7B7CE",
      Fairy: "#D685AD",
    };

    return typeColors[type] || theme.text;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ImageBackground
        source={POKEDEX_BG_IMAGE}
        resizeMode="cover"
        style={styles.background}
      >
        <RNPickerSelect
          onValueChange={(value) => setSelectedType(value)}
          items={[
            { label: "Normal", value: "Normal" },
            { label: "Fire", value: "Fire" },
            { label: "Water", value: "Water" },
            { label: "Grass", value: "Grass" },
            { label: "Electric", value: "Electric" },
            { label: "Ice", value: "Ice" },
            { label: "Fighting", value: "Fighting" },
            { label: "Poison", value: "Poison" },
            { label: "Ground", value: "Ground" },
            { label: "Flying", value: "Flying" },
            { label: "Psychic", value: "Psychic" },
            { label: "Bug", value: "Bug" },
            { label: "Rock", value: "Rock" },
            { label: "Ghost", value: "Ghost" },
            { label: "Dark", value: "Dark" },
            { label: "Dragon", value: "Dragon" },
            { label: "Steel", value: "Steel" },
            { label: "Fairy", value: "Fairy" },
          ]}
          style={{
            inputIOS: {
              marginLeft: 10,
              fontSize: 24,
              fontWeight: "bold",
              color: theme.text,
            },
            inputAndroid: {
              marginLeft: 10,
              fontSize: 24,
              fontWeight: "bold",
              color: theme.text,
            },
          }}
          placeholder={{ label: "Select Type", value: null }}
        />
        <View style={styles.pokedexContainer}>
          <Text style={[styles.title]}>Pokédex</Text>

          {loading && page === 1 ? (
            <ActivityIndicator size="large" color={theme.text} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={filteredPokemon}
              extraData={pokemonData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                // console.log(item);
                return (
                  <View
                    key={`${item.id}-${item.name.english}`}
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
                        source={{ uri: item.image.local || item.image.hires }}
                        style={styles.pokemonImage}
                      />
                      <View>
                        <Text
                          style={[styles.pokemonName, { color: theme.text }]}
                        >
                          {item.name.english}
                        </Text>
                        <Text
                          style={[
                            styles.pokemonType,
                            { color: getTypeColor(item.type[0]) },
                          ]}
                        >
                          {item.type.join(", ")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.buttonsContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.editButton]}
                        onPress={() => handleEdit(item)}
                      >
                        <View style={styles.buttonContent}>
                          <AntDesign name="edit" size={10} color="black" />
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.button, styles.deleteButton]}
                        onPress={() => handleDelete(item)}
                      >
                        <View style={styles.buttonContent}>
                          <AntDesign name="delete" size={10} color="black" />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.favoriteButton,
                          favorites.has(item.id) && styles.favoriteButtonActive,
                        ]}
                        onPress={() => toggleFavorite(item.id)}
                      >
                        <Text
                          style={[
                            styles.favoriteButtonText,
                            {
                              color: favorites.has(item.id)
                                ? "red"
                                : theme.text,
                            },
                          ]}
                        >
                          {favorites.has(item.id) ? "❤️" : "🤍"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
            />
          )}
        </View>
        <TouchableOpacity
          style={[styles.button, styles.buttonCreate]}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <View style={styles.buttonCreate}>
            <Ionicons name="create" size={24} color="black" />
          </View>
        </TouchableOpacity>
      </ImageBackground>

      {/* Modal for editing Pokémon */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Pokémon Name</Text>
            <TextInput
              style={styles.textInput}
              value={newName}
              onChangeText={setNewName}
            />
            <Button title="Save" onPress={handleSave} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCreateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Pokémon</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Pokémon Name"
              value={newPokemonName}
              onChangeText={setNewPokemonName}
            />

            <RNPickerSelect
              onValueChange={(value) => setNewPokemonType(value)}
              items={[
                { label: "Normal", value: "Normal" },
                { label: "Fire", value: "Fire" },
                { label: "Water", value: "Water" },
                { label: "Grass", value: "Grass" },
                { label: "Electric", value: "Electric" },
                { label: "Ice", value: "Ice" },
                { label: "Fighting", value: "Fighting" },
                { label: "Poison", value: "Poison" },
                { label: "Ground", value: "Ground" },
                { label: "Flying", value: "Flying" },
                { label: "Psychic", value: "Psychic" },
                { label: "Bug", value: "Bug" },
                { label: "Rock", value: "Rock" },
                { label: "Ghost", value: "Ghost" },
                { label: "Dark", value: "Dark" },
                { label: "Dragon", value: "Dragon" },
                { label: "Steel", value: "Steel" },
                { label: "Fairy", value: "Fairy" },
              ]}
              style={{
                inputIOS: {
                  marginLeft: 10,
                  fontSize: 24,
                  fontWeight: "bold",
                  color: theme.text,
                },
                inputAndroid: {
                  marginLeft: 10,
                  fontSize: 24,
                  fontWeight: "bold",
                  color: theme.text,
                },
              }}
              placeholder={{ label: "Select Type", value: null }}
            />
            <Button title="Select Image" onPress={pickImage} />
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={{ width: 100, height: 100, marginVertical: 10 }}
              />
            )}
            <Button title="Create Pokemon" onPress={handleCreatePokemon} />
            <Button
              title="Cancel"
              onPress={() => setIsCreateModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
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
    marginTop: 45,
    marginBottom: 10,
    textAlign: "center",
  },
  pokedexContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 89,
  },
  flatListContent: {
    paddingBottom: 1,
    marginLeft: 22,
    maxWidth: 345,
  },
  pokemonItem: {
    padding: 10,
    marginLeft: 10,
    marginRight: 10,
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
    fontWeight: "bold",
  },
  pokemonType: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 10,
  },
  favoriteButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButtonText: {
    fontSize: 24,
    color: "#fff",
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center", // Align items properly
  },
  button: {
    padding: 10, // Ensure padding is sufficient
    borderRadius: 5,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  createButton: {
    backgroundColor: "#4CAF50",
  },
  editButton: {
    backgroundColor: "#FFC107",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  buttonCreate: {
    backgroundColor: "#4CAF50",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    textAlign: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  textInput: {
    width: "100%",
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 10,
  },
});
