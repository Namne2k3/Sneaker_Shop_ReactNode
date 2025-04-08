import { ReactNode, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import ForbiddenPage from '../common/ForbiddenPage';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
    children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const { user, isAuthenticated } = useAppSelector(state => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // If not authenticated or not an admin, redirect to login
    if (!isAuthenticated || user?.role !== 'admin') {
        return <ForbiddenPage />
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <AdminSidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <AdminHeader openSidebar={() => setSidebarOpen(true)} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
