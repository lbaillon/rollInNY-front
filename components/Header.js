import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Dimensions, Text, ImageBackground } from "react-native";

import { Asset } from "expo-asset"; // Import pour le préchargement d'assets
import { useFonts } from "expo-font";
import SearchInput from "./SearchInput";

const backgroundUri = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734427300/appIcons/qcfodpqgcxpddjjrzxvm.webp";
const towerUri = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734427451/appIcons/umtepna0xmfeki5tffxw.webp";

export default function Header({ title, showInput, navigation }) {
  const [imagesLoaded, setImagesLoaded] = useState(false); // État pour gérer le chargement des images
  useFonts({ "JosefinSans-SemiBold": require("../assets/fonts/JosefinSans-SemiBold.ttf") });

  useEffect(() => {
    const loadAssets = async () => {
      // Précharger les images
      await Asset.loadAsync([backgroundUri, towerUri]);
      setImagesLoaded(true);
    };

    loadAssets();
  }, []);

  if (!imagesLoaded) {
    return null;
  }

  return (
    <ImageBackground style={styles.background} source={{ uri: backgroundUri }}>
      <View style={styles.titleContainer}>
        <Image style={styles.logo} height={50} width={40} source={{ uri: towerUri }} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {showInput && (
        <View style={styles.input}>
          <SearchInput navigation={navigation} />
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    width: Dimensions.get("window").width,
    height: 200,
    position: "absolute",
    resizeMode: "cover",
  },
  titleContainer: {
    flexDirection: "row",
    width: Dimensions.get("window").width,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30,
    paddingRight: 40,

  },
  logo: {
    resizeMode: "contain",
  },
  title: {
    fontFamily: "JosefinSans-SemiBold",
    fontSize: 37,
    color: "#282C37",

  },
  input: {
    alignItems: "center",
    marginTop: 50,
  },
});
