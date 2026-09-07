import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: any | null;
  activeCompanyId: string | null;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  activeCompanyId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string; user: any }>
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    setToken: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
    },
    setActiveCompany: (state, action: PayloadAction<{ companyId: string }>) => {
      state.activeCompanyId = action.payload.companyId;
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.activeCompanyId = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout, setToken, setActiveCompany } = authSlice.actions;
export default authSlice.reducer;
