import React, { useState } from 'react';
import { X } from 'lucide-react';
import { googleSheetsService } from '@/services/googleSheetsService';
import { useSettings } from '@/store/SettingsContext';
import toast from 'react-hot-toast';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: 'صحة',
    details: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('يرجى تعبئة الحقول الأساسية (الاسم ورقم الهاتف)');
      return;
    }

    setIsSubmitting(true);
    try {
      await googleSheetsService.addRequest(settings.appsScriptUrl || '', {
        name: formData.name,
        phone: formData.phone,
        type: formData.type,
        details: formData.details,
        status: 'قيد المراجعة',
        date: new Date().toLocaleDateString('ar-EG'),
      });

      toast.success('تمت إضافة الطلب بنجاح وتم ربطه بالنظام');
      setFormData({ name: '', phone: '', type: 'صحة', details: '' });
      onSuccess();
      onClose();
    } catch (error: any) {
      // إشعار لو تم الحفظ محلياً فقط
      toast.success(error.message, { duration: 5000, icon: '⚠️' });
      setFormData({ name: '', phone: '', type: 'صحة', details: '' });
      onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">إضافة طلب جديد</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">اسم المواطن *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-100 placeholder-slate-600"
              placeholder="الاسم الثلاثي"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">رقم الهاتف *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-100 placeholder-slate-600"
              placeholder="مثال: 01012345678"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">نوع الطلب</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-100 appearance-none"
            >
              <option value="صحة">صحة</option>
              <option value="توظيف">توظيف</option>
              <option value="نقل">نقل</option>
              <option value="عام">عام</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">تفاصيل الطلب</label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-100 placeholder-slate-600 resize-none"
              placeholder="اكتب التوضيحات هنا..."
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-300 hover:text-white transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'حفظ وإضافة'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
