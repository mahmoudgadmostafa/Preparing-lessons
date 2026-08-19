import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  BookOpen,
  Upload,
  Camera,
  FileText,
  Download,
  CheckCircle,
  ArrowLeft,
  Star,
  Zap,
  Shield,
  Clock,
  ChevronDown,
  MessageCircle,
  PhoneCall,
  Play,
  Award,
  Users,
  TrendingUp,
  Layers,
  Cpu,
  Image,
  Edit3,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "نتمنى لك يوماً دراسياً موفقاً!",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  // Auto-cycle through steps in the how-it-works section
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const goToDashboard = () => navigate(user ? "/dashboard" : "/login");

  const features = [
    {
      icon: <Camera className="h-7 w-7" />,
      title: "تصوير فوري بالكاميرا",
      desc: "افتح الكاميرا مباشرةً من الهاتف أو الحاسوب وصوّر صفحة الكتاب المدرسي — بدون نقل أو تحميل يدوي.",
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      icon: <Cpu className="h-7 w-7" />,
      title: "تحليل بالذكاء الاصطناعي",
      desc: "يحلل النظام المحتوى بدقة عالية باستخدام Gemini AI لاستخراج موضوع الدرس وكافة عناصر نموذج التحضير.",
      color: "from-blue-500 to-sky-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      icon: <FileText className="h-7 w-7" />,
      title: "صياغة تلقائية شاملة",
      desc: "يُنشئ تلقائياً الأهداف السلوكية، استراتيجيات التدريس، التمهيد، العرض، والتقويم الختامي.",
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      icon: <Edit3 className="h-7 w-7" />,
      title: "محرر تفاعلي احترافي",
      desc: "راجع وعدّل على التحضير مباشرةً بمحرر غني يدعم إضافة عناصر بصرية ورسوم توضيحية.",
      color: "from-orange-500 to-amber-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
    {
      icon: <Download className="h-7 w-7" />,
      title: "تصدير Word و PDF فوري",
      desc: "حمّل ملف تحضيرك بصيغة Word جاهزة للطباعة مباشرةً، أو PDF للمشاركة الفورية.",
      color: "from-rose-500 to-pink-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    {
      icon: <Layers className="h-7 w-7" />,
      title: "أرشيف ذكي للدروس",
      desc: "جميع تحضيراتك محفوظة في مكتبة منظمة للوصول إليها في أي وقت ومن أي جهاز.",
      color: "from-indigo-500 to-violet-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
  ];

  const steps = [
    {
      icon: <Camera className="h-10 w-10 text-white" />,
      label: "الخطوة الأولى",
      title: "صوّر أو ارفع محتوى الدرس",
      desc: "التقط صفحة الكتاب بالكاميرا مباشرةً، أو ارفع ملف صورة أو PDF من جهازك.",
      gradient: "from-violet-600 to-purple-700",
      note: "📸 يدعم كافة الكاميرات والأجهزة",
    },
    {
      icon: <Sparkles className="h-10 w-10 text-white" />,
      label: "الخطوة الثانية",
      title: "الذكاء الاصطناعي يحلل ويُعدّ",
      desc: "يقرأ النموذج محتوى الصورة ويُنشئ جميع عناصر ملف التحضير الوزاري خلال ثوانٍ معدودة.",
      gradient: "from-blue-600 to-sky-700",
      note: "⚡ نتيجة خلال أقل من 30 ثانية",
    },
    {
      icon: <Download className="h-10 w-10 text-white" />,
      label: "الخطوة الثالثة",
      title: "راجع، عدّل، واطبع",
      desc: "تحقق من التحضير، أجرِ أي تعديلات برمجية، ثم حمّل الملف النهائي Word أو PDF.",
      gradient: "from-emerald-600 to-teal-700",
      note: "📄 تصدير فوري جاهز للطباعة",
    },
  ];

  const testimonials = [
    {
      name: "معلمة لغة عربية",
      title: "المرحلة الابتدائية — خبرة 12 سنة",
      text: "وفّرت عليّ المنصة ساعتين على الأقل كل يوم. أحضّر دروسي بدقة عالية وبدون أي جهد في الكتابة.",
      stars: 5,
      avatar: "ض",
      color: "bg-purple-500",
    },
    {
      name: "معلم رياضيات",
      title: "المرحلة الإعدادية — خبير تعليمي",
      text: "جربت كثيراً من البرامج لكن تحضير ذكي هو الوحيد الذي يفهم المحتوى العربي بشكل صحيح ويُنتج صياغة وزارية متقنة.",
      stars: 5,
      avatar: "ر",
      color: "bg-blue-500",
    },
    {
      name: "معلمة علوم",
      title: "المرحلة الثانوية — باحثة تربوية",
      text: "التطبيق سهل جداً، لا يحتاج تدريب. من أول يوم كنت أُحضّر دروسي بشكل احترافي ومتكامل.",
      stars: 5,
      avatar: "ع",
      color: "bg-emerald-500",
    },
  ];

  const faqs = [
    {
      q: "هل تحتاج إلى خبرة تقنية لاستخدام المنصة؟",
      a: "لا إطلاقاً. المنصة مصممة لتكون سهلة بقدر الإمكان. افتح الكاميرا، صوّر الصفحة، واضغط زراً واحداً.",
    },
    {
      q: "هل التحضير المُنتج متوافق مع معايير الوزارة؟",
      a: "نعم، يراعي النظام نموذج التحضير الوزاري المعتمد بعناصره الكاملة (التمهيد، العرض، الأنشطة، التقويم، الواجب).",
    },
    {
      q: "ما أنواع الملفات التي يقبلها النظام؟",
      a: "يقبل النظام صور JPG وPNG المُلتقطة بالكاميرا، وملفات PDF وWord للمقاطع النصية.",
    },
    {
      q: "هل يمكن تعديل التحضير بعد إنشائه؟",
      a: "نعم، يتاح لك محرر نصوص متكامل لتعديل أي جزء قبل التحميل.",
    },
    {
      q: "كيف أشترك في المنصة؟",
      a: "أنشئ حساباً بيانات بسيطة وستنتظر الموافقة من الإدارة ثم تستطيع البدء فوراً.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden" dir="rtl">

      {/* ── NAVIGATION ───────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-sky-500 shadow-lg shadow-primary/30 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black bg-gradient-to-r from-slate-900 to-primary bg-clip-text text-transparent">
                تحضير ذكي
              </span>
              <span className="hidden sm:inline-block mr-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                AI PRO
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">المميزات</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">كيف يعمل؟</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">آراء المعلمين</a>
            <a href="#faq" className="hover:text-primary transition-colors">الأسئلة الشائعة</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-primary text-white font-bold rounded-xl h-10 px-4 text-sm shadow-md shadow-primary/20 hover:shadow-lg"
                >
                  <Sparkles className="h-4 w-4 ml-1.5" />
                  لوحة التحكم
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl h-10 px-3 text-xs gap-1.5"
                  title="تسجيل الخروج من الحساب"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-slate-700 font-bold rounded-xl h-10 px-4 text-sm hidden sm:flex"
                >
                  تسجيل الدخول
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  className="bg-primary text-white font-bold rounded-xl h-10 px-4 sm:px-5 text-sm shadow-md shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  ابدأ الآن
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4 pt-2 space-y-2 animate-in slide-in-from-top-2">
            {[
              { label: "المميزات", href: "#features" },
              { label: "كيف يعمل؟", href: "#how-it-works" },
              { label: "آراء المعلمين", href: "#testimonials" },
              { label: "الأسئلة الشائعة", href: "#faq" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
              {user ? (
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج من الحساب
                </button>
              ) : (
                <button
                  onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                  className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  تسجيل الدخول
                </button>
              )}
          </div>
        )}
      </header>

      {/* ── HERO SECTION ─────────────────────────────── */}
      <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-60 -right-60 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[130px]" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-400/5 rounded-full blur-[100px]" />

          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs sm:text-sm font-bold mb-8 shadow-sm hover:scale-105 transition-transform cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <Sparkles className="h-3.5 w-3.5" />
              <span>مدعوم بأحدث نماذج الذكاء الاصطناعي — Gemini AI Pro</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.15]">
              حضّر دروسك الآن{" "}
              <br className="hidden sm:block" />
              بـ{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  ذكاء اصطناعي
                </span>
                {/* Underline SVG */}
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                  <path d="M3 9C50 3, 150 3, 297 9" stroke="url(#uline)" strokeWidth="4" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="uline" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              منصة <strong className="text-slate-900">تحضير ذكي</strong> تحوّل صور صفحات الكتاب المدرسي إلى ملف تحضير وزاري متكامل — بالأهداف السلوكية، الاستراتيجيات، الأنشطة والتقويم — خلال أقل من دقيقة.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14">
              <Button
                onClick={() => navigate("/signup")}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 text-white font-black rounded-2xl h-14 px-8 text-base shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all gap-2"
              >
                <Sparkles className="h-5 w-5 text-amber-300" />
                ابدأ الآن
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl border-2 border-slate-200 bg-white/80 text-slate-700 font-bold text-base hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all shadow-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                شاهد كيف يعمل
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>لا يتطلب خبرة تقنية</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                <span>بياناتك محمية بالكامل</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>نتيجة خلال 30 ثانية</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-rose-500" />
                <span>متوافق مع نموذج الوزارة</span>
              </div>
            </div>
          </div>

          {/* Hero Visual / Demo Card */}
          <div className="relative max-w-4xl mx-auto mt-16">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-indigo-500/20 to-sky-400/20 rounded-[40px] blur-xl" />
            <div className="relative bg-white rounded-[32px] border border-slate-200/80 shadow-2xl overflow-hidden">
              {/* Browser Top Bar */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4 h-7 bg-white rounded-lg border border-slate-200 flex items-center px-3 gap-2 text-[11px] text-slate-400 font-mono">
                  <Shield className="h-3 w-3 text-emerald-500" />
                  tahdeer-dhaki.com
                </div>
              </div>

              {/* Fake App UI */}
              <div className="grid grid-cols-1 sm:grid-cols-5 min-h-[280px]">
                {/* Left: Input Panel */}
                <div className="sm:col-span-2 p-5 border-b sm:border-b-0 sm:border-l border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">رفع صور الكتاب</span>
                  </div>

                  {/* Fake dropzone */}
                  <div className="flex-1 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/3 flex flex-col items-center justify-center gap-2 p-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Image className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] text-center font-semibold text-slate-500">
                      صورة صفحة الدرس
                    </p>
                    <div className="px-3 py-1 rounded-lg bg-primary text-white text-[10px] font-bold shadow-sm">
                      اضغط للرفع أو صوّر
                    </div>
                  </div>

                  {/* Fake uploaded file */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-800 truncate">درس_الكسور.jpg</p>
                      <p className="text-[9px] text-slate-500">1.4 MB — جاهز</p>
                    </div>
                  </div>
                </div>

                {/* Right: Output Panel */}
                <div className="sm:col-span-3 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">ملف التحضير المُنشأ</span>
                    </div>
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black">
                      <Zap className="h-3 w-3" />
                      جاهز في 12 ثانية
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: "موضوع الدرس", value: "الكسور الاعتيادية — الصف الرابع الابتدائي", color: "bg-primary/5 border-primary/15 text-primary" },
                      { label: "الأهداف السلوكية", value: "يتعرف الطالب على مفهوم الكسر ويُجزّئ الكل إلى أجزاء متساوية...", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
                      { label: "استراتيجية التدريس", value: "التعلم التعاوني — حل المسائل", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
                      { label: "التقييم الختامي", value: "أسئلة تطبيقية ورقية وشفهية...", color: "bg-amber-50 border-amber-100 text-amber-700" },
                    ].map((row, i) => (
                      <div key={i} className={`p-2.5 rounded-xl border ${row.color}`}>
                        <p className="text-[9px] font-black mb-0.5 opacity-70">{row.label}</p>
                        <p className="text-[10px] font-semibold text-slate-700 leading-snug line-clamp-1">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-[11px] font-black shadow-md shadow-primary/20 flex items-center justify-center gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    تحميل ملف Word الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── FEATURES SECTION ─────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold mb-4 border border-primary/20">
              <Zap className="h-3.5 w-3.5" />
              المميزات الرئيسية
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
              كل ما يحتاجه المعلم في{" "}
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                مكان واحد
              </span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
              أدوات متكاملة ومتطورة لإنجاز ملف التحضير الوزاري بأعلى جودة وأقل وقت.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group relative p-6 rounded-3xl bg-white border ${feature.border} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-default`}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" />

                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.bg} bg-gradient-to-br ${feature.color} text-white shadow-md mb-5 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-4 border border-indigo-200">
              <Play className="h-3.5 w-3.5 fill-current" />
              كيف يعمل النظام؟
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
              3 خطوات فقط للحصول على{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
                تحضير كامل
              </span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              من التقاط صورة الكتاب حتى الحصول على ملف Word جاهز للطباعة — في أقل من دقيقة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative p-7 rounded-3xl border-2 transition-all duration-500 cursor-pointer ${
                  activeStep === i
                    ? "border-primary shadow-xl shadow-primary/15 bg-white scale-[1.02]"
                    : "border-slate-200 bg-white hover:border-primary/40 hover:shadow-md"
                }`}
                onClick={() => setActiveStep(i)}
              >
                {/* Step Number Badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-black flex items-center justify-center shadow-md">
                  {i + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} shadow-lg flex items-center justify-center mb-5`}>
                  {step.icon}
                </div>

                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{step.label}</p>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">{step.desc}</p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600">
                  {step.note}
                </div>
              </div>
            ))}
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`rounded-full transition-all duration-300 ${
                  activeStep === i ? "w-8 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section id="testimonials" className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-4 border border-amber-200">
              <Star className="h-3.5 w-3.5 fill-current" />
              آراء المعلمين
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
              ماذا يقول المعلمون{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                عن تجربتهم؟
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-700 text-sm leading-relaxed font-medium flex-1 mb-6">
                  "{t.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${t.color} text-white font-black text-base flex items-center justify-center shadow-md`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ──────────────────────────────── */}
      <section id="faq" className="py-20 sm:py-28 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold mb-4 border border-slate-300">
              <ChevronDown className="h-3.5 w-3.5" />
              الأسئلة الشائعة
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              أسئلة يسألها المعلمون دائماً
            </h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-2xl border bg-white overflow-hidden transition-all duration-300 ${
                  activeFaq === i ? "border-primary shadow-md" : "border-slate-200 hover:border-primary/40"
                }`}
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-right"
                >
                  <span className={`text-sm font-bold transition-colors ${activeFaq === i ? "text-primary" : "text-slate-900"}`}>
                    {faq.q}
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 ${activeFaq === i ? "rotate-180 text-primary" : ""}`} />
                </button>

                {activeFaq === i && (
                  <div className="px-5 pb-5 animate-in slide-in-from-top-1">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium border-t border-slate-100 pt-4">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA SECTION ────────────────────────── */}
      <section className="py-20 sm:py-28 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]" />
          {/* Stars */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold mb-8">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              ابدأ الآن بخطوات بسيطة
            </div>

            <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
              وفّر وقتك وجهدك اليوم
              <br />
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-sky-400 bg-clip-text text-transparent">
                مع تحضير ذكي
              </span>
            </h2>

            <p className="text-slate-400 text-base sm:text-xl font-medium mb-10 max-w-2xl mx-auto">
              انضم لأكثر من <strong className="text-white">1,200 معلم</strong> يستخدمون منصتنا يومياً لتوفير وقتهم وتقديم تحضيرات احترافية عالية الجودة.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                onClick={() => navigate("/signup")}
                size="lg"
                className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-black rounded-2xl h-14 px-8 text-base shadow-xl transition-all gap-2"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                أنشئ حسابك الآن
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <button
                onClick={() => {/* يفتح الزر العائم */}}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-7 rounded-2xl border-2 border-white/25 bg-white/10 text-white font-bold text-base hover:bg-white/20 transition-all"
              >
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                تواصل معنا — بدون انتظار
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="text-slate-400">خصوصيتك محمية</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-slate-400">إعداد فوري — لا انتظار</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-purple-400 fill-purple-400" />
                <span className="text-slate-400">تقييم 5 نجوم من معلمينا</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-slate-950 py-8 border-t border-slate-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-white font-black text-sm">منصة تحضير ذكي</p>
                <p className="text-slate-500 text-[11px] font-medium">مدعوم بأحدث نماذج الذكاء الاصطناعي</p>
              </div>
            </div>

            {/* Copyright & Owner */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-[11px] text-slate-500 font-semibold">
              <p>© جميع الحقوق محفوظة — منصة تحضير ذكي</p>
              <p className="text-slate-400">
                صاحب حقوق التصميم:{" "}
                <strong className="text-white font-bold">د. محمود جاد مصطفى</strong>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
