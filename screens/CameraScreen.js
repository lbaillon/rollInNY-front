import { useState, useEffect, useRef } from "react";
import { StyleSheet, View, TouchableOpacity, Platform, Alert } from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { addPicture } from "../reducers/pictures";

import { useIsFocused, useNavigation } from "@react-navigation/native";
import { CameraView, Camera } from "expo-camera";

import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"; // Import pour les icons
import { faXmark, faO, faRotate, faBolt } from "@fortawesome/free-solid-svg-icons"; // Import pour les icons

export default function CameraScreen({ route }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const cameraRef = useRef(null);

  const selectedPlace = route.params?.selectedPlace;
  const user = useSelector((state) => state.user.value);

  const [hasPermission, setHasPermission] = useState(false); // État pour gérer la permission de la caméra
  const [facing, setFacing] = useState("back"); // État pour gérer la caméra frontale ou arrière
  const [flash, setFlash] = useState(false); // État pour gérer le flash
  const [isCapturing, setIsCapturing] = useState(false); // État pour gérer la prise de photo

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert("Permission denied", "Access to camera is required to take photos");
      }
    })();

    setFacing("back");
    setFlash(false);
  }, []);

  // Si l'utilisateur n'a pas donné la permission ou si l'écran n'est pas focus, on ne rend rien
  if (!hasPermission || !isFocused) {
    return <View />;
  }

  const takePicture = async () => {
    if (isCapturing || !cameraRef.current) return;
  
    try {
      setIsCapturing(true);
  
      const photo = await cameraRef.current.takePictureAsync({
        quality: Platform.OS === "android" ? 0.5 : 0.3,
        exif: false,
        skipProcessing: Platform.OS === "android",
      });
  
      // Redimensionner l'image avant d'envoyer
      const { width, height } = photo; // Récupération des dimensions de la photo
      const aspectRatio = width / height;
      const newWidth = 400;
      const newHeight = newWidth / aspectRatio;
  
      const resizedPhoto = {
        ...photo,
        width: newWidth,
        height: newHeight,
      };
  
      // Rediriger après la prise de photo sur l'écran Memories
      navigation.reset({ index: 0, routes: [{ name: "Memories", params: { selectedPlace } }] });
  
      // Si la photo est valide
      if (resizedPhoto?.uri) {
        const formData = new FormData();
  
        formData.append("photoFromFront", {
          uri: resizedPhoto.uri,
          name: resizedPhoto.uri.split("/").pop(),
          type: "image/jpeg",
        });
  
        formData.append("userToken", user.token);
        formData.append("idPlace", route.params.selectedPlace.id);
  
        try {
          const response = await fetch("https://roll-in-new-york-backend.vercel.app/favorites/pictures", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          dispatch(addPicture(data.url));
        } catch(err) {
          console.error("❌ (Camera Screen): Error in post picture in cloudinary", err);
          Alert.alert("Error !", "An internal error occurred while uploading picture.");
        }
      }
    } catch (err) {
      console.error("❌ (Camera Screen): Error in taking picture", err);
      Alert.alert("Error !", "An internal error occurred while taking picture.");
    } finally {
      setIsCapturing(false);
    }
  };
  
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === false ? true : false));
  };

  const handleClose = () => {
    navigation.reset({ index: 0, routes: [{ name: "Memories", params: { selectedPlace } }] });
  };

  return (
    <>
      <CameraView
        style={styles.camera}
        facing={facing}
        enableTorch={flash}
        ref={(ref) => { cameraRef.current = ref }}
        photo={true}
      >
        <View style={styles.cameraContainer}>
          <View style={styles.cameraHeader}>
            <View style={styles.cameraHeaderLeft}>
              <TouchableOpacity onPress={() => toggleCameraFacing()}>
                <FontAwesomeIcon icon={faRotate} size={40} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleFlash()}>
                <FontAwesomeIcon icon={faBolt} size={40} color="white" />
              </TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity onPress={() => handleClose()}>
                <FontAwesomeIcon icon={faXmark} size={40} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View>
            <TouchableOpacity onPress={() => takePicture()}>
              <FontAwesomeIcon icon={faO} size={100} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </>
  );
}

// Définition du style des différents éléments
const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cameraHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    marginTop: 30,
  },
  cameraHeaderLeft: {
    width: "30%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
