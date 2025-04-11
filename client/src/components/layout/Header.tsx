import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { toggleSearchVisibility, setSearchQuery, hideSearch } from '../../store/slices/searchSlice';
import { useQuery } from '@tanstack/react-query';
import cartService from '../../services/cartService';
import MiniCartPreview from '../cart/MiniCartPreview';

const Header = () => {
    const { isAuthenticated, user } = useAppSelector(state => state.auth);
    const { isSearchVisible, searchQuery } = useAppSelector(state => state.search);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [showCartPreview, setShowCartPreview] = useState(false);

    // Fetch cart data for the badge counter
    const { data: cartResponse } = useQuery({
        queryKey: ['cart'],
        queryFn: cartService.getCart,
        enabled: isAuthenticated,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const cartItemsCount = cartResponse?.data?.products?.length || 0;

    const handleLogout = () => {
        dispatch(logout());
        setDropdownOpen(false);
    };

    const handleSearchToggle = () => {
        dispatch(toggleSearchVisibility());
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
            dispatch(hideSearch());
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        // Close search on Escape key
        if (e.key === 'Escape') {
            dispatch(hideSearch());
        }
    };

    // Focus on search input when it becomes visible
    useEffect(() => {
        if (isSearchVisible && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100); // Small delay to ensure animation has started
        }
    }, [isSearchVisible]);

    // Handle clicks outside of search to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isSearchVisible &&
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node)) {
                dispatch(hideSearch());
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSearchVisible, dispatch]);

    // Handle clicks outside of dropdown to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <span className="text-2xl font-bold text-primary">SneakerShop</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-primary">Trang chủ</Link>
                        <Link to="/products" className="text-gray-700 hover:text-primary">Sản phẩm</Link>
                        {/* <Link to="/best-sellers" className="text-gray-700 hover:text-primary">Bán chạy</Link>
                        <Link to="/new-arrivals" className="text-gray-700 hover:text-primary">Mới về</Link> */}
                        <Link to="/contact" className="text-gray-700 hover:text-primary">Liên hệ</Link>
                    </nav>

                    {/* User Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="relative" ref={searchContainerRef}>
                            {isSearchVisible ? (
                                <div className="absolute right-0 top-0 transition-all duration-300 ease-in-out bg-white rounded-md shadow-lg p-2 flex z-10 w-72 animate-fade-in">
                                    <form onSubmit={handleSearchSubmit} className="flex w-full">
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Tìm kiếm sản phẩm..."
                                            className="border-gray-300 focus:ring-primary focus:border-primary rounded-l-md py-2 px-3 text-sm w-full transition-all"
                                            value={searchQuery}
                                            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                                            onKeyDown={handleSearchKeyDown}
                                        />
                                        <button
                                            type="submit"
                                            className="bg-primary hover:bg-primary-dark transition-colors text-white rounded-r-md px-4 flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </button>
                                    </form>
                                    <button
                                        className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                                        onClick={() => dispatch(hideSearch())}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleSearchToggle}
                                    className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Tìm kiếm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="relative" onMouseEnter={() => isAuthenticated && setShowCartPreview(true)} onMouseLeave={() => setShowCartPreview(false)}>
                            <Link to="/cart" className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {isAuthenticated && cartItemsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                        {cartItemsCount > 99 ? '99+' : cartItemsCount}
                                    </span>
                                )}
                            </Link>

                            {isAuthenticated && <MiniCartPreview isVisible={showCartPreview} onClose={() => setShowCartPreview(false)} />}
                        </div>

                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    className="flex items-center text-gray-700 hover:text-primary focus:outline-none"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <span className="mr-1 text-sm font-medium">{user?.fullName}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 animate-fade-in">
                                        <div className="py-1 rounded-md ring-1 ring-black ring-opacity-5">
                                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors" onClick={() => setDropdownOpen(false)}>Tài khoản</Link>
                                            <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors" onClick={() => setDropdownOpen(false)}>Đơn hàng</Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Đăng nhập</Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={handleSearchToggle}
                            className="text-gray-600 hover:text-primary mr-4 flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Tìm kiếm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <Link to="/cart" className="text-gray-600 hover:text-primary mr-4 flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {isAuthenticated && cartItemsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-gray-600 hover:text-primary flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {isSearchVisible && (
                    <div className="md:hidden py-2 pb-4 animate-fade-in">
                        <form onSubmit={handleSearchSubmit} className="flex">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                className="border-gray-300 focus:ring-primary focus:border-primary rounded-l-md py-2 px-3 text-sm flex-grow"
                                value={searchQuery}
                                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                                onKeyDown={handleSearchKeyDown}
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary-dark transition-colors text-white rounded-r-md px-4 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                )}

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 animate-fade-in">
                        <div className="flex flex-col space-y-4">
                            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">Trang chủ</Link>
                            <Link to="/products" className="text-gray-700 hover:text-primary transition-colors">Sản phẩm</Link>
                            {/* <Link to="/best-sellers" className="text-gray-700 hover:text-primary transition-colors">Bán chạy</Link>
                        <Link to="/new-arrivals" className="text-gray-700 hover:text-primary transition-colors">Mới về</Link> */}
                            <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors">Liên hệ</Link>
                            {isAuthenticated ? (
                                <>
                                    <Link to="/profile" className="text-gray-700 hover:text-primary transition-colors">Tài khoản</Link>
                                    <Link to="/orders" className="text-gray-700 hover:text-primary transition-colors">Đơn hàng</Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-left text-gray-700 hover:text-primary transition-colors"
                                    >
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="text-gray-700 hover:text-primary transition-colors">Đăng nhập</Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;