import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Printer, Edit, Save, Loader2, CheckCircle, Sparkles, BookOpen, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShapeEditor } from "@/components/ShapeEditor";
import { RichTextEditor } from "@/components/RichTextEditor";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
// @ts-ignore
import html2pdf from "html2pdf.js";
// @ts-ignore
import html2canvas from 'html2canvas';

const Preparation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(location.state?.lessonId || null);

  // Helper to convert legacy [صورة:...] and \n to HTML
  const convertLegacyToHtml = (text: any) => {
    if (!text) return "";
    const str = String(text);
    let html = str
      .replace(/\[صورة:([^\]]+)\]/g, '<img src="$1" style="max-width: 300px; display: inline-block; vertical-align: middle;" />')
      .replace(/\n/g, '<br>');
    return html;
  };

  // Initialize state with converted HTML
  const [editedData, setEditedData] = useState(() => {
    const initial = location.state?.lessonData || {};
    return {
      ...initial,
      preparation: convertLegacyToHtml(initial.preparation),
      presentation: convertLegacyToHtml(initial.presentation),
      evaluation: convertLegacyToHtml(initial.evaluation),
    };
  });

  const [isShapeEditorOpen, setIsShapeEditorOpen] = useState(false);
  const [activeShapeField, setActiveShapeField] = useState<string | null>(null);

  const lessonData = editedData;

  // Watermark State
  // Watermark State
  const [wmName, setWmName] = useState("");
  const [wmPhone, setWmPhone] = useState("");
  const [showWmName, setShowWmName] = useState(true);
  const [showWmPhone, setShowWmPhone] = useState(true);

  const [currentUserRole, setCurrentUserRole] = useState<string>("user");
  const [isWatermarkLoading, setIsWatermarkLoading] = useState(true);
  const [isPrintingImage, setIsPrintingImage] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Fetch user role and watermark info
  useEffect(() => {
    const fetchRoleAndWatermark = async () => {
      if (!user) {
        setIsWatermarkLoading(false);
        return;
      }

      try {
        // 1. Get Current User Role
        const currentUserDoc = await getDoc(doc(db, "users", user.uid));
        if (currentUserDoc.exists()) {
          const userData = currentUserDoc.data();
          setCurrentUserRole(userData.role || "user");
        }

        // 2. Determine Lesson Owner
        const ownerId = lessonData.userId || user.uid;

        // 3. Check if Watermark settings exist in Lesson Data
        if (lessonData.watermark) {
          // Check if we have new structured data
          if (lessonData.watermark.isStructured) {
            setWmName(lessonData.watermark.name || "");
            setWmPhone(lessonData.watermark.phone || "");
            setShowWmName(lessonData.watermark.showName !== false);
            setShowWmPhone(lessonData.watermark.showPhone !== false);
          } else {
            // Backward compatibility for simple text
            const text = lessonData.watermark.text || "";
            const parts = text.split(' - ');
            setWmName(parts[0]?.trim() || "");
            setWmPhone(parts[1]?.trim() || "");
            setShowWmName(true);
            setShowWmPhone(true);

            // If previously globally hidden
            if (lessonData.watermark.visible === false) {
              setShowWmName(false);
              setShowWmPhone(false);
            }
          }
        } else {
          // 4. If no custom watermark, fetch owner's profile
          if (ownerId) {
            const ownerDoc = await getDoc(doc(db, "users", ownerId));
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data();
              setWmName(ownerData.teacherName || "المعلم");
              setWmPhone(ownerData.phone || "");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching watermark info:", error);
      } finally {
        setIsWatermarkLoading(false);
      }
    };

    fetchRoleAndWatermark();
  }, [user, lessonData.userId, lessonData.watermark]);

  // Update watermark settings (Admin only)
  const updateWatermarkConfig = (updates: any) => {
    // Only allow update if admin OR specific user (Temporary bypass for debugging)
    if (currentUserRole !== 'admin' && user?.uid !== 'FXMHAk4liYTEAQ41yElKeppv8zd2') return;

    // Calculate new state
    const newName = 'name' in updates ? updates.name : wmName;
    const newPhone = 'phone' in updates ? updates.phone : wmPhone;
    const newShowName = 'showName' in updates ? updates.showName : showWmName;
    const newShowPhone = 'showPhone' in updates ? updates.showPhone : showWmPhone;

    // Update Local State
    if ('name' in updates) setWmName(updates.name);
    if ('phone' in updates) setWmPhone(updates.phone);
    if ('showName' in updates) setShowWmName(updates.showName);
    if ('showPhone' in updates) setShowWmPhone(updates.showPhone);

    // Update Lesson Data
    setEditedData((prev: any) => ({
      ...prev,
      watermark: {
        isStructured: true,
        name: newName,
        phone: newPhone,
        showName: newShowName,
        showPhone: newShowPhone,
        // Keep legacy for safety
        text: `${newName} - ${newPhone}`,
        visible: newShowName || newShowPhone
      }
    }));
  };

  // Helper to determine what to show in grid
  const getWatermarkGridItems = () => {
    const items = [];

    const showP = showWmPhone && wmPhone;
    const showN = showWmName && wmName;

    if (!showP && !showN) return [];

    for (let i = 0; i < 6; i++) {
      if (showP && showN) {
        // Alternate starting with Phone as requested previously
        items.push(i % 2 === 0 ? 'phone' : 'name');
      } else if (showP) {
        items.push('phone');
      } else if (showN) {
        items.push('name');
      }
    }
    return items;
  };



  if (!lessonData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card p-8 rounded-lg shadow-medium max-w-md text-center">
          <p className="text-muted-foreground mb-4">
            لم يتم العثور على بيانات التحضير. الرجاء العودة ورفع الملفات.
          </p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  const handlePrint = async () => {
    const content = document.getElementById("printable-content");
    if (!content) return;

    toast({
      title: "جاري المعالجة للطباعة",
      description: "يرجى الانتظار بينما يتم تجهيز الصفحة كصورة عالية الجودة...",
    });

    try {
      setIsPrintingImage(true);

      // 1. Prepare for capture
      const originalZoom = content.style.zoom;
      const originalWidth = content.style.width;
      const originalPosition = content.style.position;

      content.style.width = "794px";
      content.style.zoom = "1";
      content.style.position = "relative"; // Changed from static to keep watermark contained

      // Small delay to let layout settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // 2. Capture using html2canvas
      const canvas = await html2canvas(content, {
        scale: 4, // Ultra high precision
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const clonedContent = clonedDoc.getElementById("printable-content");
          if (clonedContent) {
            clonedContent.style.borderRadius = "2rem";
            clonedContent.style.border = "2px solid #0f172a";
            clonedContent.style.overflow = "hidden";
            clonedContent.style.margin = "0";
            clonedContent.style.padding = "10mm";
            clonedContent.style.boxShadow = "none";
            clonedContent.style.boxSizing = "border-box";
            clonedContent.style.display = "block";

            // Add a tiny bit of white space around the clone parent if needed 
            // to ensure no edge clipping of the border radius
            if (clonedContent.parentElement) {
              clonedContent.parentElement.style.padding = "2px";
              clonedContent.parentElement.style.backgroundColor = "#ffffff";
            }
          }
        }
      });

      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImage(dataUrl);

      // 3. Cleanup original view
      content.style.width = originalWidth;
      content.style.zoom = originalZoom;
      content.style.position = originalPosition;

      // 4. Trigger Print
      setTimeout(() => {
        window.print();
        // Cleanup image after print dialog
        setTimeout(() => {
          setCapturedImage(null);
          setIsPrintingImage(false);
        }, 1000);
      }, 500);

    } catch (error) {
      console.error("Print Error:", error);
      setIsPrintingImage(false);
      setCapturedImage(null);
      toast({
        title: "خطأ في الطباعة",
        description: "حدث خطأ أثناء محاولة التقاط التصميم كصورة.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("printable-content");
    if (!element) return;

    toast({
      title: "جاري تصدير PDF",
      description: "يرجى الانتظار بينما يتم تجهيز الملف بدقة عالية...",
    });

    try {
      const originalZoom = element.style.zoom;
      const originalWidth = element.style.width;
      const originalPosition = element.style.position;
      const originalTransition = element.style.transition;

      // 1. Prepare for capture (Same as high-quality print logic)
      element.style.transition = 'none';
      element.classList.add('pdf-export-active');
      element.style.width = "794px";
      element.style.zoom = "1";
      element.style.position = "relative";

      // Calculate required zoom to fit on fixed A4 height (1123px)
      const MAX_HEIGHT = 1123;
      const currentHeight = element.scrollHeight;

      if (currentHeight > MAX_HEIGHT) {
        const finalZoom = (MAX_HEIGHT / currentHeight) - 0.01;
        element.style.zoom = finalZoom.toString();
      }

      // Small delay to let styles/images settle for high precision
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: 0,
        filename: `${lessonData.title || 'تحضير'}.pdf`,
        image: { type: 'jpeg' as const, quality: 1.0 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          allowTaint: true,
          logging: false,
          letterRendering: false,
          backgroundColor: "#ffffff",
          windowWidth: 794,
          onclone: (clonedDoc) => {
            const clonedContent = clonedDoc.getElementById("printable-content");
            if (clonedContent) {
              clonedContent.style.borderRadius = "2rem";
              clonedContent.style.border = "2px solid #0f172a";
              clonedContent.style.overflow = "hidden";
              clonedContent.style.margin = "0";
              clonedContent.style.boxShadow = "none";
              clonedContent.style.boxSizing = "border-box";

              if (clonedContent.parentElement) {
                clonedContent.parentElement.style.padding = "2px";
                clonedContent.parentElement.style.backgroundColor = "#ffffff";
              }
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const, compress: true }
      };

      // Generate PDF
      await html2pdf().set(opt).from(element).save();

      // 2. Cleanup
      element.classList.remove('pdf-export-active');
      element.style.width = originalWidth;
      element.style.zoom = originalZoom;
      element.style.position = originalPosition;
      element.style.transition = originalTransition;

      toast({
        title: "تم التحميل",
        description: "تم تصدير ملف PDF بنجاح وبدقة عالية.",
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء محاولة إنشاء ملف PDF.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لحفظ التحضير",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log("Preparing to save lesson. LessonId:", lessonId);

      // Clean up the data: remove undefined values which Firestore doesn't like
      const cleanData = JSON.parse(JSON.stringify(editedData));

      // Remove metadata that shouldn't be in the document body
      delete cleanData.id;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;

      const lessonPayload = {
        ...cleanData,
        title: editedData.title || "درس جديد",
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };

      console.log("Saving payload:", lessonPayload);

      if (lessonId) {
        // Update existing lesson
        const lessonRef = doc(db, "lessons", lessonId);
        await updateDoc(lessonRef, lessonPayload);
        toast({ title: "تم التحديث", description: "تم تحديث الدرس بنجاح" });
      } else {
        // Create new lesson
        const lessonRef = collection(db, "lessons");
        const docRef = await addDoc(lessonRef, {
          ...lessonPayload,
          createdAt: serverTimestamp(),
        });
        setLessonId(docRef.id);
        toast({ title: "تم الحفظ", description: "تم حفظ الدرس الجديد في ملفك" });
      }
    } catch (error: any) {
      console.error("CRITICAL: Error saving lesson:", error);

      let errorMessage = "حدث خطأ غير متوقع";
      if (error.code === 'permission-denied') {
        errorMessage = "تم رفض الوصول: يرجى التأكد من تحديث قواعد (Firebase Rules) لمجموعة (lessons)";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "خطأ في الحفظ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      // Save current changes to state
      setIsEditing(false);
      handleSave(); // Also sync to Firestore
    } else {
      // Enter Edit Mode
      setIsEditing(true);
      toast({ title: "وضع التعديل", description: "يمكنك الآن تعديل محتوى التحضير بالكامل" });
    }
  };

  const handleShapeSave = (dataUrl: string) => {
    if (activeShapeField) {
      // Use width: 300px as default but allow max-width: 100%
      const imgTag = `<img src="${dataUrl}" style="max-width: 100%; width: 300px; display: inline-block; cursor: pointer;" />`;
      updateField(activeShapeField, (editedData[activeShapeField] || "") + imgTag);
      toast({ title: "تم الإدراج", description: "تم إضافة الشكل. اضغط عليه لتغيير حجمه." });
    }
  };

  const openShapeEditor = (field: string) => {
    setActiveShapeField(field);
    setIsShapeEditorOpen(true);
  };

  const updateField = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (field: string, value: string) => {
    setEditedData((prev: any) => {
      const currentArray = prev[field] || [];
      const exists = currentArray.includes(value);
      return {
        ...prev,
        [field]: exists
          ? currentArray.filter((item: string) => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const isChecked = (field: string, value: string) => {
    return (lessonData[field] || []).includes(value);
  };

  // استراتيجيات التعليم والتعلم
  const strategies = ["التعليم والتعلم", "عصف ذهني", "تعلم تعاوني", "حوار ومناقشة", "الاستنباط", "لعب الأدوار", "أخرى"];

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white pb-12" dir="rtl">
      {/* Header - Hidden in Print */}
      <header className="bg-white/80 backdrop-blur-md border-b print:hidden sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 h-9 text-slate-600 self-start sm:self-auto">
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 h-9 border-indigo-100 text-indigo-700 hover:bg-indigo-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden xs:inline">{isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
                <span className="xs:hidden">حفظ</span>
              </Button>

              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={handleEdit}
                className={`gap-2 h-9 ${isEditing ? 'bg-indigo-600 shadow-md shadow-indigo-200' : 'text-slate-600 border-slate-200'}`}
              >
                {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                <span className="hidden xs:inline">{isEditing ? "اعتماد التعديلات" : "تعديل المحتوى"}</span>
                <span className="xs:hidden">تعديل</span>
              </Button>

              {!isEditing && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 h-9 border-slate-200 text-slate-600">
                    <Printer className="h-4 w-4" />
                    <span className="hidden md:inline">طباعة</span>
                  </Button>
                  <Button size="sm" onClick={handleExportPDF} className="gap-2 h-9 shadow-md shadow-primary/20 bg-primary">
                    <Download className="h-4 w-4" />
                    <span className="hidden md:inline">تصدير PDF</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Admin Controls for Watermark (Visible only to Admin) */}
      {(currentUserRole === 'admin' || user?.uid === 'FXMHAk4liYTEAQ41yElKeppv8zd2') && (
        <div className="container mx-auto px-4 mt-4 print:hidden">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
            <span className="text-sm font-bold text-amber-800 flex items-center gap-2 whitespace-nowrap">
              <Shield className="h-4 w-4" />
              تحكم المشرف (العلامة المائية):
            </span>

            <div className="flex flex-wrap items-center gap-4 w-full">
              {/* Name Control */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={wmName}
                  onChange={(e) => updateWatermarkConfig({ name: e.target.value })}
                  placeholder="اسم المعلم"
                  className={`px-3 py-1.5 text-sm border rounded-md w-full transition-colors ${showWmName ? 'bg-white border-amber-300' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                  disabled={!showWmName}
                />
                <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={showWmName}
                    onChange={(e) => updateWatermarkConfig({ showName: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className={showWmName ? "text-amber-900" : "text-gray-500"}>إظهار</span>
                </label>
              </div>

              {/* Phone Control */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={wmPhone}
                  onChange={(e) => updateWatermarkConfig({ phone: e.target.value })}
                  placeholder="رقم الهاتف"
                  className={`px-3 py-1.5 text-sm border rounded-md w-full transition-colors ${showWmPhone ? 'bg-white border-amber-300' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                  disabled={!showWmPhone}
                />
                <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={showWmPhone}
                    onChange={(e) => updateWatermarkConfig({ showPhone: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className={showWmPhone ? "text-amber-900" : "text-gray-500"}>إظهار</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preparation Sheet */}
      <main className="container mx-auto px-2 sm:px-4 py-6 md:py-10 max-w-4xl">
        <div
          id="printable-content"
          className="bg-white shadow-premium p-4 sm:p-8 md:p-12 border border-slate-100 rounded-[2rem] mx-auto overflow-hidden transition-all duration-300 relative"
        >
          {/* Watermark Element */}
          {(showWmName || showWmPhone) && (
            <div className="watermark-container pointer-events-none absolute inset-0 z-50 overflow-hidden">
              {/* Professional Grid Pattern */}
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 grid-rows-3 gap-8 opacity-[0.05] p-8">
                {getWatermarkGridItems().map((type, i) => {
                  const content = type === 'name' ? wmName.trim() : wmPhone.trim();

                  return (
                    <div key={i} className="flex items-center justify-center">
                      <div className={`transform ${type === 'name' ? '-rotate-[15deg]' : '-rotate-[25deg]'} border-4 ${type === 'name' ? 'border-slate-900/40' : 'border-slate-800/30'} px-10 py-8 rounded-[2rem] flex flex-col items-center justify-center mix-blend-multiply backdrop-blur-[1px]`}>
                        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 whitespace-nowrap text-center px-4 leading-tight" style={{ fontFamily: 'serif' }}>
                          {content}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          {/* جدول التاريخ والحصة والفصل - مع قابلية التمرير على الجوال */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 scrollbar-thin">
            <table className="w-full border-collapse border-2 border-slate-900 text-sm min-w-[600px] sm:min-w-0">
              <tbody>
                {['التاريخ', 'الحصة', 'الفصل'].map((rowLabel, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border-2 border-slate-900 p-2 w-20 text-center font-bold bg-slate-50 text-slate-800">{rowLabel}</td>
                    {Array.from({ length: 7 }).map((_, colIndex) => {
                      const key = `schedule_r${rowIndex}_c${colIndex}`;
                      return (
                        <td key={colIndex} className="border-2 border-slate-900 p-2 w-16 text-center">
                          {isEditing ? (
                            <input
                              type="text"
                              value={lessonData[key] || ""}
                              onChange={(e) => updateField(key, e.target.value)}
                              className="w-full h-full bg-slate-50/50 rounded border-none outline-none text-center focus:bg-white transition-colors"
                            />
                          ) : (
                            <span className="font-medium text-slate-700">{lessonData[key] || ""}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* موضوع الدرس */}
          <div className="border-2 border-slate-900 mb-6 p-4 rounded-xl bg-slate-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="font-extrabold text-slate-900 whitespace-nowrap text-lg">موضوع الدرس:</span>
              <div className="flex-1 border-b-2 border-dotted border-slate-400 min-h-[32px] flex items-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={lessonData.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-lg font-bold text-primary focus:text-indigo-700"
                    placeholder="أدخل عنوان الدرس..."
                  />
                ) : (
                  <span className="text-lg font-bold text-primary">{lessonData.title || "بدون عنوان"}</span>
                )}
              </div>
            </div>
          </div>

          {/* نواتج التعليم والتعلم */}
          <div className="border-2 border-slate-900 mb-6 p-4 rounded-xl bg-slate-50/30">
            <p className="font-extrabold text-slate-900 mb-4 text-base">نواتج التعليم والتعلم: <span className="text-slate-500 font-medium">في نهاية الدرس ينبغي أن يكون الطالب قادرًا على أن:</span></p>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold leading-none shrink-0">{index + 1}</span>
                  <div className="flex-1 border-b-2 border-dotted border-slate-300 min-h-[28px] flex items-center group-hover:border-primary/30 transition-colors">
                    {isEditing ? (
                      <input
                        type="text"
                        value={(lessonData.objectives || [])[index] || ""}
                        onChange={(e) => {
                          const newObjectives = [...(lessonData.objectives || [])];
                          newObjectives[index] = e.target.value;
                          updateField("objectives", newObjectives);
                        }}
                        className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-700 focus:text-primary transition-colors"
                        placeholder="أدخل ناتج التعلم..."
                      />
                    ) : (
                      <span className="text-sm font-medium text-slate-700">{(lessonData.objectives || [])[index] || "---"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* استراتيجيات التعليم والتعلم */}
          <div className="border-2 border-slate-900 mb-6 p-4 rounded-xl bg-slate-50/30">
            <div className="flex flex-col gap-4">
              <span className="font-extrabold text-slate-900 border-b-2 border-slate-200 pb-2">استراتيجيات التعليم والتعلم المتبعة:</span>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {strategies.map((s) => (
                  <label key={s} className={`flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-lg transition-colors ${isEditing ? 'hover:bg-slate-100' : ''}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked("strategies", s) ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                      {isChecked("strategies", s) && <CheckCircle className="h-3 w-3 text-white" />}
                      <input
                        type="checkbox"
                        checked={isChecked("strategies", s)}
                        onChange={() => toggleArrayValue("strategies", s)}
                        disabled={!isEditing}
                        className="hidden"
                      />
                    </div>
                    <span className={`text-sm font-medium ${isChecked("strategies", s) ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* الجدول الرئيسي */}
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="w-full border-collapse border-2 border-slate-900 text-sm min-w-[500px] sm:min-w-0">
              <tbody>
                {/* صف التهيئة */}
                <tr>
                  <td className="border-2 border-slate-900 p-4 align-top bg-white">
                    <div className="font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      التهيئة ومقدمة الدرس:
                    </div>
                    <div className="border-2 border-dotted border-slate-200 p-3 rounded-lg min-h-[80px] hover:border-primary/20 transition-colors">
                      <RichTextEditor
                        value={lessonData.preparation || ""}
                        onChange={(html) => updateField("preparation", html)}
                        onRequestShape={() => openShapeEditor("preparation")}
                        disabled={!isEditing}
                        className={!isEditing ? "border-none shadow-none p-0 min-h-0" : "bg-white"}
                        placeholder="ابدأ بكتابة التمهيد المشوق هنا..."
                      />
                    </div>
                  </td>
                </tr>

                {/* صف عرض الدرس */}
                <tr>
                  <td className="border-2 border-slate-900 p-4 align-top bg-slate-50/20">
                    <div className="font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                      عرض الدرس والأنشطة:
                    </div>
                    <div className="border-2 border-dotted border-slate-200 p-3 rounded-lg min-h-[200px] bg-white hover:border-primary/20 transition-colors">
                      <RichTextEditor
                        value={lessonData.presentation || ""}
                        onChange={(html) => updateField("presentation", html)}
                        onRequestShape={() => openShapeEditor("presentation")}
                        disabled={!isEditing}
                        className={!isEditing ? "border-none shadow-none p-0 min-h-0" : "flex-1 min-h-[300px]"}
                        placeholder="سرد محتوى الدرس والاستراتيجيات المنفذة..."
                      />
                    </div>
                  </td>
                </tr>

                {/* صف التقويم */}
                <tr>
                  <td className="border-2 border-slate-900 p-4 align-top bg-white">
                    <div className="flex flex-col gap-3">
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        التقويم والتحقق من النواتج:
                      </div>
                      <div className="border-2 border-dotted border-slate-200 p-3 rounded-lg min-h-[100px] hover:border-primary/20 transition-colors">
                        <RichTextEditor
                          value={lessonData.evaluation || ""}
                          onChange={(html) => updateField("evaluation", html)}
                          onRequestShape={() => openShapeEditor("evaluation")}
                          disabled={!isEditing}
                          className={!isEditing ? "border-none shadow-none p-0 min-h-0" : "min-h-[150px]"}
                          placeholder="الأسئلة والتقييمات الختامية..."
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Captured Image for Perfect Print */}
      {capturedImage && (
        <div id="print-image-container" className="fixed inset-0 z-[999999] bg-white flex items-center justify-center print:block hidden">
          <img
            src={capturedImage}
            className="w-full h-full block"
            style={{ width: '210mm', height: '297mm', objectFit: 'fill' }}
          />
        </div>
      )}

      {/* Shape Editor Modal */}
      <ShapeEditor
        isOpen={isShapeEditorOpen}
        onClose={() => setIsShapeEditorOpen(false)}
        onSave={handleShapeSave}
      />

      <style>{`
  @media print {
    /* Safe hide everything */
    body {
      visibility: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    /* Force show ONLY the captured image container */
    #print-image-container,
    #print-image-container img {
      visibility: visible !important;
      display: block !important;
    }

    #print-image-container {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      z-index: 999999 !important;
      background: white !important;
    }

    @page {
      size: A4;
      margin: 0 !important;
    }
  }

        /* Specialized CSS for PDF Export Mode - Matches Print Aesthetics */
        .pdf-export-active {
          font-family: "Traditional Arabic", "Simplified Arabic", "Amiri", serif !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          font-size: 11pt !important;
          background: white !important;
          padding: 10mm !important;
          display: flex !important;
          flex-direction: column !important;
          height: 1123px !important; 
          width: 794px !important; 
          border: 2px solid #0f172a !important;
          border-radius: 2rem !important;
          overflow: hidden !important;
        }

        .pdf-export-active table {
          border-collapse: collapse !important;
          width: 100% !important;
        }

        .pdf-export-active > table:last-of-type {
          flex-grow: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          border: 2px solid black !important;
        }

        .pdf-export-active > table:last-of-type tbody {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
        }

        .pdf-export-active > table:last-of-type tr {
          display: flex !important;
          width: 100% !important;
          border-bottom: 1px solid black !important;
        }

        .pdf-export-active td, .pdf-export-active th {
          padding: 4px 6px !important;
        }

        .pdf-export-active .prose img {
          max-height: 180px !important;
          margin: 0 !important;
        }

        .pdf-export-active .mb-6, .pdf-export-active .mb-8 {
          margin-bottom: 4px !important;
        }
      `}</style>
    </div>
  );
};

export default Preparation;
