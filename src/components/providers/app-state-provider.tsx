"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
} from "react";

// State shape (matches the old Redux pageSlice)
export type AppState = {
  sideBarOpen: boolean;
  sideBarCollapsed: boolean;
  modalOpen: boolean;
  isLoggedIn: boolean;
};

// Action types
type AppAction =
  | { type: "OPEN_SIDEBAR" }
  | { type: "TOGGLE_SIDEBAR_COLLAPSE" }
  | { type: "OPEN_MODAL" }
  | { type: "SET_IS_LOGGED_IN"; payload: boolean };

const initialState: AppState = {
  sideBarOpen: false,
  sideBarCollapsed: false,
  modalOpen: false,
  isLoggedIn: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "OPEN_SIDEBAR":
      return { ...state, sideBarOpen: !state.sideBarOpen };
    case "TOGGLE_SIDEBAR_COLLAPSE":
      return { ...state, sideBarCollapsed: !state.sideBarCollapsed };
    case "OPEN_MODAL":
      return { ...state, modalOpen: !state.modalOpen };
    case "SET_IS_LOGGED_IN":
      return { ...state, isLoggedIn: action.payload };
    default:
      return state;
  }
}

// Action creators (mirror the old Redux action creators)
export const openSideBar = (): AppAction => ({ type: "OPEN_SIDEBAR" });
export const toggleSideBarCollapse = (): AppAction => ({
  type: "TOGGLE_SIDEBAR_COLLAPSE",
});
export const openModal = (): AppAction => ({ type: "OPEN_MODAL" });
export const setIsLoggedIn = (payload: boolean): AppAction => ({
  type: "SET_IS_LOGGED_IN",
  payload,
});

// Context type
type AppStateContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

const AppStateContext = createContext<AppStateContextType | null>(null);

// Custom hook to access the context
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

// Provider component
export default function AppStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
