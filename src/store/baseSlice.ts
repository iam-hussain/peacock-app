import { MembersSelectResponse } from "@/actions/member-select";
import { VendorsSelectResponse } from "@/actions/vendor-select";
import { MemberResponse } from "@/app/api/members/route";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PageState {
  membersSelect: MembersSelectResponse[];
  vendorsSelect: VendorsSelectResponse[];
}

const initialState: PageState = {
  membersSelect: [],
  vendorsSelect: [],
};

export const pageSlice = createSlice({
  name: "base",
  initialState,
  reducers: {
    membersSelect: (
      state,
      { payload }: PayloadAction<MembersSelectResponse[]>
    ) => {
      state.membersSelect = payload;
    },
    vendorsSelect: (
      state,
      { payload }: PayloadAction<VendorsSelectResponse[]>
    ) => {
      state.vendorsSelect = payload;
    },
  },
});

export const { membersSelect, vendorsSelect } = pageSlice.actions;

export default pageSlice.reducer;
