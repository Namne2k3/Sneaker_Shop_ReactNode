import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface ForbiddenPageProps {
    message?: string;
    redirectPath?: string;
    redirectText?: string;
}

const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
    message = "Bạn không có quyền truy cập trang này.",
    redirectPath = "/",
    redirectText = "Quay lại trang chủ"
}) => {
    const navigate = useNavigate();

    const goBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-lg w-full text-center">
                <div className="mb-8">
                    <svg
                        className="mx-auto h-24 w-24 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <h1 className="mt-4 text-4xl font-bold text-gray-800 tracking-tight sm:text-5xl">
                        403
                    </h1>
                    <h2 className="mt-2 text-2xl font-semibold text-gray-800">Truy cập bị từ chối</h2>
                </div>

                <p className="text-gray-600 mb-8">{message}</p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={goBack}
                        className="px-5 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Quay lại trang trước
                    </button>

                    <Link
                        to={redirectPath}
                        className="px-5 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {redirectText}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForbiddenPage;
