import { createSlice } from "@reduxjs/toolkit";

export const pageSlice = createSlice({
  name: "page",
  initialState: {
    sideBarOpen: false,
    modalOpen: false,
  },
  reducers: {
    openSideBar: (state) => {
      state.sideBarOpen = !state.sideBarOpen;
    },
    openModal: (state) => {
      state.modalOpen = !state.modalOpen;
    },
  },
});

export const { openSideBar, openModal } = pageSlice.actions;

export default pageSlice.reducer;
