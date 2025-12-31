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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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
    const imageParts: any[] = [];
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
        
        imageParts.push({
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64}` }
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
        imageParts.push({
          type: "image_url",
          image_url: { url: `data:application/pdf;base64,${base64}` }
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
    const systemPrompt = `أنت خبير تربوي متخصص في إعداد أوراق تحضير الدروس. مهمتك الأساسية هي:

📖 **تحليل المحتوى بدقة:**
- اقرأ وحلل كل كلمة وجملة في المحتوى المقدم (صور أو نصوص)
- استخرج عنوان الدرس **الحقيقي الموجود في المحتوى** وليس عنوان مختلق
- حدد الأفكار الرئيسية والفرعية للدرس
- استخرج المفاهيم والمصطلحات المهمة

📝 **إعداد ورقة التحضير:**
بناءً على تحليلك الدقيق للمحتوى، أعد ورقة تحضير تتضمن:

1. **عنوان الدرس**: العنوان الفعلي كما يظهر في المحتوى
2. **الأهداف**: أهداف سلوكية مشتقة من محتوى الدرس الفعلي (تبدأ بـ: يذكر، يشرح، يحدد، يقارن، يحلل، يطبق...)
3. **الاستراتيجيات**: مناسبة لطبيعة المحتوى
4. **التهيئة**: مقدمة تربط بالمعرفة السابقة وتمهد للمحتوى الفعلي
5. **عرض الدرس**: شرح مفصل للمحتوى الموجود مع الأمثلة والتفاصيل الفعلية
6. **التقويم**: أسئلة تقيس فهم المحتوى الفعلي للدرس
7. **الواجب**: مرتبط بمحتوى الدرس الفعلي

⚠️ **تعليمات صارمة:**
- لا تخترع أو تخمن معلومات غير موجودة في المحتوى
- إذا كان المحتوى غير واضح، اذكر ذلك صراحة
- استخدم الأمثلة والتفاصيل الموجودة في المحتوى نفسه
- كل ما تكتبه يجب أن يكون مستند للمحتوى المقدم

قدم النتيجة بتنسيق JSON فقط:
{
  "title": "عنوان الدرس الفعلي من المحتوى",
  "objectives": ["هدف 1 مبني على المحتوى", "هدف 2", "هدف 3", "هدف 4"],
  "strategies": ["استراتيجية مناسبة 1", "استراتيجية مناسبة 2"],
  "preparation": "تهيئة مفصلة مرتبطة بمحتوى الدرس الفعلي",
  "presentation": "شرح مفصل وواضح لمحتوى الدرس مع كل التفاصيل والأمثلة المذكورة",
  "evaluation": "أسئلة تقويمية محددة مبنية على محتوى الدرس",
  "homework": "واجب منزلي مرتبط بالمحتوى الفعلي"
}`;

    let userPrompt = '';
    
    if (imageParts.length > 0 && textContent.length > 50) {
      userPrompt = `حلل الصور والنصوص التالية بدقة واستخرج منها بيانات تحضير الدرس.

النص المستخرج:
${textContent}

قم بتحليل الصور المرفقة أيضاً واستخدم كل المعلومات المتاحة.`;
    } else if (imageParts.length > 0) {
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

    // Build messages
    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    if (imageParts.length > 0) {
      const userContent: any[] = [{ type: "text", text: userPrompt }, ...imageParts];
      messages.push({ role: 'user', content: userContent });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    console.log(`Sending to AI: ${imageParts.length} images, ${textContent.length} chars text`);

    // Use gemini-2.5-pro for best analysis quality
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: messages,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'الرجاء إضافة رصيد إلى حسابك' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received successfully');

    let lessonData;
    try {
      const content = aiData.choices[0].message.content;
      console.log('AI extracted content preview:', content.substring(0, 800));
      lessonData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'فشل في تحليل الرد. يرجى المحاولة مرة أخرى.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and return
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
