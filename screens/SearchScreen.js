import React, { useState, useEffect } from "react";
import { StyleSheet, View, FlatList, Dimensions, TouchableOpacity, Text, Platform, Linking, Image } from "react-native";

import { useSelector } from "react-redux";

import {useFocusEffect } from "@react-navigation/native";
import { Marker } from "react-native-maps";
import MapView from "react-native-maps";

import Header from "../components/Header";
import PlaceCard from "../components/PlaceCard";
import MovieCard from "../components/MovieCard";

import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useFonts } from "expo-font";

const moviePlace = "https://res.cloudinary.com/dtkac5fah/image/upload/v1733818367/appIcons/csasdedxqkqyj29vzk36.png";
const errorImage = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734516235/teflem0cocn53iqsvier.webp"

export default function SearchScreen({ route, navigation }) {
  useFonts({"JosefinSans-SemiBold": require("../assets/fonts/JosefinSans-SemiBold.ttf"),});
  
  const favorite = useSelector((state) => state.favorite.value)

  const [currentIndex, setCurrentIndex] = useState(0); // État pour stocker l'index de la card lieux actuelle
  const [allPlaces, setAllPlaces] = useState([]); // Etat pour stocker tout les lieux
  const [placeCoords, setPlaceCoords] = useState({}); // Etat pour stocker les coordonnées du lieux affiché dans le carrousel
  const [refreshKey, setRefreshKey] = useState(0); // Etat pour rafrachir la page

  //useFocusEffect met à jour la refreshKey à chaque fois qu'on arrive sur SearchScreen
  //la refreshKey est ajoutée à l'id de la placeCard pour forcer le rerender avec la note à jour
  useFocusEffect(
    React.useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

  // useEffect pour fetch tout les lieux
  useEffect(() => {
    try {
      fetch("https://roll-in-new-york-backend.vercel.app/places")
        .then((response) => response.json())
        .then((data) => {
          setAllPlaces(data.places);
        })
        .catch((err) => console.error('❌ (SearchScreen) Error to fetch all places', err));
    } catch(err) {
      console.error('❌ (SearchScreen) Error in connection database', err);
    }
  }, [favorite]);

  let movieCard;
  let moviePlaces;
  if (route.params === undefined) {
    movieCard = (
          <View style={styles.errorBox}>
            <Image
              style={styles.image}
              source={{ uri: errorImage }}
            />
            <Text style={styles.textError}>Search a movie!</Text>
          </View>
        )
  } else {
    // récupération des info du film cliqué en page d'accueil
    const { selectedMovie } = route.params;
    movieCard = (
      <MovieCard
        title={selectedMovie.title}
        poster={selectedMovie.poster_path}
        overview={selectedMovie.overview}
        date={selectedMovie.release_date}
      />
    );

    moviePlaces = allPlaces.filter((place) => place.moviesList.includes(selectedMovie.id));
  }

  // useEffect pour mettre à jour les coordonnées du marqueur du lieu affiché sur la map
  useEffect(() => {
    if (moviePlaces && moviePlaces[currentIndex]) {
      setPlaceCoords(moviePlaces[currentIndex].coords);
    }
  }, [currentIndex, moviePlaces]);

  // Fonction pour passer à la card du lieu suivant
  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % moviePlaces.length;
    setCurrentIndex(nextIndex);
  };

  // Fonction pour passer à la card du lieu précédent
  const goToPrevious = () => {
    const prevIndex = (currentIndex - 1 + moviePlaces.length) % moviePlaces.length;
    setCurrentIndex(prevIndex);
  };

  function goToMap(placeCoords) {
    const { lat: destLat, lon: destLon } = placeCoords;

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${destLat},${destLon}`;
    const iosUrl = `comgooglemaps://?q=${destLat},${destLon}&center=${destLat},${destLon}`;
    const androidUrl = `geo:${destLat},${destLon}?q=${destLat},${destLon}`;

    if (Platform.OS === "ios") {
      Linking.canOpenURL("comgooglemaps://").then((supported) => {
        if (supported) {
          Linking.openURL(iosUrl);
        } else {
          Linking.openURL(webUrl); // Rediriger vers le lien web si Google Maps n'est pas disponible
        }
      });
    } else if (Platform.OS === "android") {
      Linking.canOpenURL(androidUrl).then((supported) => {
        if (supported) {
          Linking.openURL(androidUrl);
        } else {
          Linking.openURL(webUrl); // Rediriger vers le lien web si Google Maps n'est pas disponible
        }
      });
    }
  }

  return (
    <>
      <View style={styles.container}>
        <Header title="Roll-In NewYork" showInput={true} navigation={navigation} />
        <View style={styles.searchScreenContainer}>
          {movieCard}
          {moviePlaces && moviePlaces.length > 0 ? (
            <>
              <View style={styles.carouselWrapper}>
                <TouchableOpacity onPress={goToPrevious} style={styles.navigationButtonLeft}>
                  <FontAwesomeIcon icon={faChevronLeft} size={20} color="black" />
                </TouchableOpacity>
                <FlatList // Affichage du carrousel
                  data={moviePlaces}
                  horizontal // Indication de l'affichage horizontal
                  renderItem={(
                    { item, index } // Affichage des éléments du carrousel
                  ) =>
                    index === currentIndex ? ( // Si l'index de l'élément est égal à l'index actuel alors on affiche la card
                      <View style={styles.cardWrapper}>
                        <PlaceCard
                          key={`${item._id}-${refreshKey}`}
                          id={item._id}
                          image={item.placePicture}
                          title={item.title}
                          description={item.overview}
                          navigation={navigation}
                        />
                      </View>
                    ) : null
                  }
                  keyExtractor={(item) => item._id} // Assurez-vous que chaque élément a un id unique
                  showsHorizontalScrollIndicator={false} // Désactivation de la barre de défilement horizontale
                  snapToInterval={Dimensions.get("window").width} // Défilement d'une card à la fois
                  contentContainerStyle={{
                    justifyContent: "center",
                  }} // Centrage des éléments du carrousel
                />
                <TouchableOpacity onPress={goToNext} style={styles.navigationButtonRight}>
                  <FontAwesomeIcon icon={faChevronRight} size={20} color="black" />
                </TouchableOpacity>
              </View>
              <View style={styles.pagination}>
                {moviePlaces.map((_, index) => (
                  <View key={index} style={[styles.pageLine, currentIndex === index && styles.activePageLine]} />
                ))}
              </View>
              <TouchableOpacity style={styles.button} onPress={() => goToMap(placeCoords)}>
                <Text style={styles.textButton}>Go to maps!</Text>
              </TouchableOpacity>
              <View style={styles.mapContainer}>
                <MapView
                  region={{
                    latitude: placeCoords.lat,
                    longitude: placeCoords.lon,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  style={styles.map}
                >
                  <Marker
                    coordinate={{
                      latitude: placeCoords.lat,
                      longitude: placeCoords.lon,
                    }}
                    image={moviePlace || null}
                  ></Marker>
                </MapView>
              </View>
            </>
          ) : (
            <></>
          )}
        </View>
      </View>
    </>
  );
}

// Définition du style des différents éléments
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchScreenContainer: {
    flex: 1,
    marginTop: 200,
    paddingTop: 5,
    alignItems: "center",
  },
  carouselWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardWrapper: {
    width: Dimensions.get("window").width,
    justifyContent: "center",
    alignItems: "center",
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  pageLine: {
    width: 30,
    height: 4,
    backgroundColor: "#ccc",
    marginVertical: 1,
    marginHorizontal: 5,
    borderRadius: 2,
  },
  activePageLine: {
    backgroundColor: "#001F3F",
  },
  navigationButtonLeft: {
    position: "absolute",
    left: 8,
    zIndex: 1,
    padding: 1,
    borderRadius: 20,
  },
  navigationButtonRight: {
    position: "absolute",
    right: 8,
    zIndex: 1,
    padding: 1,
    borderRadius: 20,
  },
  searchMovie: {
    fontSize: 24,
    color: "#282C37",
    fontWeight: 600,
    marginTop: 50,
  },
  button: {
    backgroundColor: "#001F3F",
    width: "30%",
    height: "6%",
    borderRadius: 20,
    justifyContent: "center",
    margin: 5,
  },
  textButton: {
    color: "#DEB973",
    textAlign: "center",
  },
  mapContainer: {
    width: "100%",
    height: "52%",
    borderTopColor: "#282C37",
    borderTopWidth: 2,
  },
  map: {
    flex: 1,
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
    fontFamily: "JosefinSans-SemiBold"
  },
  image: {
    position: "relative",
    width: Dimensions.get("window").width - 50,
    height: Dimensions.get("window").height - 250,
    resizeMode: "contain",
  },
});
