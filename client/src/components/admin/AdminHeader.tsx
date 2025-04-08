import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

interface AdminHeaderProps {
    openSidebar: () => void;
}

const AdminHeader = ({ openSidebar }: AdminHeaderProps) => {
    const user = useAppSelector(state => state.auth.user);
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <header className="bg-white shadow-sm z-10">
            <div className="px-4 py-3 flex justify-between items-center">
                <div className="flex items-center">
                    <button
                        onClick={openSidebar}
                        className="text-gray-600 md:hidden focus:outline-none"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="ml-3 text-lg font-semibold text-gray-700">Admin Dashboard</h1>
                </div>

                <div className="flex items-center">
                    <div className="relative group">
                        <button className="flex items-center text-gray-700 focus:outline-none">
                            <span className="mr-2">{user?.fullName}</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
