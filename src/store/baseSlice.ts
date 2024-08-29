import { membersSelect, MembersSelectResponse } from "@/actions/member-select";
import { vendorsSelect, VendorsSelectResponse } from "@/actions/vendor-select";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

type MembersState = {
  members: MembersSelectResponse;
  vendors: VendorsSelectResponse;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: MembersState = {
  members: [],
  vendors: [],
  status: "idle",
  error: null,
};

// Async thunk for fetching members
export const fetchMembers = createAsyncThunk(
  "members/fetchMembers",
  async () => {
    const response = await membersSelect();
    return response;
  }
);

// Async thunk for fetching vendors
export const fetchVendors = createAsyncThunk(
  "vendors/fetchVendors",
  async () => {
    const response = await vendorsSelect();
    return response;
  }
);

const pageSlice = createSlice({
  name: "page",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch members";
      })
      .addCase(fetchVendors.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.vendors = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch vendors";
      });
  },
});

export default pageSlice.reducer;
