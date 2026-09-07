import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import authReducer from './authSlice';

const storage = {
  getItem: (key: string) => {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    return Promise.resolve(value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const rootReducer = combineReducers({
  auth: authReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Persist auth state
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
