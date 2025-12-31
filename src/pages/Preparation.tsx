import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Printer, Edit, Save, Loader2, CheckCircle, Sparkles, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShapeEditor } from "@/components/ShapeEditor";
import { RichTextEditor } from "@/components/RichTextEditor";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
// @ts-ignore
import html2pdf from "html2pdf.js";

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

  const handlePrint = () => {
    const content = document.getElementById("printable-content");
    if (content) {
      // Standard A4 height at 96 DPI is approx 1123px.
      // We subtract some buffer for margins/padding (20px top + 20px bottom = ~40px).
      const MAX_HEIGHT = 1080;

      // 1. Force width to A4 width to ensure text wrapping matches print output
      const originalWidth = content.style.width;
      content.style.width = "794px"; // A4 width at 96 DPI

      // 2. Reset zoom to 1 to get accurate natural height
      content.style.zoom = "1";

      // 3. Measure height
      const currentHeight = content.scrollHeight;

      // 4. Calculate required scale
      let newZoom = 1;
      if (currentHeight > MAX_HEIGHT) {
        newZoom = MAX_HEIGHT / currentHeight;
        // Add a tiny buffer to ensure it fits
        newZoom = Math.floor(newZoom * 100) / 100 - 0.01;
      }

      // 5. Apply calculated zoom
      // We use a CSS variable or direct style. Since we have a ref, direct style is easiest.
      // However, we want this to persist during the print dialog.
      content.style.zoom = newZoom.toString();

      // 6. Restore width (optional, but keep it consistent for the print dialog)
      // The @media print usually overrides width to 100%, but we want to ensure the wrapping we measured persists if possible
      // or rely on the @media print width matching our measurement width (794px).
      content.style.width = ""; // Let CSS handle it, assuming @media print sets it correctly

      // Set the calculated zoom modification
      document.documentElement.style.setProperty('--print-zoom', newZoom.toString());
    }

    const cleanup = () => {
      const content = document.getElementById("printable-content");
      if (content) {
        content.style.zoom = "";
        content.style.width = "";
        document.documentElement.style.removeProperty('--print-zoom');
      }
    };

    window.addEventListener("afterprint", cleanup, { once: true });

    // Small timeout to allow styles to apply before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("printable-content");
    if (!element) return;

    // Show loading toast
    toast({
      title: "جاري تصدير PDF",
      description: "يرجى الانتظار بينما يتم تجهيز الملف للتحميل...",
    });

    try {
      const originalZoom = element.style.zoom;
      const originalWidth = element.style.width;
      const originalTransition = element.style.transition;

      // Prepare for measurement
      element.style.transition = 'none';
      element.classList.add('pdf-export-active');
      element.style.width = "794px";
      element.style.zoom = "1";

      // Calculate required zoom to fit on fixed A4 height (1080px)
      const MAX_HEIGHT = 1080;
      const currentHeight = element.scrollHeight;

      let finalZoom = 1;
      if (currentHeight > MAX_HEIGHT) {
        finalZoom = (MAX_HEIGHT / currentHeight) - 0.02;
      }
      element.style.zoom = finalZoom.toString();

      const opt = {
        margin: [2, 2, 2, 2] as [number, number, number, number], // Smaller margins for PDF to gain space
        filename: `${lessonData.title || 'تحضير'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();

      // Cleanup
      element.classList.remove('pdf-export-active');
      element.style.width = originalWidth;
      element.style.zoom = originalZoom;
      element.style.transition = originalTransition;

      toast({
        title: "تم التحميل",
        description: "تم تحميل ملف PDF بنجاح في صفحة واحدة.",
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

      {/* Preparation Sheet */}
      <main className="container mx-auto px-2 sm:px-4 py-6 md:py-10 max-w-4xl">
        <div
          id="printable-content"
          className="bg-white shadow-premium p-4 sm:p-8 md:p-12 border border-slate-100 rounded-[2rem] mx-auto overflow-hidden transition-all duration-300"
        >


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

      {/* Shape Editor Modal */}
      <ShapeEditor
        isOpen={isShapeEditorOpen}
        onClose={() => setIsShapeEditorOpen(false)}
        onSave={handleShapeSave}
      />

      <style>{`
        @media print {
          /* General Reset */
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          /* Print Container */
          #printable-content, #printable-content * {
            visibility: visible;
          }

          html, body {
            height: 100vh;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important; /* Critical for single page */
            background: white !important;
          }
          
          /* تحسين الخطوط للطباعة */
          #printable-content {
            font-family: "Traditional Arabic", "Simplified Arabic", "Amiri", serif;
            font-weight: 600;
            line-height: 1.3;
            font-size: 11pt; /* Slightly smaller for better fit */
            direction: rtl;
          }

          #printable-content {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            /* Use a slight zoom to fit more content if needed - safe for Chrome/Edge */
            zoom: var(--print-zoom, 0.95); 
            padding: 5mm !important;
            margin: 0 !important;
            border: none !important;
            display: flex;
            flex-direction: column;
            background: white !important;
          }

          /* Top Sections */
          #printable-content > *:not(table:last-of-type) {
            flex-shrink: 0;
            margin-bottom: 4px !important; /* Tighten vertical spacing */
          }
          
          /* Compact Header Inputs/Divs */
          #printable-content .min-h-\\[24px\\] { min-height: auto !important; }
          #printable-content .mb-4 { margin-bottom: 4px !important; }
          #printable-content .p-2 { padding: 2px !important; }

          /* Main Table Container */
          #printable-content > table:last-of-type {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            border: 2px solid black !important;
            margin-top: 2px;
            height: auto !important;
            overflow: hidden; /* Prevent table itself from spilling */
          }

          #printable-content > table:last-of-type tbody {
            display: flex;
            flex-direction: column;
            flex: 1;
            width: 100%;
            overflow: hidden;
          }

          /* Table Rows */
          #printable-content > table:last-of-type tr {
            display: flex;
            width: 100%;
            border-bottom: 1px solid black;
          }
          
          #printable-content > table:last-of-type tr:last-child {
            border-bottom: none;
          }

          /* Titles styling */
          .font-bold {
             font-weight: 800 !important;
             font-size: 12pt !important;
          }
          
          /* First Row: Preparation */
          #printable-content > table:last-of-type tr:first-child {
            flex: 0 0 auto;
          }
          /* Reduce height of Preparation textarea preview */
          #printable-content > table:last-of-type tr:first-child .min-h-\\[60px\\] {
             min-height: 40px !important;
          }

          /* Second Row: Presentation (Expand based on content, but shrinkable if desperate) */
          #printable-content > table:last-of-type tr:nth-child(2) {
             flex: 0 1 auto; /* Allow shrinking if absolutely necessary, but preferred auto */
             min-height: 100px;
             overflow: hidden; /* If it shrinks, clip nicely rather than explode */
          }

          /* Third Row: Evaluation (Fill remaining space) */
          #printable-content > table:last-of-type tr:last-child {
             flex: 1 1 auto;
             min-height: 60px; /* Ensure at least this much is visible */
             display: flex;
             flex-direction: column;
          }

          /* Cells */
          #printable-content > table:last-of-type td,
          #printable-content > table:last-of-type th {
            display: block;
            width: 100%;
            padding: 4px 6px; /* Compact padding */
            border: none !important;
          }

          /* Ensure content inside Evaluation expands */
          #printable-content > table:last-of-type tr:last-child td {
             flex: 1;
             display: flex;
             flex-direction: column;
             height: 100%;
          }
           
          #printable-content > table:last-of-type tr:last-child td > div {
             flex: 1;
             display: flex !important;
             flex-direction: column;
          }
          
          #printable-content > table:last-of-type tr:last-child td > div > div { /* RichTextEditor internal */
             flex: 1;
             height: 100%;
             width: 100%;
             border: none !important;
          }
          
          /* Custom overrides for RichTextEditor in print */
          .prose {
             max-width: none !important;
          }
          .prose img {
             margin: 0 !important;
             max-height: 200px;
          }

          /* General Table Styles */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          td, th {
             font-size: 11pt !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        }

        /* Specialized CSS for PDF Export Mode - Matches Print Aesthetics */
        .pdf-export-active {
          font-family: "Traditional Arabic", "Simplified Arabic", "Amiri", serif !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          font-size: 11pt !important;
          background: white !important;
          padding: 5mm !important;
          display: flex !important;
          flex-direction: column !important;
          height: 1080px !important; /* Fixed A4-ish height for snapshot */
          width: 794px !important; /* Fixed A4 width */
          border: none !important;
          border-radius: 0 !important;
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
