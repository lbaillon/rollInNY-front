const { createSlice } = require("@reduxjs/toolkit");

const initialState = {
  value: "",
};

export const favoriteSlice = createSlice({
  name: "favorite",
  initialState,
  reducers: {
    addPlaceToFavorites: (state, action) => {
      state.value = action.payload;
    },
    removePlaceToFavorites: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { addPlaceToFavorites, removePlaceToFavorites } = favoriteSlice.actions;
export default favoriteSlice.reducer;
