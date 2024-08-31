import { createSlice } from "@reduxjs/toolkit";

export const pageSlice = createSlice({
  name: "page",
  initialState: {
    sideBarOpen: false,
    modalOpen: false,
    isLoggedIn: false, // Add isLoggedIn state
  },
  reducers: {
    openSideBar: (state) => {
      state.sideBarOpen = !state.sideBarOpen;
    },
    openModal: (state) => {
      state.modalOpen = !state.modalOpen;
    },
    setIsLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
  },
});

export const { openSideBar, openModal, setIsLoggedIn } = pageSlice.actions;

export default pageSlice.reducer;
