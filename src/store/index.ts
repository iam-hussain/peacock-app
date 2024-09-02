import { configureStore } from "@reduxjs/toolkit";

import pageReducer from "./pageSlice";

export const store = configureStore({
  reducer: {
    page: pageReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
