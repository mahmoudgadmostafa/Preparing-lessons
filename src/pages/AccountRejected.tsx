import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { XCircle, LogOut } from 'lucide-react';

const AccountRejected = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50" dir="rtl">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 shadow-lg">
                        <XCircle size={40} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-4">
                        تم رفض الحساب
                    </h1>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        نأسف لإبلاغك بأن طلب إنشاء حسابك لم تتم الموافقة عليه من قبل المدير.
                        <br />
                        يمكنك التواصل مع الإدارة لمزيد من المعلومات.
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-red-800">
                            للاستفسار، يرجى التواصل مع إدارة المنصة
                        </p>
                    </div>

                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        تسجيل الخروج
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AccountRejected;
