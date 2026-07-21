// Service for calling Google Gemini API with working model fallback

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDIkMwQGH9x_3BfwXdANVvfcb0xxlBePK8";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export interface LessonResult {
  title: string;
  objectives: string[];
  strategies: string[];
  preparation: string;
  presentation: string;
  evaluation: string;
  homework: string;
}

export const processLessonWithGemini = async (files: File[]): Promise<LessonResult> => {
  if (!files || files.length === 0) {
    throw new Error("لم يتم تقديم أي ملفات");
  }

  const parts: any[] = [];
  let textContent = "";

  for (const file of files) {
    const fileName = file.name.toLowerCase();

    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const base64 = await fileToBase64(file);
      const mimeType = fileName.endsWith('.png') ? 'image/png' : 
                       fileName.endsWith('.gif') ? 'image/gif' :
                       fileName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64
        }
      });
    } else if (fileName.endsWith('.pdf')) {
      const base64 = await fileToBase64(file);
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: base64
        }
      });
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const text = await file.text();
      textContent += `\n\n=== محتوى ملف ${file.name} ===\n${text}`;
    } else {
      const text = await file.text();
      const cleanText = text.replace(/[^\u0600-\u06FF\u0020-\u007E\n\r\t]/g, ' ').trim();
      if (cleanText.length > 50) {
        textContent += `\n\n=== محتوى ملف ${file.name} ===\n${cleanText.substring(0, 15000)}`;
      }
    }
  }

  const systemPrompt = `أنت موجه تربوي وخبير في إعداد تحضير الدروس النموذجية والاحترافية للمعلمين.
مهمتك هي تحليل المحتوى المقدم (صور أو ملفات) بدقة عالية، ثم صياغة ورقة تحضير درس نموذجية ومتكاملة تناسب العرض المباشر في ورقة التحضير.

📋 **المطلوب صياغته باحترافية باللغة العربية:**

1. **عنوان الدرس**: استخرج العنوان الرئيسي الدقيق والفعلي للدرس من المحتوى.
2. **الأهداف السلوكية الإجرائية**: صغ من 3 إلى 5 أهداف سلوكية إجرائية واضحة وقابلة للقياس (مثل: أن يوضح الطالب...، أن يقارن الطالب...، أن يحلل الطالب...).
3. **استراتيجيات التدريس والتعلم النشط**: اختر استراتيجيات حديثة ومناسبة للدرس (مثل: العصف الذهني، التعلم التعاوني، التفكير الناقد، خريطة المفاهيم).
4. **التهيئة (المقدمة الحافزة)**: اكتب تهيئة مشوقة ترتبط بالمعرفة السابقة وتجذب انتباه الطلاب للموضوع.
5. **عرض الدرس وتلخيص المحتوى (العرض الاحترافي)**: اكتب تلخيصاً مفصلاً ومنظماً ومصاغاً بأسلوب تربوي رائع يشمل شرح النقاط المفتاحية، المفاهيم الرئيسية، الأمثلة الشارحة، والخطوات التعليمية التي سيشرحها المعلم.
6. **التقويم والتأكد من الفهم**: صغ أسئلة تقويمية متنوعة (تكوينية وختامية) تقيس مدى تحقق الأهداف.
7. **الواجب المنزلي (الأنشطة)**: صغ نشاطاً أو واجباً تطبيقياً يعزز فهم الطالب للدرس.

📐 **تعليمات خاصة ومميزة إذا كان الدرس في مادة "الرياضيات":**
- **الأهداف السلوكية**: التركيز على المهارات الرياضية (أن يستنتج الطالب القانون...، أن يطبق الصيغة الرياضية...، أن يحل المسألة خطوة بخطوة...، أن يمثل بيانيا...).
- **الاستراتيجيات**: دمج استراتيجيات الرياضيات مثل (حل المشكلات، النمذجة الرياضية، الخطوات الأربع لحل المسألة، الاكتشاف الموجه).
- **عرض الدرس**: 
  * كتابة القوانين والنظريات والعلاقات الرياضية بوضوح شديد.
  * إضافة **مثال محلول نموذجياً بالخطوات التفصيلية** (توضيح المعطيات، المطلوب، وخطوات الحل والناتج النهائي).
  * شرح المفاهيم الرياضية (مثل: المساحة، الزاوية، المعادلة، النسبة) بأسلوب مبسط وشامل.
- **التقويم والواجب**: تضمين مسائل تمارين محلولة وتدريبات رياضية متنوعة تقيس مهارات التفكير الرياضي.

⚠️ **قواعد التنسيق:**
أعد النتيجة فقط بتنسيق JSON حصرياً بدون أي مقدمات أو مؤخرات:
{
  "title": "عنوان الدرس الدقيق",
  "objectives": [
    "أن يحدد الطالب المفاهيم الرئيسية للدرس بدقة.",
    "أن يشرح الطالب الخطوات والأفكار الأساسية بشكل صحيح.",
    "أن يطبق الطالب ما تعلمه في حل التمارين والمسائل."
  ],
  "strategies": [
    "استراتيجية حل المشكلات",
    "استراتيجية النمذجة الرياضية / التعلم التعاوني",
    "استراتيجية العصف الذهني والمناقشة"
  ],
  "preparation": "تهيئة حافزة ومشوقة ترتبط بالخبرات الرياضية السابقة وتطرح لغزاً أو مسألة تمهيدية.",
  "presentation": "عرض الدرس بشكل منظم ومصاغ باحترافية: يتضمن شرح المفاهيم والقوانين الرياضية، مع مثال توضيحي محلول خطوة بخطوة (المعطيات، المطلوب، الحل)، وتلخيص الخطوات بأسلوب مبسط.",
  "evaluation": "تمارين وتدريبات رياضية محددة تقيس الفهم والتطبيق المباشر لدى الطلاب.",
  "homework": "مسألة رياضية تطبيقية أو نشاط تفكير واجب منزلي."
}`;

  let userPrompt = "قم بتحليل المحتوى المرفق واصنع تحضير درس نموذجي ومفصل طبقاً للشروط.";
  if (textContent.length > 0) {
    userPrompt += `\n\nالمحتوى النصي:\n${textContent}`;
  }

  const promptText = systemPrompt + "\n\n" + userPrompt;
  const contentParts: any[] = [{ text: promptText }, ...parts];

  // List of active models prioritized by quota availability
  const models = ["gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash", "gemini-2.5-pro"];
  let lastError = "";
  let data: any = null;

  for (const model of models) {
    try {
      console.log(`Sending request to Gemini API (${model})...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: contentParts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3
            }
          })
        }
      );

      if (response.ok) {
        data = await response.json();
        console.log(`Success with model: ${model}`);
        break;
      } else {
        lastError = await response.text();
        console.warn(`Model ${model} response not ok (${response.status}):`, lastError);
      }
    } catch (e) {
      console.warn(`Model ${model} exception:`, e);
    }
  }

  if (!data) {
    throw new Error(`تعذر إنشاء الدرس: ${lastError || 'يرجى التأكد من اتصال الإنترنت أو محاولة رفع الصور مجدداً'}`);
  }

  let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("لم يتم استلام رد من نموذج الذكاء الاصطناعي");
  }

  // Clean markdown syntax if present
  rawText = rawText.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    console.error("JSON parse error on raw text:", rawText);
    throw new Error("حدث خطأ أثناء معالجة تنسيق ورقة التحضير");
  }

  return {
    title: parsed.title || "عنوان الدرس غير محدد",
    objectives: Array.isArray(parsed.objectives) && parsed.objectives.length > 0 ? parsed.objectives : ["أن يستوعب الطالب المفاهيم الأساسية للدرس"],
    strategies: Array.isArray(parsed.strategies) && parsed.strategies.length > 0 ? parsed.strategies : ["المناقشة والحوار", "العصف الذهني"],
    preparation: parsed.preparation || "تهيئة مشوقة تمهد لموضوع الدرس",
    presentation: parsed.presentation || "عرض شامل وملخص لمحتوى الدرس",
    evaluation: parsed.evaluation || "أسئلة تقويم الفهم والاستيعاب",
    homework: parsed.homework || "نشاط تطبيقي واجب منزلي"
  };
};
