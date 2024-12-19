import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView, Linking, Platform, TouchableWithoutFeedback } from "react-native";

import { useSelector } from "react-redux";

import { Marker } from "react-native-maps";
import MapView from "react-native-maps";
import * as Location from "expo-location";

import Header from "../components/Header";
import MovieCard from "../components/MovieCard";

const manWalking = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734427710/appIcons/l0misyhittkq0v7qabx3.webp";
const moviePlace = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734427585/appIcons/oi2ry9sz9uojhzasypfv.webp";

export default function HomeScreen({ navigation }) {
  const moviesInfo = useSelector((state) => state.movie.value);

  const [places, setPlaces] = useState([]); // Initialisation du tableau de lieux à afficher sur la carte
  const [modalVisible, setModalVisible] = useState(false); // Initialisation de la modale pour afficher les informations du lieu
  const [currentPosition, setCurrentPosition] = useState({ latitude: 40.7649861, longitude: -73.9680353 }); // Initialisation des coordonnées de localisation de l'utilisateur à la position de central park
  const [placeMovies, setPlaceMovies] = useState([]); // Initialisation du tableau de films du lieu
  const [placeCoords, setPlaceCoords] = useState(); // Initialisation des coordonnées du lieu
  const mapRef = useRef(null); // Permet de fixer la position de la carte

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
        //Alert.alert("Permission denied", "Access to location is required to show your position on the map");
      }
    })();

    try {
      fetch("https://roll-in-new-york-backend.vercel.app/places")
        .then((response) => response.json())
        .then((data) => {
          setPlaces(data.places);
        });

      if (placeCoords && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: placeCoords.lat + (Platform.OS === "ios" ? 0.0058 : 0), // Ajustez le décalage selon vos besoins
            longitude: placeCoords.lon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          500
        );
      }
    } catch (err) {
      console.error("❌ (Home Screen): Error in connection to database", err);
    }
  }, [placeCoords]);

  // Mise en place des markers pour afficher les lieux sur la carte
  const placesMarker = places.map((data, i) => {
    return (
      <Marker
        key={i}
        coordinate={{ latitude: data.coords.lat, longitude: data.coords.lon }}
        title={data.title}
        description={data.address}
        image={moviePlace || null}
        onPress={() => {
          handleMarkerPressed();
          setPlaceMovies(data.moviesList);
          setPlaceCoords(data.coords);
        }}
      />
    );
  });

  const handleMarkerPressed = () => {
    setModalVisible(true);
  };

  // pour afficher les films au click sur un lieu
  const movieCards = placeMovies.map((data, i) => {
    for (let j = 0; j < moviesInfo.length; j++) {
      if (moviesInfo[j].id === data) {
        return (
          <TouchableOpacity
            key={`movieCardId: ${i}`}
            onPress={() => {
              let selectedMovie = moviesInfo[j];
              navigation.navigate("Search", { selectedMovie });
              setModalVisible(false);
            }}
          >
            <MovieCard
              title={moviesInfo[j].title}
              poster={moviesInfo[j].poster_path}
              overview={moviesInfo[j].overview}
              date={moviesInfo[j].release_date}
            />
          </TouchableOpacity>
        );
      }
    }
  });

  function goToMap(origin, destination) {
    const { latitude: originLat, longitude: originLon } = origin;
    const { lat: destLat, lon: destLon } = destination;

    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}`;
    const iosUrl = `comgooglemaps://?saddr=${originLat},${originLon}&daddr=${destLat},${destLon}`;
    const androidUrl = `google.navigation:q=${destLat},${destLon}`;

    if (Platform.OS === "ios") {
      Linking.canOpenURL("comgooglemaps://").then((supported) => {
        if (supported) {
          Linking.openURL(iosUrl);
        } else {
          Linking.openURL(webUrl); // Rediriger vers le lien web
        }
      });
    } else if (Platform.OS === "android") {
      Linking.canOpenURL(androidUrl).then((supported) => {
        if (supported) {
          Linking.openURL(androidUrl);
        } else {
          Linking.openURL(webUrl); // Rediriger vers le lien web
        }
      });
    }
  }

  function getDistanceBetweenTwoCoords(lat1, lon1, lat2, lon2) {
    // Fonction pour calculer la distance entre deux coordonnées
    const R = 6371000; // Rayon de la Terre en mètres
    const toRadians = (degree) => (degree * Math.PI) / 180; // Fonction pour convertir les degrés en radians

    const dLat = toRadians(lat2 - lat1); // Différence de latitude
    const dLon = toRadians(lon2 - lon1); // Différence de longitude
    // Formule de Haversine
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return (
    <View style={styles.container}>
      <Header title="Roll-In NewYork" showInput={true} navigation={navigation} />
      <Modal  visible={modalVisible} animationType="slide" transparent={true} >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalView}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setModalVisible(false);
                  goToMap(currentPosition, placeCoords);
                }}
              >
                <Text style={styles.textButton}>Go to maps!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.textButton}>X</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <ScrollView>{movieCards}</ScrollView>
            </View>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          // force la map à se recharger si changement dans le fetch, évite la disparition des marker
          // la key est une string avec un identifiant "map" pour le différencier des key "i" dans le place.map
          key={`map-${places.length}`}
          // focus au dessus de central park
          initialRegion={
            currentPosition &&
            places.some((place) => {
              const distance = getDistanceBetweenTwoCoords(
                currentPosition.latitude,
                currentPosition.longitude,
                place.coords.lat,
                place.coords.lon
              );
              return distance <= 30;
            })
              ? {
                  latitude: currentPosition.latitude,
                  longitude: currentPosition.longitude,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }
              : {
                  // Coordonnées par défaut si pas à New York
                  latitude: 40.772087,
                  longitude: -73.973159,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }
          }
          mapPadding={{
            top: 0,
            left: 0,
            right: 0,
            bottom: Platform.OS === "ios" ? 200 : 0, // Padding pour éviter la superposition de la modal
          }}
          style={styles.map}
        >
          <Marker
            // marker "en dur" pour localisation de l'utilisateur dans central park si pas à new york
            coordinate={
              currentPosition
                ? {
                    latitude: currentPosition.latitude,
                    longitude: currentPosition.longitude,
                  }
                : { latitude: 40.7649861, longitude: -73.9680353 }
            }
            image={manWalking || null}
          />
          {placesMarker}
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "flex-start",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 50,
  },
  modalView: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "white",
    width: "95%",
    height: "45%",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderColor: "#282C37",
    borderWidth: 2,
    padding: 10,
    marginBottom: Platform.OS === "ios" ? 28 : 0,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: "10%",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#001F3F",
    width: "30%",
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
  },
  textButton: {
    color: "#DEB973",
    textAlign: "center",
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
    height: "75%",
    marginTop: 200,
  },
  map: {
    flex: 1,
  },
});