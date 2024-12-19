import { useState } from "react";
import { StyleSheet, View, Text, TouchableWithoutFeedback, TouchableOpacity, TextInput, Image, Alert,} from "react-native";

import { useDispatch } from "react-redux";
import { login } from "../reducers/users";

import { Toast } from "toastify-react-native";

const tower = "https://res.cloudinary.com/dtkac5fah/image/upload/v1734427451/appIcons/umtepna0xmfeki5tffxw.webp";

export default function SignUp({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [username, setUsername] = useState(""); // Initialisation de l'état username pour stocker le nom de l'utilisateur
  const [email, setEmail] = useState(""); // Initialisation de l'état email pour stocker l'email de l'utilisateur
  const [password, setPassword] = useState(""); // Initialisation de l'état password pour stocker le mot de passe de l'utilisateur
  const [confirmPassword, setConfirmPassword] = useState(""); // Initialisation de l'état confirmPassword pour stocker la confirmation du mot de passe de l'utilisateur
  const [error, setError] = useState(false, ""); // Initialisation de l'état error pour gérer les erreurs
  const [errorMessage, setErrorMessage] = useState(""); // Initialisation de l'état errorMessage pour stocker le message d'erreur

  if (!isOpen) {
    // Condition pour dire que si la modale n'est pas ouverte, on ne retourne rien ce qui empeche l'ouverture automatique depuis la page LoginScreen.js
    return null;
  }

  const handleSubmit = async () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex pour vérifier que l'email est valide
    if (username === "" || email === "" || password === "") { // Condition pour dire que si les champs sont vides
      setError(true);
      setErrorMessage("Please complete all fields");
      return;
    } else if (!regex.test(email)) { // Condition pour dire que si l'email n'est pas valide
      setError(true);
      setErrorMessage("Invalid email address");
      return;
    } else if (password !== confirmPassword) { // Condition pour dire que si les mots de passe ne correspondent pas
      setError(true);
      setErrorMessage("Passwords don't match");
    } else {
      setError(false);
      setErrorMessage("");
    }

    try {
      let response = await fetch("https://roll-in-new-york-backend.vercel.app/users/signup/classic",{
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            email: email,
            password: confirmPassword,
          }),
        }
      );

      if (response.ok) {
        let data = await response.json();
        if (data.result === true) {
          Toast.success("Account created !", "top", { duration: 2000 });
          dispatch(login({ username: data.username, email: data.email, token: data.token, id: data.id })); // On envoie les données de l'utilisateur dans le store
          onClose();
          setUsername("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        } else {
          Toast.error("Connexion failed !", "top", { duration: 2000 });
          return;
        }
      } else {
        console.error("❌ (SignUp): Error in response of request", response);
        return;
      }
    } catch (err) {
      console.error("❌ (SignUp): Error in database connection", err);
      Alert.alert("Error !", "An internal error occurred while creating account.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modal}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.container}>
              <View style={styles.titleContainer}>
                <Image source={{ uri: tower }} height={70} width={40} style={styles.logo}/>
                <Text style={styles.title}>Connexion</Text>
              </View>
              {error && <Text style={styles.error}>{errorMessage}</Text>}
              <View style={styles.inputContainer}>
                <TextInput style={styles.inputText} placeholder="Name" onChangeText={(value) => setUsername(value)} value={username}/>
                <TextInput style={styles.inputText} placeholder="Email" onChangeText={(value) => setEmail(value)} value={email}/>
                <TextInput style={styles.inputText} placeholder="Password" secureTextEntry={true} onChangeText={(value) => setPassword(value)} value={password}/>
                <TextInput style={styles.inputText} placeholder="Confirm password" secureTextEntry={true} onChangeText={(value) => setConfirmPassword(value)} value={confirmPassword}/>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleSubmit()} style={styles.button} activeOpacity={0.8}>
              <Text style={styles.textButton}>SIGN-UP</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#001F3F",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  container: {
    width: "100%",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    resizeMode: "contain",
    marginRight: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
  },
  inputContainer: {
    width: "100%",
  },
  inputText: {
    height: 50,
    borderWidth: 2,
    borderColor: "#001F3F",
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    marginTop: 20,
    height: 50,
    width: "80%",
    backgroundColor: "#001F3F",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  textButton: {
    color: "#DEB973",
    fontWeight: "bold",
  },
  error: {
    marginTop: 10,
    color: "red",
  },
});
