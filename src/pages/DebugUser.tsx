import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Shield, User, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DebugUser = () => {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchUserData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserData({ id: docSnap.id, ...docSnap.data() });
            } else {
                setUserData(null);
            }
        } catch (error: any) {
            console.error('Error:', error);
            toast({
                title: 'خطأ',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [user]);

    const handleMakeAdmin = async () => {
        if (!user) return;

        setUpdating(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                role: 'admin',
                status: 'approved'
            });

            toast({
                title: 'تم بنجاح!',
                description: 'تم ترقيتك إلى مدير',
            });

            fetchUserData();

            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-6 w-6" />
                            معلومات المستخدم الحالي
                        </CardTitle>
                        <CardDescription>عرض وتعديل بيانات المستخدم</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {user ? (
                            <>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">معلومات Firebase Auth:</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><strong>UID:</strong> {user.uid}</p>
                                        <p><strong>Email:</strong> {user.email}</p>
                                    </div>
                                </div>

                                {userData ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-green-900 mb-2">معلومات Firestore:</h3>
                                        <div className="space-y-1 text-sm">
                                            <p><strong>اسم المعلم:</strong> {userData.teacherName || 'غير موجود'}</p>
                                            <p><strong>المادة:</strong> {userData.subject || 'غير موجود'}</p>
                                            <p><strong>الهاتف:</strong> {userData.phone || 'غير موجود'}</p>
                                            <p><strong>البريد:</strong> {userData.email || 'غير موجود'}</p>
                                            <p><strong>الدور (Role):</strong> <span className={userData.role === 'admin' ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{userData.role || 'غير محدد'}</span></p>
                                            <p><strong>الحالة (Status):</strong> <span className={userData.status === 'approved' ? 'text-green-700' : 'text-amber-700'}>{userData.status || 'غير محدد'}</span></p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-800 font-semibold">⚠️ لا يوجد مستند في Firestore لهذا المستخدم!</p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button onClick={fetchUserData} variant="outline" className="gap-2">
                                        <RefreshCw className="h-4 w-4" />
                                        تحديث البيانات
                                    </Button>

                                    {userData && userData.role !== 'admin' && (
                                        <Button
                                            onClick={handleMakeAdmin}
                                            disabled={updating}
                                            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            <Shield className="h-4 w-4" />
                                            {updating ? 'جاري الترقية...' : 'ترقية إلى مدير'}
                                        </Button>
                                    )}

                                    {userData && userData.role === 'admin' && (
                                        <Button
                                            onClick={() => navigate('/admin')}
                                            className="gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            <Shield className="h-4 w-4" />
                                            الذهاب إلى لوحة التحكم
                                        </Button>
                                    )}
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                                    <p className="text-amber-800">
                                        💡 <strong>ملاحظة:</strong> إذا كان الدور (Role) ليس "admin"، اضغط على زر "ترقية إلى مدير" لتصبح مديراً.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-800">لم يتم تسجيل الدخول</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button onClick={() => navigate('/')} variant="outline">
                        العودة للصفحة الرئيسية
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DebugUser;
