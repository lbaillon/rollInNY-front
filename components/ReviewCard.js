import { StyleSheet, View, Text, Dimensions } from "react-native";

import { useFonts } from "expo-font";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

export default function ReviewCard(props) {
  useFonts({"JosefinSans-Bold": require("../assets/fonts/JosefinSans-Bold.ttf")});

  //formatage de la date de création de l'avis
  let date = props.date;
  const [year, month, day] = date.split("T")[0].split("-");
  const formatedDate = `${month}/${day}/${year}`;

  return (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <View style={styles.userContainer}>
          <Text style={styles.user} numberOfLines={2}>
            {props.userName}
          </Text>
          <FontAwesomeIcon icon={faStar} size={12} color="#DEB973" />
          <Text>{props.note}/5</Text>
        </View>
        <Text>{formatedDate}</Text>
        <Text style={styles.content} numberOfLines={3}>
          {props.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: Dimensions.get("window").width - 50,
    height: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: "#282C37",
    backgroundColor: "white",
    paddingHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
  },
  textContainer: {
    width: "100%",
    paddingVertical: 5,
    justifyContent: "flex-start",
    marginBottom: 5,
    height: "100%",
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 1,
  },
  user: {
    fontSize: 18,
    fontFamily: "JosefinSans-Bold",
    flex: 1,
    color: "black",
    marginRight: 8,
  },
  content: {
    fontSize: 12,
    color: "black",
    marginTop: 5,
  },
});
