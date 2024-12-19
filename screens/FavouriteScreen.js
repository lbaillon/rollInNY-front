import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Linking, Platform, Alert, Image, Dimensions } from "react-native";

import { useSelector } from "react-redux";

import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

import { usePlanDayContext, usePopupContext } from "../provider/AppProvider";
import Header from "../components/Header";
import PlaceCard from "../components/PlaceCard";

import { useFonts } from "expo-font";
import { Checkbox } from "react-native-paper";

const manWalking = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734427710/appIcons/l0misyhittkq0v7qabx3.webp";
const moviePlace = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734427585/appIcons/oi2ry9sz9uojhzasypfv.webp";
const errorImage = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734516235/teflem0cocn53iqsvier.webp";

export default function FavouriteScreen() {
  useFonts({ "JosefinSans-SemiBold": require("../assets/fonts/JosefinSans-SemiBold.ttf") });

  const navigation = useNavigation();
  const user = useSelector((state) => state.user.value);
  const favorite = useSelector((state) => state.favorite.value);

  const { setActivePopupId } = usePopupContext(); // Récupération de l'état de la popup
  const { isPlanDay, setIsPlanDay } = usePlanDayContext(); // Récupération de l'état du PlanDay

  const [placesLikedList, setPlacesLikedList] = useState(null); // État pour stocker la liste des lieux likés
  const [isLoading, setIsLoading] = useState(true); // Etat du chargement de la page
  const [checkBtn, setCheckBtn] = useState(false); // Etat pour afficher les checkbox à l'appui sur PlanMyDay
  const [checkedStates, setCheckedStates] = useState([]); // Etat pour stocker les checkbox cochées
  const [modalVisible, setModalVisible] = useState(false); // Etat pour afficher la modale de la carte
  const [planBtnVisible, setPlanBtnVisible] = useState(true); // Etat pour afficher le bouton PlanMyDay
  const [currentPosition, setCurrentPosition] = useState(null); // Etat pour stocker la position actuelle de l'utilisateur
  const [refreshKey, setRefreshKey] = useState(0); // Etat pour rafraichir la note sur les placeCard

  //useFocusEffect met à jour la refreshKey à chaque fois qu'on arrive sur FavoriteScreen
  //la refreshKey est ajoutée à l'id de la placeCard pour forcer le rerender avec la note à jour
  useFocusEffect(
    React.useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

  useEffect(() => {
    // Redirection vers la page login si on n'est pas connecté
    (async () => {
      if (user.token === null) {
        navigation.navigate("Login");
        return;
      }
    })();
    // Requête pour récupérer les lieux likés
    try {
      fetch(`https://roll-in-new-york-backend.vercel.app/favorites/places/${user.token}`)
        .then((response) => response.json())
        .then((data) => {
          const favoritePlaces = Array.isArray(data.favoritePlaces) ? data.favoritePlaces : []; // Vérifie si c'est un tableau
          setPlacesLikedList(data.favoritePlaces || null); // Stockage des lieux likés dans l'état placesLikedList
          setCheckedStates(Array(favoritePlaces.length).fill(false)); // Initialisation des états pour chaque case à cocher
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("❌ (Favorite Screen): Error in fetch liked places", err);
        });
    } catch (err) {
      console.error("❌ (Favorite Screen): Error in database connection", err);
    }
  }, [user.token, favorite, navigation]);

  useEffect(() => {
    (async () => {
      // Demande de permission pour récupérer la localisation de l'utilisateur
      const result = await Location.requestForegroundPermissionsAsync();
      const status = result?.status;

      if (status === "granted") {
        Location.watchPositionAsync({ distanceInterval: 10 }, (location) => {
          setCurrentPosition(location.coords);
        });
      } else {
        //Alert.alert("Permission denied", "You must allow the app to access your location to use this feature.");
      }
    })();
  }, []);

  // Affichage de la liste des lieux likés
  let content;
  if (isLoading) {
    content = <Text style={styles.textError}>Loading favorites ...</Text>;
  } else if (placesLikedList && placesLikedList.length > 0) {
    content = placesLikedList.map((place, i) => (
      <View style={styles.cardLine} key={`view-${i}`}>
        {checkBtn && (
          <View style={Platform.OS === "ios" ? styles.checkboxContainer : styles.checkbox}>
            <Checkbox
              key={`checkbox-${i}`}
              status={checkedStates[i] ? "checked" : "unchecked"}
              onPress={() => toggleCheckbox(i)}
              color="#001F3F"
              uncheckedColor="black"
            />
          </View>
        )}

        <PlaceCard
          key={`${place._id}-${refreshKey}`}
          id={place._id}
          title={place.title}
          image={place.placePicture}
          description={place.overview}
          noteAverage={3}
          navigation={navigation}
        />
      </View>
    ));
  } else if (user.token) {
    content = (
      <View style={styles.errorBox}>
        <Image style={styles.image} source={{ uri: errorImage }} />
        <Text style={styles.textError}>No favorite places at the moment</Text>
      </View>
    );
  } else {
    content = (
      <View style={styles.errorBox}>
        <Image style={styles.image} source={{ uri: errorImage }} />
        <Text style={styles.textError}>Connection required</Text>
      </View>
    );
  }

  // Affiche/Masque checkbox
  const handlePlanMyDay = () => {
    setCheckBtn(!checkBtn);
    setModalVisible(!modalVisible);
    setPlanBtnVisible(!planBtnVisible);
    isPlanDay ? setIsPlanDay(false) : setIsPlanDay(true);
    setActivePopupId(null);
    setCheckedStates([]);
  };

  // Check ou uncheck les boxs
  const toggleCheckbox = (index) => {
    const updatedStates = [...checkedStates];
    updatedStates[index] = !updatedStates[index];
    setCheckedStates(updatedStates);
  };

  // Création des markers cochés sur la carte
  let placesMarker;
  if (placesLikedList && placesLikedList.length > 0) {
    placesMarker = placesLikedList
      .filter((_, i) => checkedStates[i])
      .map((place, i) => (
        <Marker key={i} coordinate={{ latitude: place.coords.lat, longitude: place.coords.lon }} image={moviePlace || null} />
      ));
  }

  // Gestion de la hauteur de la scrollview pour qu'elle reste accessible si modale ouverte
  const scrollViewHeight = !modalVisible ? "73.3%" : "31%";

  const goToMap = () => {
    if (placesLikedList && checkedStates.includes(true)) {
      const selectedPlaces = placesLikedList.filter((_, i) => checkedStates[i]);
      const originCoords = currentPosition
        ? { lat: currentPosition.latitude, lon: currentPosition.longitude }
        : { lat: 40.772087, lon: -73.973159 };

      // Fonction pour calculer la distance entre deux points (latitude/longitude)
      const calculateDistance = (coord1, coord2) => {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(coord2.lat - coord1.lat);
        const dLon = toRad(coord2.lon - coord1.lon);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Tri des lieux checkés en fonction de leur distance par rapport à la position initiale
      const sortedPlaces = selectedPlaces.sort(
        (a, b) => calculateDistance(originCoords, a.coords) - calculateDistance(originCoords, b.coords)
      );

      // Point de départ si géolocalisé ou pas
      const origin = currentPosition ? `${currentPosition.latitude},${currentPosition.longitude}` : `40.772087,-73.973159`;

      // Lieu le plus éloigné
      const destination = `${sortedPlaces[sortedPlaces.length - 1].coords.lat},${sortedPlaces[sortedPlaces.length - 1].coords.lon}`;

      // Etapes
      const waypoints = sortedPlaces
        .slice(0, -1) // On retire le dernier car c'est la destination
        .map((place) => `${place.coords.lat},${place.coords.lon}`)
        .join("|");

      // Lien Google Maps
      const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
      const iosUrl = `comgooglemaps://?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;

      if (Platform.OS === "ios") {
        Linking.canOpenURL("comgooglemaps://").then((supported) => {
          if (supported) {
            Linking.openURL(iosUrl);
          } else {
            Linking.openURL(webUrl); // Rediriger vers le lien web
          }
        });
      } else if (Platform.OS === "android") {
        Linking.openURL(webUrl);
      }
    } else {
      Alert.alert("No place selected", "Please select at least one place to plan your day.");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="My Favorites" showInput={false} />
      <View style={[styles.favouritesScreenContainer, { height: scrollViewHeight }]}>
        {placesLikedList && placesLikedList.length > 0 && planBtnVisible && (
          <TouchableOpacity style={styles.button} onPress={() => handlePlanMyDay()}>
            <Text style={styles.txtButton}>Plan my day !</Text>
          </TouchableOpacity>
        )}
        <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView>
      </View>

      {modalVisible && (
        <View style={styles.modalBackground}>
          <View style={styles.modalView}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={() => goToMap()}>
                <Text style={styles.txtButton}>Go to maps!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => handlePlanMyDay()}>
                <Text style={styles.txtButton}>X</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mapContainer}>
              <MapView
                initialRegion={{
                  latitude: 40.772087,
                  longitude: -73.973159,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                style={styles.map}
              >
                <Marker
                  // marker "en dur" pour localisation de l'utilisateur dans central park si pas à new york
                  coordinate={
                    currentPosition
                      ? { latitude: currentPosition.latitude, longitude: currentPosition.longitude }
                      : { latitude: 40.772087, longitude: -73.973159 }
                  }
                  image={manWalking || null}
                  style={{ width: 5, height: 5 }} // Ne fonctionne pas
                />
                {placesMarker}
              </MapView>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  favouritesScreenContainer: {
    marginTop: 200,
    paddingTop: 5,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#001F3F",
    width: 100,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
  },
  txtButton: {
    color: "#DEB973",
    textAlign: "center",
    fontWeight: 600,
  },
  modalBackground: {
    alignItems: "center",
    marginBottom: 50,
  },
  modalView: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "white",
    width: "95%",
    height: "77%",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderColor: "#282C37",
    borderWidth: 2,
    padding: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    height: "10%",
  },
  closeButton: {
    height: 30,
    width: 30,
    marginLeft: 70,
    backgroundColor: "#001F3F",
    borderRadius: 20,
    justifyContent: "center",
  },
  mapContainer: {
    width: "100%",
    height: "66%",
    borderWidth: 1,
  },
  map: {
    flex: 1,
  },
  cardLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    backgroundColor: "white", // Couleur de fond pour mieux voir
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#001F3F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  errorBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  textError: {
    top: 50,
    position: "absolute",
    textAlign: "center",
    width: Dimensions.get("window").width - 120,
    fontSize: 24,
    fontWeight: 600,
    color: "#282C37",
    fontFamily: "JosefinSans-SemiBold",
  },
  image: {
    position: "relative",
    width: Dimensions.get("window").width - 50,
    height: Dimensions.get("window").height - 250,
    resizeMode: "contain",
  },
});
