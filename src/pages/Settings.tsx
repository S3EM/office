import React, { useState } from 'react';
import { useSettings } from '@/store/SettingsContext';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey);
  const [appsScriptUrl, setAppsScriptUrl] = useState(settings.appsScriptUrl);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      geminiApiKey: geminiKey,
      appsScriptUrl: appsScriptUrl,
    });
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">الإعدادات</h1>
        <p className="text-slate-400 mt-1">تكوين إعدادات النظام وربط الخدمات الخارجية</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-semibold flex flex-col text-slate-200">
              <span>مفتاح Gemini API</span>
              <span className="text-xs text-slate-500 font-normal mt-1">
                يستخدم لتشغيل المساعد الذكي وفهم أوامر المستخدم بالعربية.
                إذا لم يتم تعيينه هنا، سيحاول النظام استخدام المتغير الافتراضي.
              </span>
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-left"
              placeholder="AIzaSy..."
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex flex-col text-slate-200">
              <span>رابط Google Apps Script</span>
              <span className="text-xs text-slate-500 font-normal mt-1">
                الرابط المستخدم لحفظ وقراءة البيانات من Google Sheets.
              </span>
            </label>
            <input
              type="text"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-left"
              placeholder="https://script.google.com/macros/s/.../exec"
              dir="ltr"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 shadow-lg shadow-emerald-900/20 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-500 transition-colors"
            >
              <Save size={18} />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-xl p-4 border border-blue-500/20 text-sm">
        <h4 className="font-semibold mb-2">تعليمات إعداد Google Sheets:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>قم بإنشاء ملف Google Sheets جديد.</li>
          <li>اذهب إلى الإضافات (Extensions) ثم Apps Script.</li>
          <li>اكتب كود الـ API (الموجود بالتوثيق الخاص بالنظام).</li>
          <li>انشر المشروع كـ Web App وانسخ الرابط الناتج وضعه في الحقل أعلاه.</li>
        </ol>
      </div>
    </div>
  );
};
