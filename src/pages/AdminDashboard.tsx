import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { LogOut, Users, CheckCircle, XCircle, Trash2, Shield } from 'lucide-react';

interface UserData {
    id: string;
    teacherName: string;
    subject: string;
    phone: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
}

const AdminDashboard = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        checkAdminStatus();
    }, [user]);

    const checkAdminStatus = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;
            const isMainAdmin = user.email === 'mahmoudgadmostafa@gmail.com';

            if (isMainAdmin || userData?.role === 'admin') {
                setIsAdmin(true);
                fetchUsers();
            } else {
                toast({
                    title: 'غير مصرح',
                    description: 'ليس لديك صلاحية الوصول لهذه الصفحة',
                    variant: 'destructive',
                });
                navigate('/');
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            navigate('/');
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            console.log('Attempting to fetch all users...');
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);

            console.log('Successfully fetched snapshot. Size:', usersSnapshot.size);

            const usersData: UserData[] = [];
            usersSnapshot.forEach((doc) => {
                const data = doc.data();
                usersData.push({
                    id: doc.id,
                    ...data
                } as UserData);
            });

            // Sort: pending first, then by creation date
            usersData.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setUsers(usersData);
            console.log('Processed users list:', usersData);
        } catch (error: any) {
            console.error('CRITICAL: Error fetching users:', error);

            let userFriendlyMessage = 'حدث خطأ في جلب البيانات';
            if (error.code === 'permission-denied') {
                userFriendlyMessage = 'تم رفض الوصول: يرجى تحديث قواعد أمان Firestore في Firebase Console';
            }

            toast({
                title: 'خطأ في جلب البيانات',
                description: `${userFriendlyMessage} (${error.code || 'unknown'})`,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                status: 'approved'
            });

            toast({
                title: 'تمت الموافقة',
                description: 'تمت الموافقة على المستخدم بنجاح',
            });

            fetchUsers();
        } catch (error) {
            console.error('Error approving user:', error);
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء الموافقة على المستخدم',
                variant: 'destructive',
            });
        }
    };

    const handleReject = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                status: 'rejected'
            });

            toast({
                title: 'تم الرفض',
                description: 'تم رفض المستخدم',
            });

            fetchUsers();
        } catch (error) {
            console.error('Error rejecting user:', error);
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء رفض المستخدم',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

        try {
            await deleteDoc(doc(db, 'users', userId));

            toast({
                title: 'تم الحذف',
                description: 'تم حذف المستخدم بنجاح',
            });

            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء حذف المستخدم',
                variant: 'destructive',
            });
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    const pendingUsers = users.filter(u => u.status === 'pending');
    const approvedUsers = users.filter(u => u.status === 'approved');
    const rejectedUsers = users.filter(u => u.status === 'rejected');

    return (
        <div className="min-h-screen bg-gray-50 pb-12" dir="rtl">
            {/* Header */}
            <header className="bg-white border-b shadow-sm sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-none">لوحة تحكم المدير</h1>
                                <p className="text-xs md:text-sm text-gray-500 mt-1">إدارة المستخدمين والصلاحيات</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="h-9">
                                الصفحة الرئيسية
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                                <LogOut className="h-4 w-4 ml-2" />
                                خروج
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 md:py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
                    {[
                        { label: 'إجمالي المستخدمين', value: users.length, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'في الانتظار', value: pendingUsers.length, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'مقبول', value: approvedUsers.length, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'مرفوض', value: rejectedUsers.length, color: 'text-red-600', bg: 'bg-red-50' }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none shadow-sm ${stat.bg}`}>
                            <CardContent className="p-4 md:p-6">
                                <p className="text-[10px] md:text-sm font-bold text-slate-500 mb-1">{stat.label}</p>
                                <div className={`text-2xl md:text-4xl font-extrabold ${stat.color}`}>{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Sections */}
                <div className="space-y-8">
                    {/* Pending Users */}
                    {pendingUsers.length > 0 && (
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg md:text-xl">طلبات انضمام جديدة</CardTitle>
                                        <CardDescription className="text-amber-700/70">تحتاج هذه الحسابات إلى مراجعة وتفعيل</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-amber-100">
                                    {pendingUsers.map((user) => (
                                        <div key={user.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 gap-4 hover:bg-amber-50/30 transition-colors">
                                            <div className="flex-1 space-y-1">
                                                <h3 className="text-lg font-bold text-slate-900">أ/ {user.teacherName}</h3>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                                                    <span>المادة: <b>{user.subject}</b></span>
                                                    <span>الهاتف: <b>{user.phone}</b></span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-none pt-3 md:pt-0">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(user.id)}
                                                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 shadow-sm"
                                                >
                                                    <CheckCircle className="h-4 w-4 ml-2" />
                                                    موافقة
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleReject(user.id)}
                                                    className="flex-1 md:flex-none shadow-sm"
                                                >
                                                    <XCircle className="h-4 w-4 ml-2" />
                                                    رفض
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* All Users with refined Mobile Interface */}
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardHeader className="border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Users className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg md:text-xl">إدارة جميع المستخدمين</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 gap-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center flex-wrap gap-2">
                                                <h3 className="font-bold text-slate-900">أ/ {user.teacherName}</h3>
                                                {(user.role === 'admin' || user.email === 'mahmoudgadmostafa@gmail.com') && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                                                        مدير النظام
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${user.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        user.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                            'bg-rose-100 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {user.status === 'pending' ? 'في الانتظار' :
                                                        user.status === 'approved' ? 'مفعل' : 'مرفوض'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-3 text-xs text-slate-500">
                                                <span>المادة: <b>{user.subject}</b></span>
                                                <span className="hidden sm:inline">|</span>
                                                <span>الهاتف: <b>{user.phone}</b></span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] md:max-w-none">{user.email}</p>
                                        </div>

                                        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-none pt-3 md:pt-0">
                                            {user.status === 'pending' && (
                                                <>
                                                    <Button size="icon" onClick={() => handleApprove(user.id)} className="bg-green-600 hover:bg-green-700 h-8 w-8 rounded-lg" title="موافقة">
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="destructive" onClick={() => handleReject(user.id)} className="h-8 w-8 rounded-lg" title="رفض">
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            {user.status === 'rejected' && (
                                                <Button size="sm" onClick={() => handleApprove(user.id)} className="bg-green-600 hover:bg-green-700 text-xs h-8">
                                                    تفعيل الحساب
                                                </Button>
                                            )}
                                            {user.status === 'approved' && (user.role !== 'admin' && user.email !== 'mahmoudgadmostafa@gmail.com') && (
                                                <Button size="sm" variant="outline" onClick={() => handleReject(user.id)} className="text-xs h-8 text-rose-600 border-rose-100 hover:bg-rose-50">
                                                    إلغاء التفعيل
                                                </Button>
                                            )}
                                            {(user.role !== 'admin' && user.email !== 'mahmoudgadmostafa@gmail.com') && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-lg transition-colors"
                                                    title="حذف نهائي"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
