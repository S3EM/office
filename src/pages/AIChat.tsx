import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Search, UserPlus, Printer, Trash, Edit, FileText } from 'lucide-react';
import { useSettings } from '@/store/SettingsContext';
import { processUserCommand, AICommandResult } from '@/services/geminiService';
import { googleSheetsService } from '@/services/googleSheetsService';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  metadata?: AICommandResult;
}

export const AIChat: React.FC = () => {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'مرحباً بك! أنا المساعد الذكي لمكتب النائب. كيف يمكنني مساعدتك اليوم؟ (مثال: "ضيف أحمد في ملف الصحة" أو "البحث عن محمد السيد")',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize SpeechRecognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'ar-EG'; // Arabic Egypt
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        // Auto send after hearing
        handleSend(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast.error('لم نتمكن من سماعك بوضوح');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast.error('متصفحك لا يدعم التعرف على الصوت');
        return;
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        toast.error('حدث خطأ أثناء تشغيل الميكروفون');
        setIsListening(false);
      }
    }
  };

  const executeAction = async (result: AICommandResult) => {
    try {
      if (result.action === 'PRINT') {
        setTimeout(() => {
          window.print();
        }, 500);
      } else if (result.action === 'ADD') {
        setIsProcessing(true);
        try {
          await googleSheetsService.addRequest(settings.appsScriptUrl || '', {
            name: result.entityName || 'بدون اسم',
            phone: result.phone || 'غير مسجل',
            type: result.targetDocType || 'عام',
            details: result.details || '',
            status: 'قيد المراجعة',
            date: new Date().toLocaleDateString('ar-EG'),
          });
          toast.success(`تم إضافة ${result.entityName || 'الطلب'} بنجاح في النظام.`);
        } catch (addError: any) {
           // Catch local save warning
           toast.success(addError.message, { icon: '⚠️' });
        }
      } else if (result.action === 'UPDATE') {
        setIsProcessing(true);
        try {
          await googleSheetsService.updateRequest(settings.appsScriptUrl || '', {
            name: result.entityName || '',
            status: result.newStatus
          });
          toast.success(`تم التعديل بنجاح في النظام.`);
        } catch (updateError: any) {
           toast.success(updateError.message, { icon: '⚠️' });
        }
      } else if (result.action === 'DELETE') {
        setIsProcessing(true);
        try {
          await googleSheetsService.deleteRequest(settings.appsScriptUrl || '', result.entityName || '');
          toast.success(`تم الحذف بنجاح في النظام`);
        } catch (deleteError: any) {
          toast.success(deleteError.message, { icon: '⚠️' });
        }
      } else if (result.action === 'SEARCH') {
        setIsProcessing(true);
        const searchRes = await googleSheetsService.searchRequest(settings.appsScriptUrl, result.entityName || '');
        if (searchRes.data && searchRes.data.length > 0) {
          toast.success(`تم العثور على ${searchRes.data.length} نتيجة خُصصت بالبحث`);
        } else {
          toast.error('لم يتم العثور على نتائج للبحث المطلوب');
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء التواصل مع قاعدة البيانات (Google Sheets)');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async (textOveride?: string) => {
    const text = textOveride || inputValue;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const result = await processUserCommand(text, settings.geminiApiKey);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: result.responseMessage,
        metadata: result
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      await executeAction(result);
      
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'حدث خطأ غير متوقع';
      toast.error(errorMessage);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `عذراً، حدث خطأ: ${errorMessage}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case 'ADD': return <UserPlus size={16} className="text-green-500" />;
      case 'SEARCH': return <Search size={16} className="text-blue-500" />;
      case 'UPDATE': return <Edit size={16} className="text-yellow-500" />;
      case 'DELETE': return <Trash size={16} className="text-red-500" />;
      case 'PRINT': return <Printer size={16} className="text-purple-500" />;
      case 'VIEW': return <FileText size={16} className="text-indigo-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] no-print">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-100">المساعد الذكي</h1>
        <p className="text-slate-400 mt-1">تحدث معي لإنجاز المهام بسرعة وسهولة</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-sm shadow-emerald-500/5">
        <div className="p-4 border-b border-slate-800 bg-emerald-600/5 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h3 className="font-bold text-slate-100">المساعد الذكي (Gemini)</h3>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end ml-4' : 'justify-start gap-2'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex-shrink-0 flex items-center justify-center text-xs text-white shadow-sm mt-1">
                  AI
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-slate-200 rounded-tr-none'
                    : 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-100 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.metadata && msg.metadata.action !== 'UNKNOWN' && (
                  <div className="mt-3 bg-slate-950/50 rounded-lg p-3 text-xs flex gap-4 items-center border border-emerald-500/10 text-emerald-100/80">
                    <span className="font-semibold flex items-center gap-1.5">
                      {getActionIcon(msg.metadata.action)}
                      العملية: {msg.metadata.action}
                    </span>
                    {msg.metadata.entityName && <span>الاسم: {msg.metadata.entityName}</span>}
                    {msg.metadata.targetDocType && <span>الملف: {msg.metadata.targetDocType}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
             <div className="flex justify-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex-shrink-0 flex items-center justify-center text-xs text-white shadow-sm mt-1">AI</div>
              <div className="bg-emerald-600/10 text-emerald-100 rounded-2xl rounded-tl-none border border-emerald-500/20 px-4 py-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-2 relative">
            <button
              onClick={toggleListen}
              className={`p-3 rounded-xl flex-shrink-0 transition-all ${
                isListening 
                  ? 'bg-rose-500/20 text-rose-500 animate-pulse' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={isListening ? 'إيقاف الاستماع' : 'استخدم الميكروفون (بالعربية)'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "جاري الاستماع..." : "اكتب طلبك هنا... (مثال: بحث عن أحمد)"}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-6 text-slate-100 focus:outline-none focus:border-emerald-500 transition-all text-sm placeholder-slate-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={isProcessing}
            />
            
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isProcessing}
              className="p-3 bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 rounded-xl flex-shrink-0 disabled:opacity-50 hover:scale-105 transition-transform"
            >
              <Send size={20} className="transform rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
