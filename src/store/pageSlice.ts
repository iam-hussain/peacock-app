import { createSlice } from "@reduxjs/toolkit";

export const pageSlice = createSlice({
  name: "page",
  initialState: {
    sideBarOpen: false,
    sideBarCollapsed: false,
    modalOpen: false,
    isLoggedIn: false, // Add isLoggedIn state
  },
  reducers: {
    openSideBar: (state) => {
      state.sideBarOpen = !state.sideBarOpen;
    },
    toggleSideBarCollapse: (state) => {
      state.sideBarCollapsed = !state.sideBarCollapsed;
    },
    openModal: (state) => {
      state.modalOpen = !state.modalOpen;
    },
    setIsLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
  },
});

export const { openSideBar, toggleSideBarCollapse, openModal, setIsLoggedIn } = pageSlice.actions;

export default pageSlice.reducer;
