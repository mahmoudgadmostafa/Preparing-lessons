import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. يرجى إعداد مفتاح Google Gemini API.');
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${files.length} files`);

    // Prepare images for AI vision analysis
    const geminiImageParts: any[] = [];
    let textContent = '';

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      const fileBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);
      
      // Images - use vision capabilities (BEST FOR ANALYSIS)
      if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const base64 = encodeBase64(uint8Array);
        const mimeType = fileName.endsWith('.png') ? 'image/png' : 
                         fileName.endsWith('.gif') ? 'image/gif' :
                         fileName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        
        geminiImageParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64
          }
        });
        console.log(`✓ Added image for analysis: ${file.name} (${(uint8Array.length / 1024).toFixed(1)} KB)`);
      } 
      // Text files
      else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        const text = new TextDecoder().decode(uint8Array);
        textContent += `\n\n=== محتوى ملف ${file.name} ===\n${text}`;
        console.log(`✓ Added text file: ${file.name}`);
      }
      // PDF files - convert to base64 and let AI try to analyze
      else if (fileName.endsWith('.pdf')) {
        const base64 = encodeBase64(uint8Array);
        geminiImageParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: base64
          }
        });
        console.log(`✓ Added PDF for analysis: ${file.name} (${(uint8Array.length / 1024).toFixed(1)} KB)`);
      }
      // Word files - try text extraction
      else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
        const cleanText = text.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\u00A0-\u00FF\n\r\t]/g, ' ')
                              .replace(/\s+/g, ' ').trim();
        if (cleanText.length > 100) {
          textContent += `\n\n=== محتوى ملف ${file.name} ===\n${cleanText.substring(0, 15000)}`;
          console.log(`✓ Extracted text from Word: ${file.name} (${cleanText.length} chars)`);
        } else {
          console.log(`⚠ Could not extract text from ${file.name} - recommend image upload`);
        }
      }
    }

    // Build the detailed analysis prompt
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

⚠️ **تعليمات صارمة:**
- لا تخترع أو تخمن معلومات غير موجودة في المحتوى
- استخدم الأرقام والمعطيات الرياضية الموجودة في المحتوى نفسه

قدم النتيجة بتنسيق JSON فقط:
{
  "title": "عنوان الدرس الفعلي من المحتوى",
  "objectives": ["هدف سلوكي أو مهاري 1", "هدف 2", "هدف 3"],
  "strategies": ["استراتيجية حل المشكلات / التعلم التعاوني", "استراتيجية العصف الذهني"],
  "preparation": "تهيئة حافزة مرتبطة بالخبرات السابقة وتطرح لغزاً أو مسألة تمهيدية",
  "presentation": "عرض مفصل يتضمن القوانين والمفاهيم الرياضية ومثالاً محلولاً بالخطوات (المعطيات، المطلوب، الحل)",
  "evaluation": "أسئلة وتقويمات رياضية محددة تقيس مهارة حل المسائل",
  "homework": "مسألة رياضية تطبيقية أو واجب منزلي"
}`;

    let userPrompt = '';
    
    if (geminiImageParts.length > 0 && textContent.length > 50) {
      userPrompt = `حلل الصور والنصوص التالية بدقة واستخرج منها بيانات تحضير الدرس.

النص المستخرج:
${textContent}

قم بتحليل الصور المرفقة أيضاً واستخدم كل المعلومات المتاحة.`;
    } else if (geminiImageParts.length > 0) {
      userPrompt = `اقرأ وحلل الصور المرفقة بعناية فائقة:
- استخرج عنوان الدرس الظاهر في الصور
- اقرأ كل النصوص والمحتوى الموجود
- حدد الأفكار الرئيسية والتفاصيل
- استخدم المعلومات الفعلية لملء ورقة التحضير

لا تخمن - استخدم فقط ما تراه في الصور.`;
    } else if (textContent.length > 50) {
      userPrompt = `حلل النص التالي بدقة واستخرج منه بيانات تحضير الدرس:

${textContent}

استخدم المعلومات الموجودة في النص فقط، لا تخترع معلومات إضافية.`;
    } else {
      return new Response(
        JSON.stringify({ error: 'لم يتم العثور على محتوى قابل للتحليل. يرجى رفع صورة واضحة من الدرس.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Gemini API request parts
    const contentsParts: any[] = [{ text: systemPrompt + "\n\n" + userPrompt }];
    
    // Add image parts in Gemini native format
    for (const imgPart of geminiImageParts) {
      contentsParts.push(imgPart);
    }

    console.log(`Sending to Gemini API: ${geminiImageParts.length} images, ${textContent.length} chars text`);

    // Call Google Gemini API directly (FREE tier - gemini-2.0-flash)
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentsParts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Gemini API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('Gemini API response received successfully');

    let lessonData;
    try {
      // Gemini response format: candidates[0].content.parts[0].text
      const content = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Empty response from Gemini API');
      }
      console.log('Gemini extracted content preview:', content.substring(0, 800));
      lessonData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return new Response(
        JSON.stringify({ error: 'فشل في تحليل الرد. يرجى المحاولة مرة أخرى.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and return (SAME OUTPUT FORMAT AS BEFORE)
    const result = {
      title: lessonData.title || 'عنوان الدرس غير محدد',
      objectives: Array.isArray(lessonData.objectives) && lessonData.objectives.length > 0 
        ? lessonData.objectives 
        : ['لم يتم استخراج الأهداف بشكل صحيح'],
      strategies: Array.isArray(lessonData.strategies) && lessonData.strategies.length > 0 
        ? lessonData.strategies 
        : ['الحوار والمناقشة'],
      preparation: lessonData.preparation || 'لم يتم استخراج التهيئة',
      presentation: lessonData.presentation || 'لم يتم استخراج عرض الدرس',
      evaluation: lessonData.evaluation || 'لم يتم استخراج التقويم',
      homework: lessonData.homework || 'لم يتم استخراج الواجب'
    };

    console.log('Successfully processed lesson:', result.title);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-lesson:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
