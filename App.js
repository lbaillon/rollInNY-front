import { useEffect } from "react";
import { StyleSheet } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Provider, useDispatch, useSelector } from "react-redux";
import movie, { addMovie, removeAllMovies } from "./reducers/movies";
import user from "./reducers/users";
import favorite from "./reducers/favorites";
import picture from "./reducers/pictures";

import { AppProvider } from "./provider/AppProvider";
import HomeScreen from "./screens/HomeScreen";
import FavouriteScreen from "./screens/FavouriteScreen";
import SearchScreen from "./screens/SearchScreen";
import LoginScreen from "./screens/LoginScreen";
import MemoriesScreen from "./screens/MemoriesScreen";
import ReviewsScreen from "./screens/ReviewsScreen";
import CameraScreen from "./screens/CameraScreen";

import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHouse, faHeart, faMagnifyingGlass, faUser } from "@fortawesome/free-solid-svg-icons";
import ToastManager from "toastify-react-native"; // Import pour les notifications

const Tab = createBottomTabNavigator();

const reducers = combineReducers({ user, movie, favorite, picture });
const persistConfig = { key: "Roll-In-NewYork", storage: AsyncStorage, blacklist:['movie', 'favorite', 'picture'] };

const store = configureStore({
  reducer: persistReducer(persistConfig, reducers),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

const persistor = persistStore(store);

export default function App() { 
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <ToastManager />
        <NavigationContainer>
          <AppProvider>
            <TabNavigator />
          </AppProvider>
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}

function TabNavigator() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  // UseEffect permettant de fetcher les films et de les ajouter au store au lancement de l'application.
  useEffect(() => {
    dispatch(removeAllMovies()); // Vidage du store au lancement de l'application avant le re remplissage pour des raisons de permformances
    let allMoviesId = [];
    fetch("https://roll-in-new-york-backend.vercel.app/places/")
      .then((response) => response.json())
      .then((data) => {
        data.places.forEach((place) => {
          place.moviesList.forEach((movie) => {
            if (!allMoviesId.includes(movie)) {
              allMoviesId.push(movie);
            }
          });
        });
        allMoviesId.map((movieId) => {
          try {
            fetch('https://roll-in-new-york-backend.vercel.app/movies/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({movieId: movieId}),
            })
            .then((res) => res.json())
            .then(data => {
              if (data.movie.original_title && data.movie.poster_path) {
                dispatch(
                  addMovie({
                    id: movieId,
                    title: data.movie.original_title,
                    poster_path: data.movie.poster_path,
                    overview: data.movie.overview,
                    release_date: data.movie.release_date,
                  })
                );
              }
            })
          } catch(err) {
            console.error("❌ (App): Error in connection to database", err);
          }
        });
      });
  }, []);

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName = "";

        switch (route.name) {
          case "Home":
            iconName = faHouse;
            break;
          case "Favourite":
            iconName = faHeart;
            break;
          case "Search":
            iconName = faMagnifyingGlass;
            break;
          case user.username === null ? "Login" : user.username:
            iconName = faUser;
            break;
        }

        return <FontAwesomeIcon style={styles.navIcon} icon={iconName} size={size} color={color} />;
      },
      tabBarStyle: styles.navbar,
      tabBarActiveTintColor: "#DEB973",
      tabBarInactiveTintColor: "#a39374",
      headerShown: false,
    })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Favourite" component={FavouriteScreen} />
      <Tab.Screen name={user.username === null ? "Login" : user.username} component={LoginScreen} />
      <Tab.Screen name="Memories" component={MemoriesScreen} options={{tabBarButton: () => null}} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} options={{tabBarButton: () => null}} />
      <Tab.Screen name="Camera" component={CameraScreen} options={{tabBarButton: () => null, tabBarStyle: { display: 'none' }}} />
    </Tab.Navigator>
  );
  // tabBarButton: () => null => Permet de cacher le bouton de navigation
  // tabBarStyle: { display: 'none' } => Permet de cacher la barre de navigation
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: "#001F3F",
  },
});
