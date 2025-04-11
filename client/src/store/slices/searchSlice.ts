import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
    isSearchVisible: boolean;
    searchQuery: string;
}

const initialState: SearchState = {
    isSearchVisible: false,
    searchQuery: '',
};

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        showSearch: (state) => {
            state.isSearchVisible = true;
        },
        hideSearch: (state) => {
            state.isSearchVisible = false;
        },
        toggleSearchVisibility: (state) => {
            state.isSearchVisible = !state.isSearchVisible;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        clearSearchQuery: (state) => {
            state.searchQuery = '';
        },
    },
});

export const {
    showSearch,
    hideSearch,
    toggleSearchVisibility,
    setSearchQuery,
    clearSearchQuery
} = searchSlice.actions;

export default searchSlice.reducer;
