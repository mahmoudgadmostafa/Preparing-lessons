import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  LogOut,
  Shield,
  Gauge,
  Camera,
  X,
  CheckCircle2,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Trash2,
  Clock,
  Calendar,
  Layers,
  Zap,
  Check,
  ChevronRight,
  HelpCircle,
  LayoutGrid,
  List,
  Flame,
  FileCheck,
  ArrowUpRight,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/firebase";
import { doc, collection, query, where, deleteDoc, onSnapshot } from "firebase/firestore";
import { processLessonWithGemini } from "@/services/aiService";

interface TeacherData {
  teacherName: string;
  subject: string;
  phone: string;
  role?: string;
  dailyLessonLimit?: number | null;
}

interface Lesson {
  id: string;
  title: string;
  subject: string;
  className?: string;
  date?: string;
  createdAt: any;
  [key: string]: any;
}

const POPULAR_SUBJECTS = [
  "اللغة العربية",
  "الرياضيات",
  "العلوم",
  "الدراسات الاجتماعية",
  "اللغة الإنجليزية",
  "التربية الدينية",
  "الحاسب الآلي",
  "المهارات المهنية",
];

const Index = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEffect, setFlashEffect] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "TODAY" | "WEEK">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const isAdmin = useMemo(() => {
    return teacherData?.role === 'admin' || user?.email === 'mahmoudgadmostafa@gmail.com';
  }, [teacherData?.role, user?.email]);

  useEffect(() => {
    if (!user) {
      setIsLoadingLessons(false);
      return;
    }

    setIsLoadingLessons(true);

    // 1. Real-time listener for user profile
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setTeacherData(snapshot.data() as TeacherData);
        }
      },
      (error) => {
        console.error('Error in real-time user listener:', error);
      }
    );

    // 2. Real-time listener for user's lessons
    const lessonsQ = query(
      collection(db, "lessons"),
      where("userId", "==", user.uid)
    );
    const unsubscribeLessons = onSnapshot(
      lessonsQ,
      (querySnapshot) => {
        const fetchedLessons: Lesson[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedLessons.push({ id: docSnap.id, ...data } as Lesson);
        });

        // Sort by createdAt descending
        fetchedLessons.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setLessons(fetchedLessons);
        setIsLoadingLessons(false);
      },
      (error) => {
        console.error("Error in real-time lessons listener:", error);
        setIsLoadingLessons(false);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeLessons();
    };
  }, [user]);

  const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا التحضير نهائياً؟")) return;

    try {
      await deleteDoc(doc(db, "lessons", lessonId));
      setLessons(lessons.filter((l) => l.id !== lessonId));
      toast({ title: "تم الحذف", description: "تم حذف الدرس بنجاح من أرشيفك." });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حذف الدرس، يرجى المحاولة لاحقاً.", variant: "destructive" });
    }
  };

  const getTodayLessonsCount = () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return lessons.filter((lesson) => {
      if (!lesson.createdAt) return false;
      let lessonDate: Date;
      if (typeof lesson.createdAt.toDate === 'function') {
        lessonDate = lesson.createdAt.toDate();
      } else {
        lessonDate = new Date(lesson.createdAt);
      }
      return lessonDate >= startOfToday;
    }).length;
  };

  const getWeekLessonsCount = () => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    return lessons.filter((lesson) => {
      if (!lesson.createdAt) return false;
      let lessonDate: Date;
      if (typeof lesson.createdAt.toDate === 'function') {
        lessonDate = lesson.createdAt.toDate();
      } else {
        lessonDate = new Date(lesson.createdAt);
      }
      return lessonDate >= startOfWeek;
    }).length;
  };

  const todayCount = getTodayLessonsCount();
  const dailyLimit = teacherData?.dailyLessonLimit;
  const isLimitReached = !isAdmin && dailyLimit !== undefined && dailyLimit !== null && dailyLimit >= 0 && todayCount >= dailyLimit;
  const remainingLessons = dailyLimit !== undefined && dailyLimit !== null && dailyLimit >= 0 ? Math.max(0, dailyLimit - todayCount) : null;

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch =
        (lesson.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lesson.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lesson.className || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        selectedSubjectFilter === "ALL" || lesson.subject === selectedSubjectFilter;

      let matchesTime = true;
      if (timeFilter !== "ALL" && lesson.createdAt) {
        let lessonDate: Date = typeof lesson.createdAt.toDate === 'function' ? lesson.createdAt.toDate() : new Date(lesson.createdAt);
        const now = new Date();

        if (timeFilter === "TODAY") {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          matchesTime = lessonDate >= startOfToday;
        } else if (timeFilter === "WEEK") {
          const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesTime = lessonDate >= startOfWeek;
        }
      }

      return matchesSearch && matchesSubject && matchesTime;
    });
  }, [lessons, searchQuery, selectedSubjectFilter, timeFilter]);

  // Extract distinct subjects from lessons
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    lessons.forEach((l) => {
      if (l.subject && l.subject.trim()) {
        subjects.add(l.subject.trim());
      }
    });
    return Array.from(subjects);
  }, [lessons]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (files) {
        // Merge files
        const dataTransfer = new DataTransfer();
        Array.from(files).forEach((f) => dataTransfer.items.add(f));
        Array.from(e.target.files).forEach((f) => dataTransfer.items.add(f));
        setFiles(dataTransfer.files);
      } else {
        setFiles(e.target.files);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (files) {
        const dataTransfer = new DataTransfer();
        Array.from(files).forEach((f) => dataTransfer.items.add(f));
        Array.from(e.dataTransfer.files).forEach((f) => dataTransfer.items.add(f));
        setFiles(dataTransfer.files);
      } else {
        setFiles(e.dataTransfer.files);
      }
    }
  };

  const removeSingleFile = (index: number) => {
    if (!files) return;
    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((f, i) => {
      if (i !== index) dataTransfer.items.add(f);
    });
    setFiles(dataTransfer.files.length > 0 ? dataTransfer.files : null);
  };

  // --- Camera Functions ---
  const openCamera = async () => {
    setIsCameraOpen(true);
    setIsCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      toast({
        title: "تعذر فتح الكاميرا",
        description: "يرجى التأكد من منح الإذن للمتصفح للوصول إلى الكاميرا.",
        variant: "destructive",
      });
      setIsCameraOpen(false);
    } finally {
      setIsCameraLoading(false);
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {}
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const photoNum = capturedPhotos.length + 1;
        const file = new File([blob], `camera_photo_${Date.now()}_${photoNum}.jpg`, { type: 'image/jpeg' });
        setCapturedPhotos((prev) => [...prev, file]);
        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 200);
      },
      'image/jpeg',
      0.92
    );
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmCameraPhotos = () => {
    closeCamera();
    toast({
      title: `تم حفظ ${capturedPhotos.length} صورة بنجاح`,
      description: "اضغط على زر 'إنشاء ملف التحضير' لبدء التحليل الذكي.",
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج",
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


  const allFilesToProcess = (): File[] => {
    const fromInput = files ? Array.from(files) : [];
    return [...fromInput, ...capturedPhotos];
  };

  const totalFilesCount = (files ? files.length : 0) + capturedPhotos.length;

  const handleUpload = async () => {
    const allFiles = allFilesToProcess();
    if (allFiles.length === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار ملف أو تصوير صورة واحدة على الأقل.",
        variant: "destructive",
      });
      return;
    }

    if (isLimitReached) {
      toast({
        title: "تجاوز الحد اليومي",
        description: `لقد استنفدت حدك اليومي البالغ (${dailyLimit} دروس). يرجى التواصل مع إدارة المنصة لزيادة الحد.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let lessonData: any = null;

      // 1. Try Supabase Edge Function first
      try {
        const formData = new FormData();
        allFiles.forEach((file) => {
          formData.append('files', file);
        });

        const { data, error } = await supabase.functions.invoke('process-lesson', {
          body: formData,
        });

        if (!error && data && !data.error) {
          lessonData = data;
        } else {
          console.warn('Supabase edge function fallback trigger:', error || data?.error);
        }
      } catch (edgeErr) {
        console.warn('Edge function invoke error:', edgeErr);
      }

      // 2. Direct Gemini Fallback if edge function unavailable or fails
      if (!lessonData) {
        console.log('Processing lesson using direct Gemini 2.0 API fallback...');
        lessonData = await processLessonWithGemini(allFiles);
      }

      toast({
        title: "تمت المعالجة بنجاح! ✨",
        description: "تم استخراج محتوى الدرس وتحليله، جاري نقلك لصفحة المعاينة والتحرير.",
      });

      navigate('/preparation', { state: { lessonData } });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في المعالجة",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء قراءة الصور بالذكاء الاصطناعي",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFriendlyDate = (dateVal: any) => {
    if (!dateVal) return "مُضاف حديثاً";
    try {
      const d: Date = typeof dateVal.toDate === 'function' ? dateVal.toDate() : new Date(dateVal);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `اليوم، ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return `أمس، ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        return `منذ ${diffDays} أيام`;
      } else {
        return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      return "مُضاف حديثاً";
    }
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-900 flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background Glow Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-40 right-1/4 w-[550px] h-[550px] bg-sky-400/10 rounded-full blur-[130px]" />
      </div>

      {/* Sticky Header Navbar */}
      <nav className="sticky top-0 z-40 glass-card border-b border-slate-200/70 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => navigate('/')}
          >
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-primary/25 group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary group-hover:rotate-6 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-primary to-indigo-700 bg-clip-text text-transparent tracking-tight">
                  تحضير ذكي
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                  AI PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                المنصة الذكية الأولى لإعداد وطباعة دفاتر الدروس
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Limit Indicator Pill */}
            {teacherData && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs font-semibold text-slate-700">
                <Gauge className={`h-3.5 w-3.5 ${isLimitReached ? 'text-rose-500' : 'text-primary'}`} />
                <span>
                  اليومي:{" "}
                  <strong className={isLimitReached ? "text-rose-600" : "text-slate-900"}>
                    {todayCount}
                  </strong>
                  {dailyLimit !== undefined && dailyLimit !== null ? ` / ${dailyLimit}` : " (مفتوح)"}
                </span>
              </div>
            )}

            {/* Admin Dashboard Pill */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 font-bold rounded-xl h-10 px-3.5 shadow-sm"
              >
                <Shield className="h-4 w-4 text-indigo-600" />
                <span className="hidden sm:inline">لوحة الإدارة</span>
              </Button>
            )}

            {/* User Dropdown / Avatar Card */}
            {teacherData && (
              <div className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {teacherData.teacherName ? teacherData.teacherName[0] : "م"}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    أ/ {teacherData.teacherName || "المعلم"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {teacherData.subject || "المنهج التعليمي"}
                  </p>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-10 w-10 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-10 sm:pt-14 pb-14 sm:pb-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Top Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/15 via-indigo-500/15 to-sky-400/15 border border-primary/20 text-primary text-xs sm:text-sm font-bold mb-6 shadow-sm animate-fade-in hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-4 w-4 text-primary animate-spin-slow" />
              <span>الجيل الأحدث لتحضير الدروس بالذكاء الاصطناعي</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-[1.25] text-balance">
              حوّل صفحات كتابك إلى{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="bg-gradient-to-r from-primary via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  تحضير وزاري احترافي
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-primary/30"
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                >
                  <path d="M0 6 Q 50 12, 100 6" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>{" "}
              في ثوانٍ معدودة
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mb-8 leading-relaxed font-medium text-balance">
              التقط بالكاميرا أو ارفع صور المنهج، ودع الذكاء الاصطناعي يقوم بصياغة الأهداف السلوكية، استراتيجيات التدريس، الأنشطة، والتقويم بتنسيق Word قابل للتعديل الفوري.
            </p>

            {/* Quick Metrics Strip */}
            <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
              <div className="glass-card p-3.5 rounded-2xl text-center border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xl sm:text-2xl font-black">10 ثوانٍ</span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600">سرعة التحليل والإنشاء</p>
              </div>

              <div className="glass-card p-3.5 rounded-2xl text-center border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-center gap-1.5 text-indigo-600 mb-1">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-xl sm:text-2xl font-black">Word & PDF</span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600">تصدير جاهز للطباعة</p>
              </div>

              <div className="glass-card p-3.5 rounded-2xl text-center border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
                  <Flame className="h-4 w-4" />
                  <span className="text-xl sm:text-2xl font-black">{lessons.length}</span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600">إجمالي دروسك المحضرة</p>
              </div>

              <div className="glass-card p-3.5 rounded-2xl text-center border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-center gap-1.5 text-sky-600 mb-1">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xl sm:text-2xl font-black">100%</span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-600">مطابق لدليل المعلم</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace (Bento Grid) */}
      <main className="container mx-auto px-4 sm:px-6 -mt-4 mb-20 relative z-20 flex-1">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Bento Grid Top: Upload Zone & Teacher Quick Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left/Main Column: Smart Upload & Camera Workspace (7 Cols) */}
            <div className="lg:col-span-7">
              <Card className="glass-card border-slate-200/80 shadow-premium rounded-[28px] overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-600 to-sky-400" />
                
                <CardHeader className="pt-7 px-6 sm:px-8 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl sm:text-2xl font-black text-slate-900">
                          بدء تحضير درس جديد
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
                          ارفع صور الكتاب أو استعمل الكاميرا المباشرة
                        </CardDescription>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={openCamera}
                      className="gap-2 text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 font-bold rounded-2xl h-11 px-4 shadow-sm"
                    >
                      <Camera className="h-4 w-4" />
                      <span>فتح الكاميرا 📷</span>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="px-6 sm:px-8 pb-8 space-y-6">
                  {/* Daily Limit Warning Banner */}
                  {isLimitReached && (
                    <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
                      <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                        <Gauge className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-bold text-rose-900">تنبيه: تم استهلاك الحد اليومي ({dailyLimit} دروس)</p>
                        <p className="text-xs text-rose-700 mt-0.5">
                          لقد قمت بتحضير {todayCount} درس اليوم. للتوسعة يرجى التواصل مع إدارة الموقع.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dropzone Container */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
                      isDragging
                        ? 'border-primary bg-primary/10 scale-[0.99]'
                        : files && files.length > 0
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-slate-300 hover:border-primary/60 hover:bg-slate-50/60'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="dropzone-file"
                    />

                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                        {totalFilesCount > 0 && (
                          <div className="absolute -top-1 -left-1 bg-emerald-500 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                            {totalFilesCount}
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
                        {totalFilesCount > 0
                          ? `تم تحديد ${totalFilesCount} عنصر للتحضير`
                          : "اسحب الملفات هنا أو اضغط للتصفح"}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4">
                        يدعم صور صفحات الكتاب (JPG, PNG)، مستندات PDF، وملفات النصوص.
                      </p>

                      {/* File format badges */}
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {["صور JPG / PNG", "مستندات PDF", "ملفات Word", "التقاط فوري"].map((format) => (
                          <span
                            key={format}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-slate-600 shadow-2xs"
                          >
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Files Tray */}
                  {files && files.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-primary" />
                          الملفات المرفوعة من الجهاز ({files.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => setFiles(null)}
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          مسح الملفات
                        </button>
                      </div>

                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                        {Array.from(files).map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="truncate text-right">
                                <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSingleFile(idx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Captured Photos Reel */}
                  {capturedPhotos.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <Camera className="h-4 w-4 text-indigo-600" />
                          لقطات الكاميرا الملتقطة ({capturedPhotos.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => setCapturedPhotos([])}
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          مسح اللقطات
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                        {capturedPhotos.map((photo, i) => (
                          <div
                            key={i}
                            className="relative group rounded-2xl overflow-hidden border-2 border-indigo-200 bg-white aspect-square shadow-2xs"
                          >
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`لقطة ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <span className="absolute bottom-1 right-1 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                              #{i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary Action Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={totalFilesCount === 0 || isUploading}
                    className="w-full h-15 text-base sm:text-lg font-black bg-gradient-to-r from-primary via-indigo-600 to-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.99] transition-all rounded-2xl gap-3 text-white disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري المعالجة والتحليل بالذكاء الاصطناعي...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 text-amber-300" />
                        <span>
                          {totalFilesCount > 0
                            ? `إنشاء ملف التحضير (${totalFilesCount} ملف/صورة) ✨`
                            : "اختر ملفات أو التقط صوراً للمتابعة"}
                        </span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right/Side Column: User Status & Smart Guide (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Teacher Profile & Limits Card */}
              <Card className="glass-card border-slate-200/80 shadow-md rounded-[28px] overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-primary/20">
                      {teacherData?.teacherName ? teacherData.teacherName[0] : "م"}
                    </div>
                    <div className="text-right flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">
                          أ/ {teacherData?.teacherName || "المعلم الفاضل"}
                        </h3>
                        {isAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            مدير
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        التخصص: {teacherData?.subject || "عام"} • {teacherData?.phone || "مسجل"}
                      </p>
                    </div>
                  </div>

                  {/* Daily Limit Meter */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="h-4 w-4 text-primary" />
                        رصيد التحضير اليومي
                      </span>
                      <span>
                        {dailyLimit !== undefined && dailyLimit !== null ? (
                          <>
                            <strong>{todayCount}</strong> / {dailyLimit} درس
                          </>
                        ) : (
                          <span className="text-emerald-600 font-extrabold">غير محدود ♾️</span>
                        )}
                      </span>
                    </div>

                    {dailyLimit !== undefined && dailyLimit !== null && (
                      <div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLimitReached
                                ? 'bg-rose-500'
                                : todayCount / dailyLimit > 0.7
                                ? 'bg-amber-500'
                                : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, (todayCount / dailyLimit) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[11px] font-semibold text-slate-500">
                          <span>متبقي اليوم: {remainingLessons} درس</span>
                          {isLimitReached && (
                            <span className="text-rose-600 font-bold">تم الوصول للحد</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick 3-Step Guide */}
              <Card className="glass-card border-slate-200/80 shadow-md rounded-[28px] overflow-hidden">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    كيف يعمل النظام في 3 خطوات بسيطة؟
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-3 space-y-3">
                  {[
                    {
                      step: "01",
                      title: "التقط أو ارفع المحتوى",
                      desc: "صوّر صفحة الدرس من كتاب الوزارة أو ارفع ملف PDF.",
                      color: "text-primary bg-primary/10",
                    },
                    {
                      step: "02",
                      title: "التحليل الذكي التلقائي",
                      desc: "يستخرج النظام الأهداف، الاستراتيجيات، والتمهيد المناسب.",
                      color: "text-indigo-600 bg-indigo-50",
                    },
                    {
                      step: "03",
                      title: "التعديل والتحميل الفوري",
                      desc: "عدل براحتك على النموذج ثم حمّل ملف Word أو PDF بضغطة زر.",
                      color: "text-emerald-600 bg-emerald-50",
                    },
                  ].map((st, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 transition-colors"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${st.color} font-black text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {st.step}
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-bold text-slate-800">{st.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pro Tips Box */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles className="h-28 w-28 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <h4 className="text-sm font-bold text-amber-300">نصائح للحصول على أفضل دقة:</h4>
                </div>
                <ul className="space-y-2 text-slate-300 text-xs leading-relaxed font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>تأكد من وضوح إضاءة الكاميرا واستواء صفحة الكتاب.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>التقاط أكثر من صفحة للدرس الواحد يعطي صياغة أشمل للأهداف.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section: Lessons Archive & Previous Preparations */}
          <section className="pt-8">
            <div className="glass-card rounded-[32px] p-6 sm:p-8 border border-slate-200/80 shadow-premium space-y-6">
              {/* Archive Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        أرشيف تحضيراتي الذكية
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                        إجمالي دروسك المحفوظة: <strong className="text-primary">{lessons.length}</strong> درس
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Mode & Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Time Filter Tabs */}
                  <div className="flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/70 text-xs font-bold">
                    <button
                      onClick={() => setTimeFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        timeFilter === "ALL"
                          ? "bg-white text-primary shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      الكل ({lessons.length})
                    </button>
                    <button
                      onClick={() => setTimeFilter("TODAY")}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        timeFilter === "TODAY"
                          ? "bg-white text-primary shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      اليوم ({todayCount})
                    </button>
                    <button
                      onClick={() => setTimeFilter("WEEK")}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        timeFilter === "WEEK"
                          ? "bg-white text-primary shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      هذا الأسبوع ({getWeekLessonsCount()})
                    </button>
                  </div>

                  {/* Grid / List View Switch */}
                  <div className="hidden sm:flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/70">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "grid" ? "bg-white text-primary shadow-xs" : "text-slate-500"
                      }`}
                      title="عرض بطاقات"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "list" ? "bg-white text-primary shadow-xs" : "text-slate-500"
                      }`}
                      title="عرض قائمة"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search & Subject Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search input */}
                <div className="sm:col-span-8 relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="ابحث بالعنوان، المادة، أو الفصل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pr-10 pl-9 rounded-2xl bg-white border border-slate-200/80 shadow-2xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs sm:text-sm font-medium text-slate-800"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Subject Selector */}
                <div className="sm:col-span-4">
                  <select
                    value={selectedSubjectFilter}
                    onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                    className="w-full h-11 px-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs sm:text-sm font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="ALL">جميع المواد والتخصصات</option>
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lessons Content Feed */}
              {isLoadingLessons ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-48 rounded-3xl bg-slate-200/60 animate-pulse border border-slate-200/50"
                    />
                  ))}
                </div>
              ) : filteredLessons.length > 0 ? (
                viewMode === "grid" ? (
                  /* Grid View Cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() =>
                          navigate('/preparation', {
                            state: { lessonData: lesson, lessonId: lesson.id },
                          })
                        }
                        className="group relative bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                      >
                        {/* Glowing top line */}
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary/40 via-indigo-500/40 to-sky-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Top Card Bar */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex items-center justify-center shadow-inner">
                            <FileText className="h-5 w-5" />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-80 group-hover:opacity-100 transition-all"
                              onClick={(e) => handleDeleteLesson(e, lesson.id)}
                              title="حذف الدرس"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Title & Subject */}
                        <div className="mb-4">
                          <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors mb-2 leading-snug">
                            {lesson.title || "درس بدون عنوان"}
                          </h3>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/60">
                              {lesson.subject || "بدون مادة"}
                            </span>
                            {lesson.className && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                                فصل: {lesson.className}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatFriendlyDate(lesson.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-1 text-primary group-hover:translate-x-[-2px] transition-transform text-xs font-black">
                            <span>فتح للتعديل</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* List View Table */
                  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                    <table className="w-full text-right text-xs sm:text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                        <tr>
                          <th className="p-3.5">عنوان الدرس</th>
                          <th className="p-3.5 hidden md:table-cell">المادة</th>
                          <th className="p-3.5 hidden sm:table-cell">الفصل</th>
                          <th className="p-3.5">تاريخ الإعداد</th>
                          <th className="p-3.5 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {filteredLessons.map((lesson) => (
                          <tr
                            key={lesson.id}
                            onClick={() =>
                              navigate('/preparation', {
                                state: { lessonData: lesson, lessonId: lesson.id },
                              })
                            }
                            className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                          >
                            <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="truncate max-w-xs">{lesson.title}</span>
                            </td>
                            <td className="p-3.5 hidden md:table-cell">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                                {lesson.subject || "—"}
                              </span>
                            </td>
                            <td className="p-3.5 hidden sm:table-cell text-slate-500">
                              {lesson.className || "—"}
                            </td>
                            <td className="p-3.5 text-slate-500 text-xs">
                              {formatFriendlyDate(lesson.createdAt)}
                            </td>
                            <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate('/preparation', {
                                      state: { lessonData: lesson, lessonId: lesson.id },
                                    })
                                  }
                                  className="h-8 text-xs font-bold rounded-lg gap-1 text-primary border-primary/30 hover:bg-primary/5"
                                >
                                  <span>فتح</span>
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => handleDeleteLesson(e, lesson.id)}
                                  className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* Empty State */
                <div className="text-center py-16 px-4 bg-white/80 rounded-3xl border-2 border-dashed border-slate-200/90 max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {searchQuery || selectedSubjectFilter !== "ALL" || timeFilter !== "ALL"
                      ? "لا توجد نتائج مطابقة للبحث"
                      : "لم تقم بإعداد أي دروس بعد"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">
                    {searchQuery || selectedSubjectFilter !== "ALL" || timeFilter !== "ALL"
                      ? "جرب تعديل كلمات البحث أو تصفية المواد."
                      : "ارفع أول صورة لدرسك الآن واكتشف روعة وسرعة التحضير بالذكاء الاصطناعي."}
                  </p>
                  <Button
                    onClick={() => document.getElementById('dropzone-file')?.click()}
                    className="rounded-xl px-6 font-bold bg-primary text-white text-xs h-10 shadow-sm"
                  >
                    بدء أول تحضير الآن
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Modern Responsive Footer */}
      <footer className="mt-auto py-8 glass-card border-t border-slate-200/70 relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            {/* Brand Logo & Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">منصة تحضير ذكي</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  مدعوم بأحدث نماذج الذكاء الاصطناعي لخدمة المعلم المصري والعربي
                </p>
              </div>
            </div>

            {/* Copyright & Creator Credit */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-[11px] font-semibold text-slate-500">
              <p>© جميع الحقوق محفوظة لـ منصة تحضير ذكي</p>
              <p className="text-slate-600">
                صاحب حقوق التصميم: <strong className="text-slate-900 font-bold">د. محمود جاد مصطفى</strong>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden Canvas for Camera Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* High Quality Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col" dir="rtl">
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-md z-10 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeCamera}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <h3 className="text-white font-bold text-sm">استوديو الكاميرا الذكية</h3>
                <p className="text-[10px] text-slate-400">التقط صفحات الكتاب بوضوح</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {capturedPhotos.length > 0 && (
                <span className="bg-primary text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md">
                  {capturedPhotos.length} صورة ملتقطة
                </span>
              )}
              <button
                type="button"
                onClick={switchCamera}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                title="تبديل الكاميرا"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Video Feed Workspace */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
            {isCameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-bold text-sm">جاري فتح الكاميرا...</p>
                </div>
              </div>
            )}

            {/* Flash Effect Indicator */}
            {flashEffect && (
              <div className="absolute inset-0 bg-white z-30 pointer-events-none opacity-90 transition-opacity" />
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-h-screen"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {/* Framing Guide for Book Pages */}
            <div className="absolute inset-6 sm:inset-12 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-4 border-r-4 border-primary/80 rounded-tr-xl" />
                <div className="w-8 h-8 border-t-4 border-l-4 border-primary/80 rounded-tl-xl" />
              </div>
              <div className="text-center">
                <span className="bg-black/60 text-white/90 text-[11px] font-semibold px-4 py-1 rounded-full backdrop-blur-sm">
                  ضع صفحة الكتاب داخل الإطار واضغط زر التصوير
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-4 border-r-4 border-primary/80 rounded-br-xl" />
                <div className="w-8 h-8 border-b-4 border-l-4 border-primary/80 rounded-bl-xl" />
              </div>
            </div>
          </div>

          {/* Bottom Toolbar & Shutter Strip */}
          <div className="bg-black/85 backdrop-blur-md p-5 border-t border-white/10 z-10">
            {/* Captured Photos Preview Reel */}
            {capturedPhotos.length > 0 && (
              <div className="flex gap-2.5 mb-4 overflow-x-auto pb-2 scrollbar-thin">
                {capturedPhotos.map((photo, i) => (
                  <div
                    key={i}
                    className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-primary shadow-md"
                  >
                    <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center shadow"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    <span className="absolute bottom-0.5 left-0.5 text-[9px] font-black bg-black/70 text-white px-1 rounded">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={closeCamera}
                className="text-white/80 hover:text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl"
              >
                إلغاء
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={capturePhoto}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-white/40 hover:scale-95 active:scale-90 transition-transform shadow-2xl flex items-center justify-center mx-auto"
                title="التقاط صورة"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center">
                  <Camera className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </button>

              {/* Confirm / Finish Button */}
              <button
                type="button"
                onClick={confirmCameraPhotos}
                disabled={capturedPhotos.length === 0}
                className={`flex items-center gap-2 text-xs sm:text-sm font-black py-2.5 px-5 rounded-2xl transition-all ${
                  capturedPhotos.length > 0
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30'
                    : 'text-white/30 cursor-not-allowed bg-white/5'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>حفظ ({capturedPhotos.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;