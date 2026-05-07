import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/AuthContext';
import { Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      login();
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-xl border border-slate-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20 text-white mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">مكتب النائب</h1>
          <p className="text-slate-400 mt-2">تسجيل الدخول للنظام الإداري</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3 top-3 text-slate-500" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-100 placeholder-slate-500"
                placeholder="أدخل اسم المستخدم"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-slate-500" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-100 placeholder-slate-500"
                placeholder="أدخل كلمة المرور"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 py-3 rounded-xl font-medium hover:bg-emerald-500 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
