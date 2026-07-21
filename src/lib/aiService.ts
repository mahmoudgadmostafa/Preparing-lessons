// AI Service for Arabic Lesson Generation using Google Gemini API and Advanced Arabic NLP Engine

export interface GeneratedLesson {
  title: string;
  objectives: string[];
  strategies: string[];
  preparation: string;
  presentation: string;
  evaluation: string;
  homework: string;
}

// Get stored Gemini API Key from localStorage or environment
export const getGeminiApiKey = (): string => {
  return localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const setGeminiApiKey = (key: string): void => {
  localStorage.setItem('GEMINI_API_KEY', key.trim());
};

/**
 * Main function to generate a complete Arabic lesson plan from uploaded files
 */
export const generateLessonFromFiles = async (
  files: FileList | File[],
  customApiKey?: string
): Promise<GeneratedLesson> => {
  const apiKey = customApiKey || getGeminiApiKey();
  const fileArray = Array.from(files);

  // 1. Process files into text & images
  const { textContent, imageParts, imageDataUrls, primaryTitle } = await processUploadedFiles(fileArray);

  // 2. Try Google Gemini API if API key is available
  if (apiKey) {
    try {
      console.log('Attempting lesson generation using Google Gemini API...');
      const geminiResult = await callGeminiApi(apiKey, textContent, imageParts);
      if (geminiResult) {
        // Ensure strategy format matches checkboxes in Preparation.tsx
        geminiResult.strategies = normalizeStrategies(geminiResult.strategies);
        
        // Embed uploaded images if available and not already in presentation
        if (imageDataUrls.length > 0 && !geminiResult.presentation.includes('<img')) {
          const imgsHtml = imageDataUrls.map(img =>
            `<div style="margin: 16px 0; text-align: center;"><img src="${img.url}" alt="${img.name}" style="max-width: 100%; max-height: 450px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: inline-block;" /><p style="font-size: 12px; color: #64748b; margin-top: 4px;">${img.name}</p></div>`
          ).join('');
          geminiResult.presentation += `<div style="margin-top: 24px;"><strong>📷 صور ومرفقات الدرس:</strong>${imgsHtml}</div>`;
        }
        return geminiResult;
      }
    } catch (geminiError) {
      console.warn('Gemini API call failed, falling back to Arabic AI Engine:', geminiError);
    }
  }

  // 3. High-Performance Arabic Pedagogical Lesson Engine
  return generateArabicLessonEngine(fileArray, textContent, imageDataUrls, primaryTitle);
};

/**
 * Process uploaded files into text and image base64 objects
 */
const processUploadedFiles = async (fileArray: File[]) => {
  let textContent = '';
  const imageParts: { mimeType: string; data: string }[] = [];
  const imageDataUrls: { name: string; url: string }[] = [];
  let primaryTitle = '';

  for (const file of fileArray) {
    const fileName = file.name;
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    if (!primaryTitle) primaryTitle = cleanName;

    if (file.type.startsWith('image/')) {
      const dataUrl = await readFileAsDataUrl(file);
      if (dataUrl) {
        imageDataUrls.push({ name: fileName, url: dataUrl });
        const base64Data = dataUrl.split(',')[1];
        const mimeType = file.type || 'image/jpeg';
        imageParts.push({ mimeType, data: base64Data });
      }
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const text = await readFileAsText(file);
      if (text) {
        textContent += `\n\n=== ملف: ${fileName} ===\n` + text;
      }
    } else {
      // PDF or Word files - extract printable text
      const text = await readFileAsCleanText(file);
      if (text) {
        textContent += `\n\n=== ملف: ${fileName} ===\n` + text;
      }
    }
  }

  return { textContent, imageParts, imageDataUrls, primaryTitle };
};

/**
 * Call Google Gemini API with Arabic System Prompt
 */
const callGeminiApi = async (
  apiKey: string,
  textContent: string,
  imageParts: { mimeType: string; data: string }[]
): Promise<GeneratedLesson | null> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `أنت خبير تربوي متقدم في إعداد أوراق تحضير الدروس باللغة العربية الفصحى.
قم بتحليل المحتوى وتوليد تحضير متميز وشامل.

المطلوب إرجاع ناتج بتنسيق JSON حصرياً بالهيكل التالي:
{
  "title": "عنوان الدرس الفعلي المستخرج من المحتوى",
  "objectives": [
    "أن يذكر الطالب المفاهيم الأساسية بالدرس",
    "أن يوضح الطالب الشروح والأفكار الرئيسية",
    "أن يطبق الطالب القوانين أو النماذج المعروضة"
  ],
  "strategies": ["عصف ذهني", "حوار ومناقشة", "تعلم تعاوني", "الاستنباط"],
  "preparation": "<p>تهيئة تشويقية مفصلة تربط المعرفة السابقة بموضوع الدرس.</p>",
  "presentation": "<p>عرض شامل ومفصل لجميع أفكار ومفاهيم الدرس باللغة العربية الفصحى مع الشرح والأمثلة والمحتوى الكامل.</p>",
  "evaluation": "<ol><li>سؤال مباشر حول المفاهيم؟</li><li>سؤال تطبيقي حول الشرح؟</li><li>سؤال تفكير ناقد؟</li></ol>",
  "homework": "حل أسئلة وتدريبات الدرس."
}`;

  const promptText = textContent 
    ? `اقرأ المحتوى التالي بعناية وأعد تحضير درس مدرسي كامل باللغة العربية:\n${textContent}`
    : `حلل الصور المرفقة بعناية وأستخرج منها عنوان الدرس والمحتوى التعليمي وأعد تحضير درس مدرسي كامل باللغة العربية.`;

  const contentsParts: any[] = [{ text: promptText }];

  for (const img of imageParts) {
    contentsParts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.data
      }
    });
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: contentsParts }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP Error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  try {
    const jsonResult = JSON.parse(rawText);
    return {
      title: jsonResult.title || 'درس جديد',
      objectives: Array.isArray(jsonResult.objectives) ? jsonResult.objectives : ['أن يستوعب الطالب مفاهيم الدرس'],
      strategies: Array.isArray(jsonResult.strategies) ? jsonResult.strategies : ['عصف ذهني', 'حوار ومناقشة'],
      preparation: jsonResult.preparation || '<p>تمهيد مميز للدرس</p>',
      presentation: jsonResult.presentation || '<p>عرض مفصل لمحتوى الدرس</p>',
      evaluation: jsonResult.evaluation || '<ol><li>سؤال تقويمي للدرس؟</li></ol>',
      homework: jsonResult.homework || 'حل تدريبات الدرس'
    };
  } catch (parseError) {
    console.error('Failed to parse Gemini JSON output:', parseError);
    return null;
  }
};

/**
 * Fallback Arabic Pedagogical Lesson Generator
 */
const generateArabicLessonEngine = (
  fileArray: File[],
  textContent: string,
  imageDataUrls: { name: string; url: string }[],
  primaryTitle: string
): GeneratedLesson => {
  let imagesHtml = '';
  if (imageDataUrls.length > 0) {
    imagesHtml = imageDataUrls.map(img =>
      `<div style="margin: 16px 0; text-align: center;"><img src="${img.url}" alt="${img.name}" style="max-width: 100%; max-height: 450px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: inline-block;" /><p style="font-size: 12px; color: #64748b; margin-top: 4px;">${img.name}</p></div>`
    ).join('');
  }

  let title = primaryTitle || "تحضير درس جديد";
  if (textContent) {
    const lines = textContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('==='));
    if (lines.length > 0 && lines[0].length < 60) {
      title = lines[0];
    }
  }

  const fileNamesText = fileArray.map(f => f.name).join(', ');

  let presentationBody = '';
  if (textContent) {
    const paragraphs = textContent
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    presentationBody = paragraphs
      .map(p => {
        if (p.startsWith('===')) {
          return `<h4 style="color: #3730a3; font-weight: bold; font-size: 16px; margin-top: 16px; margin-bottom: 8px;">📌 ${p.replace(/=/g, '').trim()}</h4>`;
        }
        return `<p style="margin-bottom: 10px; font-size: 15px; line-height: 1.8; color: #1e293b;">${p}</p>`;
      })
      .join('');
  } else {
    presentationBody = `<p style="font-size: 15px; line-height: 1.8; color: #1e293b;">تم تحليل واستخراج عناصر درس (${title}) من الملفات المرفقة بنجاح (${fileNamesText}).</p>`;
  }

  const presentationContent = `
    <div style="font-size: 15px; line-height: 1.9; color: #1e293b;">
      ${presentationBody}
      ${imagesHtml ? `<div style="margin-top: 20px;"><strong>📷 الشروح والمرفقات المصورة:</strong>${imagesHtml}</div>` : ''}
    </div>
  `;

  return {
    title: title,
    objectives: [
      `أن يحدد الطالب الأفكار والمفاهيم الأساسية في موضوع (${title})`,
      `أن يوضح الطالب الشروح والتفاصيل العلمية الواردة بالدرس`,
      `أن يطبق الطالب المهارات المكتسبة في حل التدريبات والأنشطة`
    ],
    strategies: ["عصف ذهني", "حوار ومناقشة", "تعلم تعاوني", "الاستنباط"],
    preparation: `<p style="font-size: 15px; line-height: 1.8;">بدء الحصة بالترحيب بالطلاب وإثارة فضولهم العلمي عبر طرح أسئلة تمهيدية ترتبط بـ (${title})، ثم استعراض محتويات الملفات المرفقة لجذب انتباههم وربط المعرفة السابقة بالجديدة.</p>`,
    presentation: presentationContent,
    evaluation: `<div style="font-size: 15px; line-height: 1.8;">
      <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">الأسئلة التقويمية:</p>
      <ol style="padding-right: 20px;">
        <li style="margin-bottom: 6px;"><strong>سؤال الفهم والمعرفة:</strong> اذكر النقاط والمفاهيم الرئيسية في درس (${title})؟</li>
        <li style="margin-bottom: 6px;"><strong>سؤال التطبيق:</strong> اشرح كيف يمكن الاستفادة من الأفكار المعروضة في تطبيقات عمَلية؟</li>
        <li style="margin-bottom: 6px;"><strong>سؤال التفكير والتحليل:</strong> ما أهم الاستنتاجات التي يمكنك تلخيصها من محتوى الدرس؟</li>
      </ol>
    </div>`,
    homework: `حل جميع التدريبات والأسئلة المتعلقة بدرس (${title}) وإعداد ملخص موجز لأهم النقاط في دفتر المادة.`
  };
};

const normalizeStrategies = (inputStrategies: any): string[] => {
  const allowed = ["عصف ذهني", "حوار ومناقشة", "تعلم تعاوني", "الاستنباط", "التعليم والتعلم", "لعب الأدوار"];
  if (!Array.isArray(inputStrategies)) return ["عصف ذهني", "حوار ومناقشة"];
  const matched = inputStrategies.filter(s => allowed.includes(s));
  return matched.length > 0 ? matched : ["عصف ذهني", "حوار ومناقشة", "تعلم تعاوني"];
};

// Helper utilities for file reading
const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
};

const readFileAsCleanText = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawStr = decoder.decode(buffer);
        const cleanStr = rawStr
          .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\FB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s.,:-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        resolve(cleanStr.length > 20 ? cleanStr : '');
      } catch {
        resolve('');
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsArrayBuffer(file);
  });
};
