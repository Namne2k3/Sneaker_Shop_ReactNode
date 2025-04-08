import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { useQuery } from '@tanstack/react-query';
import cartService from '../../services/cartService';
import MiniCartPreview from '../cart/MiniCartPreview';

const Header = () => {
    const { isAuthenticated, user } = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
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

    // Handle clicks outside of dropdown to close it
    useEffect(() => {
        // function handleClickOutside(event: MouseEvent) {
        //     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        //         setDropdownOpen(false);
        //     }
        // }

        // document.addEventListener("mousedown", handleClickOutside);
        // return () => {
        //     document.removeEventListener("mousedown", handleClickOutside);
        // };
    }, []);

    return (
        <header className="bg-white shadow-sm">
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
                        <Link to="/search" className="text-gray-600 hover:text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </Link>
                        <div className="relative" onMouseEnter={() => isAuthenticated && setShowCartPreview(true)} onMouseLeave={() => setShowCartPreview(false)}>
                            <Link to="/cart" className="text-gray-600 hover:text-primary relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {isAuthenticated && cartItemsCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
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
                                    <span className="mr-1">{user?.fullName}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                        <div className="py-1">
                                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>Tài khoản</Link>
                                            <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>Đơn hàng</Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="text-gray-700 hover:text-primary">
                                Đăng nhập
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-gray-600 hover:text-primary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4">
                        <div className="flex flex-col space-y-4">
                            <Link to="/" className="text-gray-700 hover:text-primary">Trang chủ</Link>
                            <Link to="/products" className="text-gray-700 hover:text-primary">Sản phẩm</Link>
                            <Link to="/best-sellers" className="text-gray-700 hover:text-primary">Bán chạy</Link>
                            <Link to="/new-arrivals" className="text-gray-700 hover:text-primary">Mới về</Link>
                            <Link to="/contact" className="text-gray-700 hover:text-primary">Liên hệ</Link>
                            {isAuthenticated ? (
                                <>
                                    <Link to="/profile" className="text-gray-700 hover:text-primary">Tài khoản</Link>
                                    <Link to="/orders" className="text-gray-700 hover:text-primary">Đơn hàng</Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-left text-gray-700 hover:text-primary"
                                    >
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="text-gray-700 hover:text-primary">Đăng nhập</Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;