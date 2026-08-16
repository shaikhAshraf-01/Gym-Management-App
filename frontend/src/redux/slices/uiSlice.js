import { createSlice } from "@reduxjs/toolkit";

// Mobile "Add" bottom-sheet / drawer ka open state yaha track hota hai.
// Isse BackButtonHandler ko pata chal jaata hai ki hardware back dabane par
// drawer close karna hai ya normal route history mein piche jaana hai.
const uiSlice = createSlice({
  name: "ui",
  initialState: {
    isDrawerOpen: false,
  },
  reducers: {
    openDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    closeDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
  },
});

export const { openDrawer, closeDrawer, toggleDrawer } = uiSlice.actions;
export default uiSlice.reducer;