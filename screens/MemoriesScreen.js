import { useEffect, useState } from "react";
import { StyleSheet, Dimensions, View, TouchableOpacity, Text, TextInput, ActivityIndicator, Alert, Keyboard } from "react-native";


import { useSelector } from "react-redux";

import { useFonts } from "expo-font";
import MasonryList from "react-native-masonry-list";
import * as ImagePicker from "expo-image-picker";

import PlaceCard from "../components/PlaceCard";
import Header from "../components/Header";
import Picture from "../components/Picture";

import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCamera, faUpload, faStar } from "@fortawesome/free-solid-svg-icons";
import { Toast } from "toastify-react-native";

export default function MemoriesScreen({ route, navigation }) {
  const { selectedPlace } = route.params;
  const user = useSelector((state) => state.user.value);

  const [pictures, setPictures] = useState([]); // Ajout des photos dans le masonryList
  const [personalNote, setPersonalNote] = useState(0); // Récupération de la note au clique sur les étoiles
  const [newReviewText, setNewReviewText] = useState(""); // Récupération du texte de l'avis
  const [viewPictures, setViewPictures] = useState(false); // Affichage de la photo au clique
  const [selectedImage, setSelectedImage] = useState(""); // Récupération de l'image au clique et les envoyer dans le component Picture
  const [refreshKey, setRefreshKey] = useState(0); // Rafraichissement de la placeCard
  const [refreshGallery, setRefreshGallery] = useState(0); // Rafraichissement de la galerie
  const [loading, setLoading] = useState(true); // Affichage du loading

  useFonts({ "JosefinSans-Bold": require("../assets/fonts/JosefinSans-Bold.ttf") });

  const fetchPictures = async () => {
    try {
      const response = await fetch(`https://roll-in-new-york-backend.vercel.app/favorites/pictures/${user.token}/${selectedPlace.id}`);
      const data = await response.json();
      const newPictures = data.urls.map((secure_url) => ({
        uri: secure_url.secure_url,
        publicId: secure_url.public_id,
      }));
      setPictures(newPictures);
      setLoading(false);
    } catch (err) {
      console.error("❌ (Memories Screen) : Error to fetch all pictures", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPictures();

    return () => {
      setPictures([]);
      setLoading(true);
    };
  }, [route.params.selectedPlace.id, user.token, refreshGallery]);

  // Boucle pour gérer l'affichage des étoiles en fonction des étoiles cliquées
  const personalStars = [];
  for (let i = 0; i < 5; i++) {
    let style = { color: "#EFEFEF" };
    if (i < personalNote) {
      style = { color: "#DEB973" };
    }
    personalStars.push(
      <TouchableOpacity key={`starIndex: ${i}`} onPress={() => setPersonalNote(i + 1)}>
        <FontAwesomeIcon icon={faStar} style={style} size={30} />
      </TouchableOpacity>
    );
  }

  const handlePostReview = () => {
    const newReviewData = {
      user: user.id,
      place: selectedPlace.id,
      createdAt: new Date(),
      note: personalNote,
      content: newReviewText,
    };

    if (newReviewText === "") {
      return;
    } else {
      try {
        fetch(`https://roll-in-new-york-backend.vercel.app/reviews/${user.token}/${selectedPlace.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReviewData),
        })
          .then((response) => response.json())
          .then(() => {
            Toast.success("Review posted!", "top", { duration: 2000 });
            setNewReviewText("");
            setPersonalNote(0);
            setRefreshKey((prev) => prev + 1);
            Keyboard.dismiss();
          });
        } catch (err) {
          console.error("❌ (Memories Screen): Error in connection to database", err);
        }
      }
  };

  // Fonction pour ouvrir la caméra
  const handleCamera = () => {
    const selectedPlace = {
      id: route.params.selectedPlace.id,
      title: route.params.selectedPlace.title,
      image: route.params.selectedPlace.image,
      description: route.params.selectedPlace.description,
    };
    navigation.navigate("Camera", { selectedPlace });
  };

  const handleFilePick = async () => {
    try {
      // Demande d'autorisation pour accéder à la bibliothèque de photos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "You must allow access to your photo library to upload a picture.");
        return;
      }

      // Sélection de la ou des photos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets.length > 0) {

        for (const asset of result.assets) {
          try {
            const formData = new FormData();

            formData.append("photoFromFront", {
              uri: asset.uri,
              name: asset.uri.split("/").pop(),
              type: "image/jpeg",
            });

            formData.append("userToken", user.token);
            formData.append("idPlace", selectedPlace.id);

            const response = await fetch("https://roll-in-new-york-backend.vercel.app/favorites/pictures", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();

            if (data.url) {
              Toast.success("Photo(s) uploaded !", "top", {
                duration: 2000,
              });
              setPictures((prevPictures) => [...prevPictures]);
              setLoading(true);
              setRefreshGallery((prev) => prev + 1);
            } else {
              Alert.alert("Photo selection failed", "An error occurred while uploading a picture.");
            }
          } catch (error) {
            console.error("❌ (Memories Screen): Error in photo upload", error);
          }
        }
      }
    } catch (error) {
      console.error("❌ (Memories Screen): Error in picture selection", error);
      Alert.alert("Photo selection failed", "An error occurred while selecting a picture.");
    }
  };

  const calculateImageSize = (photo) => {
    const { width, height } = photo;
    const aspectRatio = width / height;
    const newWidth = Dimensions.get("window").width / 3 - 4; // Largeur dynamique selon la grille
    const newHeight = newWidth / aspectRatio; // Calculer la hauteur en fonction du ratio

    return {
      width: newWidth,
      height: newHeight,
    };
  };

  const manualRefresh = async () => {
    setLoading(true);
    setRefreshGallery((prev) => prev + 1);
  };

  return (
    <>
      <View style={styles.container}>
        <Header title="My Memories" showInput={false} />
        <View style={styles.memoriesContainer}>
          <PlaceCard
            key={refreshKey}
            id={selectedPlace.id}
            title={selectedPlace.title}
            image={selectedPlace.image}
            description={selectedPlace.description}
          />
          <View style={styles.postReview}>
            <Text style={styles.title}>My review</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Write your review"
                onChangeText={(value) => setNewReviewText(value)}
                value={newReviewText}
              />
              <View style={styles.starContainer}>{personalStars}</View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.postButton} onPress={handlePostReview}>
                  <Text style={styles.textButton}>Post review</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.buttonPictures}>
            <TouchableOpacity style={styles.buttonUpload} onPress={handleFilePick}>
              <FontAwesomeIcon icon={faUpload} size={30} color="#DEB973" />
            </TouchableOpacity>
            <View style={styles.buttonPictureSeparator}></View>
            <TouchableOpacity style={styles.buttonPicture} onPress={handleCamera}>
              <FontAwesomeIcon icon={faCamera} size={30} color="#DEB973" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#001F3F" style={{ marginTop: 10 }} />
          ) : (
            <View style={styles.gallery}>
              {pictures.length === 0 && <Text style={styles.noPicture}>No pictures yet</Text>}
              <MasonryList
                key={refreshGallery}
                images={pictures.map((picture) => {
                  const { width, height } = calculateImageSize(picture);
                  return { uri: picture.uri, width, height, publicId: picture.publicId };
                })}
                columns={3}
                spacing={1}
                refreshing={false}
                onRefresh={() => manualRefresh()}
                backgroundColor={"#EFEFEF"}
                style={{ backgroundColor: "#EFEFEF" }}
                onPressImage={(image) => {
                  setSelectedImage(image);
                  setViewPictures(true);
                }}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </View>

      <Picture
        isOpen={viewPictures}
        onClose={() => setViewPictures(false)}
        onDelete={() => setRefreshGallery((prev) => prev + 1)}
        selectedImage={selectedImage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
    backgroundColor: "#EFEFEF",
  },
  memoriesContainer: {
    flex: 1,
    marginTop: 200,
    paddingTop: 2,
    alignItems: "center",
  },
  postReview: {
    width: Dimensions.get("window").width - 50,
    height: 140,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: "#282C37",
    backgroundColor: "white",
    paddingHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "JosefinSans-Bold",
    color: "black",
    marginRight: 8,
  },
  inputContainer: {
    width: "100%",
    borderBottomWidth: 1,
    borderRadius: 20,
    height: 40,
  },
  input: {
    width: "100%",
    height: "100%",
  },
  starContainer: {
    width: "100%",
    height: 30,
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    width: "100%",
    height: 30,
    marginTop: 5,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  postButton: {
    backgroundColor: "#001F3F",
    width: "30%",
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
    marginBottom: 5,
  },
  textButton: {
    color: "#DEB973",
    textAlign: "center",
  },
  buttonPictures: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#001F3F",
    width: Dimensions.get("window").width - 80,
    height: "7%",
    borderRadius: 50,
  },
  buttonUpload: {
    marginLeft: 65,
  },
  buttonPictureSeparator: {
    height: "100%",
    width: "1.5%",
    backgroundColor: "#DEB973",
  },
  buttonPicture: {
    marginRight: 65,
  },
  gallery: {
    marginTop: 5,
    width: "100%",
    height: "50%",
  },
  noPicture: {
    width: "100%",
    textAlign: "center",
  },
});
