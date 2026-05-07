import { GoogleGenAI, Type } from "@google/genai";

export interface AICommandResult {
  action: 'ADD' | 'SEARCH' | 'UPDATE' | 'DELETE' | 'PRINT' | 'VIEW' | 'UNKNOWN';
  targetDocType?: string; // صحة, توظيف, نقل
  entityName?: string;
  phone?: string;
  details?: string;
  newStatus?: string;
  responseMessage: string;
}

export const processUserCommand = async (command: string, customApiKey?: string): Promise<AICommandResult> => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('لم يتم تعيين مفتاح Gemini API. يرجى إضافته في الإعدادات.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: command,
    config: {
      systemInstruction: `أنت مساعد ذكي ونظام إداري لمكتب نائب بالبرلمان.
مهمتك هي فهم أوامر المستخدم العربية وتحويلها إلى عمليات (أفعال) منظمة.
العمليات المتاحة هي: ADD, SEARCH, UPDATE, DELETE, PRINT, VIEW.
أنواع الملفات المتاحة هي: صحة, توظيف, نقل.

أمثلة للأوامر:
- "ضيف أحمد علي في ملف الصحة" -> ADD, name: "أحمد علي", type: "صحة"
- "دور على محمد السيد" -> SEARCH, name: "محمد السيد"
- "عدل رقم تليفون أحمد لـ 010123" -> UPDATE, name: "أحمد", phone: "010123"
- "خلي حالة محمد أحمد مقبول" -> UPDATE, name: "محمد أحمد", newStatus: "مقبول"
- "امسح محمد السيد من السجل" -> DELETE, name: "محمد السيد"
- "اطبع ملف الصحة اليوم" -> PRINT, type: "صحة"

في التعديل للوصول (UPDATE)، يمكنك تعديل الحالة (newStatus) مثل: "مقبول"، "مرفوض"، "قيد المراجعة" أو "مكتمل".
يجب أن تعيد استجابة بصيغة JSON تحتوي على الحقول المطلوبة مع رسالة ودية رداً على العملية.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: "نوع العملية (ADD, SEARCH, UPDATE, DELETE, PRINT, VIEW, UNKNOWN)",
          },
          targetDocType: {
            type: Type.STRING,
            description: "نوع الملف إن وجد (صحة، توظيف، نقل)",
          },
          entityName: {
            type: Type.STRING,
            description: "اسم المواطن المستهدف من الأمر إن وجد",
          },
          phone: {
            type: Type.STRING,
            description: "رقم هاتف المواطن إن وجد",
          },
          details: {
            type: Type.STRING,
            description: "أي تفاصيل أخرى استخرجتها",
          },
          newStatus: {
            type: Type.STRING,
            description: "الحالة الجديدة للمواطن (مثال: مقبول، مرفوض، قيد المراجعة، مكتمل)",
          },
          responseMessage: {
            type: Type.STRING,
            description: "رسالة ودية ترد على المستخدم وتوضح ما سيتم تنفيذه بالعربية.",
          }
        },
        required: ["action", "responseMessage"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  return JSON.parse(text.trim()) as AICommandResult;
};
