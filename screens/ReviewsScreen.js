import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";

import Header from "../components/Header";
import ReviewCard from "../components/ReviewCard";
import PlaceCard from "../components/PlaceCard";

export default function ReviewsScreen({ route, navigation }) {
  const { placeInfo } = route.params; //récupération des info du lieu cliqué

  const [reviewsTable, setReviewsTable] = useState([]); //initialisation du tableau des avis à afficher

  // fetch des avis du lieu
  useEffect(() => {
    try {
      fetch(`https://roll-in-new-york-backend.vercel.app/reviews/${placeInfo.id}`)
        .then((response) => response.json())
        .then((data) => {
          setReviewsTable(data.reviews);
        });
    } catch(err) {
      console.error("❌ (Reviews Screen): Error in connection to database", err);
    }

    //lorsqu'on quitte la page on reset le tableau d'avis à un tableau vide
    return () => {
      setReviewsTable([]);
    };
  }, [placeInfo]);

  const reviews = reviewsTable.map((data, i) => {
    return (
      <ReviewCard
        key={`reviewCardId: ${i}`}
        userName={data.user.username}
        date={data.createdAt}
        note={data.note}
        content={data.content}
      />
    );
  });

  return (
    <View style={styles.container}>
      <View>
        <Header title="Reviews" showInput={false} navigation={navigation} />
      </View>
      <View style={styles.reviewsContainer}>
        <PlaceCard
          id={`${placeInfo.id}`}
          image={placeInfo.image}
          title={placeInfo.title}
          description={placeInfo.description}
          navigation={navigation}
        />
        <View style={{ flex: 1, marginTop: 10 }}>
          <ScrollView>{reviews}</ScrollView>
        </View>
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
  reviewsContainer: {
    flex: 1,
    marginTop: 200,
    paddingTop: 5,
    alignItems: "center",
  },
});
