import { createSlice } from "@reduxjs/toolkit";

export const pageSlice = createSlice({
  name: "page",
  initialState: {
    sideBarOpen: false,
    topBarOpen: true,
  },
  reducers: {
    openSideBar: (state) => {
      state.sideBarOpen = !state.sideBarOpen;
    },
    openTopBar: (state) => {
      state.topBarOpen = !state.topBarOpen;
    },
  },
});

export const { openSideBar, openTopBar } = pageSlice.actions;

export default pageSlice.reducer;
