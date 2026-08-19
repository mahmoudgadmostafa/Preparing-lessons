import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, LogOut } from 'lucide-react';

const PendingApproval = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" dir="rtl">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-lg">
                        <Clock size={40} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
                        في انتظار الموافقة
                    </h1>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        تم إنشاء حسابك بنجاح! حسابك الآن قيد المراجعة من قبل المدير.
                        <br />
                        سيتم إعلامك فور الموافقة على حسابك.
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-amber-800">
                            💡 يرجى الانتظار حتى يقوم المدير بمراجعة طلبك والموافقة عليه
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

                {/* Footer Text */}
                <p className="text-center mt-6 text-slate-700 text-sm font-medium">
                  صاحب حقوق التصميم: د. محمود جاد مصطفى
                </p>
            </div>
        </div>
    );
};

export default PendingApproval;
