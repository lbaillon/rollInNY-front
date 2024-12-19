import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: [],
};

export const pictureSlice = createSlice({
  name: "picture",
  initialState,
  reducers: {
    addPicture: (state, action) => {
      state.value.push(action.payload);
    },
    removePicture: (state, action) => {
      state.value.filter((picture) => picture.id !== action.payload.id);
    },
    removeAllPictures: (state) => {
      state.value = [];
    },
  },
});

export const { addPicture, removePicture, removeAllPictures } = pictureSlice.actions;
export default pictureSlice.reducer;
