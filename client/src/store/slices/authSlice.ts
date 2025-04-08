import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

// Get initial state from localStorage
const loadFromLocalStorage = (): AuthState => {
    try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        return {
            user: storedUser ? JSON.parse(storedUser) : null,
            token: storedToken || null,
            isAuthenticated: !!storedUser && !!storedToken,
        };
    } catch (error) {
        console.error('Failed to load auth state from localStorage:', error);
        return { user: null, token: null, isAuthenticated: false };
    }
};

const initialState: AuthState = loadFromLocalStorage();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;

            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('token', action.payload.token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;

            // Clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
