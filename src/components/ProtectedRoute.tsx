import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const [userStatus, setUserStatus] = useState<string | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        const checkUserStatus = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUserStatus(userDoc.data().status);
                    }
                } catch (error) {
                    console.error('Error checking user status:', error);
                }
            }
            setCheckingStatus(false);
        };

        if (!loading) {
            checkUserStatus();
        }
    }, [user, loading]);

    if (loading || checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (userStatus === 'pending') {
        return <Navigate to="/pending-approval" replace />;
    }

    if (userStatus === 'rejected') {
        return <Navigate to="/account-rejected" replace />;
    }

    return <>{children}</>;
};
