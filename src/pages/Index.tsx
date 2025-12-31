import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Sparkles, BookOpen, LogOut, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import { Search, Trash2, Clock, Calendar } from "lucide-react";

interface TeacherData {
  teacherName: string;
  subject: string;
  phone: string;
  role?: string;
}

interface Lesson {
  id: string;
  title: string;
  subject: string;
  className: string;
  date: string;
  createdAt: any;
  [key: string]: any;
}

const Index = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setTeacherData(docSnap.data() as TeacherData);
          }
        } catch (error) {
          console.error('Error fetching teacher data:', error);
        }
      }
    };

    const fetchLessons = async () => {
      if (!user) {
        console.log("FetchLessons: No user logged in");
        return;
      }
      setIsLoadingLessons(true);
      try {
        console.log("FetchLessons: Fetching lessons for user:", user.uid);
        // Remove orderBy to avoid requiring a composite index manually in Firebase Console
        const q = query(
          collection(db, "lessons"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        console.log("FetchLessons: Snapshot size:", querySnapshot.size);

        const fetchedLessons: Lesson[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedLessons.push({ id: doc.id, ...data } as Lesson);
        });

        // Sort in memory instead: primary sort by createdAt desc
        fetchedLessons.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        console.log("FetchLessons: Final processed lessons:", fetchedLessons.length);
        setLessons(fetchedLessons);
      } catch (error: any) {
        console.error("FetchLessons: Error fetching lessons:", error);
        toast({
          title: "خطأ في جلب الدروس",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoadingLessons(false);
      }
    };

    fetchTeacherData();
    fetchLessons();
  }, [user]);

  const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من حذف هذا الدرس؟")) return;

    try {
      await deleteDoc(doc(db, "lessons", lessonId));
      setLessons(lessons.filter(l => l.id !== lessonId));
      toast({ title: "تم الحذف", description: "تم حذف الدرس بنجاح" });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حذف الدرس", variant: "destructive" });
    }
  };

  const filteredLessons = lessons.filter(lesson =>
    lesson.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً!",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار ملف أو أكثر",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const { data, error } = await supabase.functions.invoke('process-lesson', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "نجح!",
        description: "تم معالجة الملفات بنجاح",
      });

      navigate('/preparation', { state: { lessonData: data } });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الملفات",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Debug logging
  console.log('Index page - teacherData:', teacherData, 'role:', teacherData?.role);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent hidden sm:block">
              تحضير ذكي
            </span>
          </div>

          <div className="flex items-center gap-3">
            {(teacherData?.role === 'admin' || user?.email === 'mahmoudgadmostafa@gmail.com') && (
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="gap-2 text-indigo-600 hover:bg-indigo-50 font-medium"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">لوحة التحكم</span>
              </Button>
            )}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="gap-2 text-rose-600 hover:bg-rose-50 font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-12 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 animate-fade-in">
              <Sparkles className="h-3 w-3" />
              مستقبل التعليم هنا
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 text-balance leading-tight">
              حول محتوى درسك إلى <span className="text-primary relative inline-block">
                تحضير احترافي
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="currentColor" strokeWidth="2" fill="none" className="opacity-30" />
                </svg>
              </span> في ثوانٍ
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl text-balance">
              منصة المعلم المبدع لإعداد الدروس والأنشطة التعليمية باستخدام الذكاء الاصطناعي المتطور. ارفع صور درسك الآن!
            </p>

            {/* User Badge Card */}
            {teacherData && (
              <div className="glass p-4 rounded-2xl flex flex-wrap items-center gap-4 border border-slate-200/50 shadow-xl mb-12">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-inner">
                  <span className="text-xl font-bold">{teacherData.teacherName?.[0]}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 leading-none">أ/ {teacherData.teacherName}</p>
                    {(teacherData.role === 'admin' || user?.email === 'mahmoudgadmostafa@gmail.com') && (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200 flex items-center gap-1">
                        <Shield className="h-2.5 w-2.5" />
                        مدير
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">تخصص: {teacherData.subject} • {teacherData.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Actions Panel */}
      <main className="container mx-auto px-4 -mt-10 mb-24 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">

          {/* Left Side: Upload Zone */}
          <div className="lg:col-span-12 xl:col-span-7">
            <Card className="border-none shadow-premium overflow-hidden bg-white h-full group transition-all duration-300">
              <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-500 to-accent" />
              <CardHeader className="pt-8 px-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">خطوة 01</span>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">بدء تحضير جديد</CardTitle>
                <CardDescription className="text-slate-500 text-base">
                  ارفع صور صفحات الكتاب أو ملاحظاتك، وسيتولى الذكاء الاصطناعي الباقي.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8 pt-4 space-y-6">
                <div
                  className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer
                    ${files && files.length > 0 ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50/50'}`}
                >
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="dropzone-file"
                  />

                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                      <Upload className={`h-10 w-10 ${files && files.length > 0 ? 'text-primary' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-xl font-bold text-slate-900 mb-2">
                      {files && files.length > 0 ? `تم اختيار ${files.length} ملفات` : 'اسحب الملفات هنا أو اضغط للاختيار'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {['JPG', 'PNG', 'PDF', 'Word'].map(ext => (
                        <span key={ext} className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-500">{ext}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {files && files.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-700">قائمة المستندات</h4>
                      <Button variant="ghost" size="sm" onClick={() => setFiles(null)} className="text-rose-500 h-7 text-xs font-bold">مسح الكل</Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto pr-2 space-y-2 scrollbar-thin">
                      {Array.from(files).map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 flex-1 truncate">{file.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!files || isUploading}
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all rounded-2xl gap-3"
                >
                  {isUploading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري التحليل الذكي...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6" />
                      إنشاء ملف التحضير
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features / Quick Help Panel */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {[
                {
                  icon: <Sparkles className="h-6 w-6" />,
                  title: 'تحليل ذكي فائق',
                  desc: 'افضل نتائج عند استخدام صور الكتاب الملونة',
                  color: 'text-amber-600',
                  bg: 'bg-amber-50'
                },
                {
                  icon: <FileText className="h-6 w-6" />,
                  title: 'تنسيق وورد احترافي',
                  desc: 'تحميل مباشر بتنسيق جاهز للطباعة فوراً',
                  color: 'text-blue-600',
                  bg: 'bg-blue-50'
                },
                {
                  icon: <Calendar className="h-6 w-6" />,
                  title: 'أرشفة الدروس',
                  desc: 'الوصول لجميع تحضيراتك السابقة من أي مكان',
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-50'
                }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Hint Box */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="h-20 w-20" />
              </div>
              <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                تلميحات هامة
              </h4>
              <ul className="space-y-3 text-slate-300 text-sm">
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  صور الكتاب هي المصدر الأفضل للمعلومات.
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  تأكد من إضاءة الصورة جيداً قبل الرفع.
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  يمكنك تعديل أي جزء من التحضير يدوياً لاحقاً.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dashboard Section: Previous Preparations */}
        <div className="max-w-6xl mx-auto mt-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">أرشيف تحضيراتي</h2>
              <p className="text-slate-500 font-medium">إدارة ومتابعة دروسك التي قمت بإنشائها</p>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="ابحث عن درس محدد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 h-14 pr-12 pl-6 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {isLoadingLessons ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/50 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : filteredLessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => navigate('/preparation', { state: { lessonData: lesson, lessonId: lesson.id } })}
                  className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-10 w-10 rounded-xl shadow-lg ring-4 ring-rose-500/10"
                      onClick={(e) => handleDeleteLesson(e, lesson.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center mb-6 transition-colors shadow-inner">
                      <FileText className="h-7 w-7" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100">
                        {lesson.subject || 'بدون تخصص'}
                      </span>
                      {lesson.className && (
                        <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-500 text-[10px] font-bold border border-indigo-100">
                          فصل: {lesson.className}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-bold">
                        {lesson.createdAt?.toDate ? lesson.createdAt.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : 'مُضاف حديثاً'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-primary text-xs font-bold">
                      فتح الدرس
                      <Sparkles className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-sm max-w-2xl mx-auto">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                <FileText className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">لا يوجد تحضيرات بعد</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                ابدأ الآن برفع ملفاتك وأول درس تقوم بتحضيره سيظهر هنا في أرشيفك الخاص.
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('dropzone-file')?.click()}
                className="rounded-xl px-8 font-bold"
              >
                ابدأ الآن
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-lg font-bold text-slate-800">تحضير ذكي</span>
          </div>
          <p className="text-sm text-slate-400 font-medium italic">مدعوم بتقنيات الذكاء الاصطناعي لخدمة المعلم المصري</p>
          <p className="text-[10px] text-slate-300 mt-8">© 2025 جميع الحقوق محفوظة لخبراء التعليم الرقمي</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;