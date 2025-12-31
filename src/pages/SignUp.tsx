import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail, User, GraduationCap, Sparkles, CheckCircle2, BookOpen, Phone } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const SignUp = () => {
    const [formData, setFormData] = useState({
        teacherName: '',
        subject: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const { toast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast({
                title: 'خطأ في كلمة المرور',
                description: 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين',
                variant: 'destructive',
            });
            return;
        }

        if (formData.password.length < 6) {
            toast({
                title: 'كلمة مرور ضعيفة',
                description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.teacherName.trim() || !formData.subject.trim() || !formData.phone.trim()) {
            toast({
                title: 'بيانات ناقصة',
                description: 'الرجاء ملء جميع الحقول المطلوبة',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            console.log('Starting signup process...');
            const userCredential = await signUp(formData.email, formData.password);
            console.log('User created in Auth:', userCredential.user.uid);

            // Save user data to Firestore
            // All new users are regular users with pending status
            try {
                console.log('Saving user data to Firestore...');

                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    teacherName: formData.teacherName,
                    subject: formData.subject,
                    phone: formData.phone,
                    email: formData.email,
                    role: 'user',
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
                console.log('User data saved successfully');

                toast({
                    title: 'تم إنشاء الحساب',
                    description: 'في انتظار موافقة المدير على حسابك',
                });
            } catch (firestoreError: any) {
                console.error('Firestore error:', firestoreError);
                console.error('Error code:', firestoreError.code);
                console.error('Error message:', firestoreError.message);
            }

            setTimeout(() => {
                navigate('/');
            }, 500);

        } catch (error: any) {
            console.error('Signup error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            let errorMessage = 'حدث خطأ أثناء إنشاء الحساب';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'هذا البريد الإلكتروني مستخدم بالفعل';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'البريد الإلكتروني غير صحيح';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'كلمة المرور ضعيفة جداً';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: 'خطأ في التسجيل',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden" dir="rtl">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 left-20 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-40 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

                {/* Floating Icons */}
                <div className="absolute top-32 left-1/4 opacity-10 animate-float">
                    <GraduationCap size={80} className="text-emerald-500" />
                </div>
                <div className="absolute bottom-32 right-1/4 opacity-10 animate-float animation-delay-2000">
                    <Sparkles size={60} className="text-teal-500" />
                </div>
            </div>

            {/* Sign Up Card */}
            <div className="relative w-full max-w-md mx-4">
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all duration-300 hover:scale-[1.02]">
                    {/* Logo/Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg transform transition-transform hover:rotate-12">
                            <GraduationCap size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                            إنشاء حساب جديد
                        </h1>
                        <p className="text-gray-600 text-sm">انضم إلى منصة تحضير الدروس</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Teacher Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="teacherName" className="text-gray-700 font-medium flex items-center gap-2">
                                <User size={16} className="text-emerald-500" />
                                اسم المعلم الثلاثي
                            </Label>
                            <div className="relative">
                                <Input
                                    id="teacherName"
                                    name="teacherName"
                                    type="text"
                                    value={formData.teacherName}
                                    onChange={handleChange}
                                    placeholder="أدخل اسمك الثلاثي"
                                    required
                                    className="pr-10 pl-4 h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl transition-all"
                                />
                                <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {/* Subject Field */}
                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-gray-700 font-medium flex items-center gap-2">
                                <BookOpen size={16} className="text-emerald-500" />
                                المادة التعليمية
                            </Label>
                            <div className="relative">
                                <Input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="مثال: الرياضيات، اللغة العربية"
                                    required
                                    className="pr-10 pl-4 h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl transition-all"
                                />
                                <BookOpen size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-gray-700 font-medium flex items-center gap-2">
                                <Phone size={16} className="text-emerald-500" />
                                رقم الهاتف
                            </Label>
                            <div className="relative">
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="05xxxxxxxx"
                                    required
                                    className="pr-10 pl-4 h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl transition-all"
                                    dir="ltr"
                                />
                                <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2">
                                <Mail size={16} className="text-emerald-500" />
                                البريد الإلكتروني
                            </Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="example@domain.com"
                                    required
                                    className="pr-4 pl-10 h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl transition-all"
                                    dir="ltr"
                                />
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 font-medium flex items-center gap-2">
                                <Lock size={16} className="text-emerald-500" />
                                كلمة المرور
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="pr-10 pl-4 h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl transition-all"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                يجب أن تكون 6 أحرف على الأقل
                            </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium flex items-center gap-2">
                                <Lock size={16} className="text-emerald-500" />
                                تأكيد كلمة المرور
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="pr-10 pl-4 h-11 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl transition-all"
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-2 text-sm pt-2">
                            <input
                                type="checkbox"
                                required
                                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-gray-600">
                                أوافق على الشروط والأحكام وسياسة الخصوصية
                            </span>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    جاري إنشاء الحساب...
                                </div>
                            ) : (
                                'إنشاء حساب'
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white/80 text-gray-500">أو</span>
                        </div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-gray-600 text-sm">
                            لديك حساب بالفعل؟{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                            >
                                سجل دخولك
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer Text */}
                <p className="text-center mt-6 text-gray-600 text-sm">
                    © 2025 منصة تحضير الدروس. جميع الحقوق محفوظة.
                </p>
            </div>

            <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default SignUp;
