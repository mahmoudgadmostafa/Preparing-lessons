import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield, AlertTriangle } from 'lucide-react';

const MakeAdmin = () => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleMakeAdmin = async () => {
        if (!user) {
            toast({
                title: 'خطأ',
                description: 'يجب تسجيل الدخول أولاً',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                role: 'admin',
                status: 'approved'
            });

            toast({
                title: 'تم بنجاح!',
                description: 'تم ترقية حسابك إلى مدير. قم بتحديث الصفحة.',
            });

            // Reload after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error: any) {
            console.error('Error making admin:', error);
            toast({
                title: 'خطأ',
                description: `حدث خطأ: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4" dir="rtl">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-8 w-8 text-indigo-600" />
                        <CardTitle className="text-2xl">ترقية إلى مدير</CardTitle>
                    </div>
                    <CardDescription>
                        استخدم هذه الصفحة لترقية حسابك الحالي إلى مدير
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">تحذير:</p>
                            <p>هذه الصفحة للاستخدام لمرة واحدة فقط لإعداد حساب المدير الأول.</p>
                        </div>
                    </div>

                    {user ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm text-gray-600">الحساب الحالي:</p>
                            <p className="font-semibold text-gray-900">{user.email}</p>
                            <p className="text-xs text-gray-500">UID: {user.uid}</p>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">يجب تسجيل الدخول أولاً</p>
                        </div>
                    )}

                    <Button
                        onClick={handleMakeAdmin}
                        disabled={loading || !user}
                        className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                جاري الترقية...
                            </div>
                        ) : (
                            <>
                                <Shield className="h-5 w-5 ml-2" />
                                ترقية إلى مدير
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                        بعد الترقية، يمكنك حذف هذه الصفحة من المشروع
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default MakeAdmin;
