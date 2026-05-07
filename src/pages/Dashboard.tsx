import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Users, HeartPulse, HardHat, TrendingUp, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestParams, googleSheetsService } from '@/services/googleSheetsService';
import { useSettings } from '@/store/SettingsContext';
import { NewRequestModal } from '@/components/NewRequestModal';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [requests, setRequests] = useState<RequestParams[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { settings } = useSettings();

  const dynamicStats = useMemo(() => {
    let total = requests.length;
    let health = 0;
    let employment = 0;
    let transport = 0;

    let currentMonthCount = { total: 0, health: 0, employment: 0, transport: 0 };
    let previousMonthCount = { total: 0, health: 0, employment: 0, transport: 0 };

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }

    requests.forEach(req => {
      if (req.type === 'صحة') health++;
      else if (req.type === 'توظيف') employment++;
      else if (req.type === 'نقل') transport++;

      let reqDate = new Date(); // Default to today if unparseable
      if (req.date) {
        let englishDateStr = req.date.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
        englishDateStr = englishDateStr.replace(/[\u200E\u200F]/g, '');
        let d = new Date(englishDateStr);
        if (isNaN(d.getTime())) {
          const parts = englishDateStr.split(/[-/]/);
          if (parts.length >= 3) {
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        }
        if (!isNaN(d.getTime())) {
          reqDate = d;
        }
      }

      const reqMonth = reqDate.getMonth();
      const reqYear = reqDate.getFullYear();

      if (reqMonth === currentMonth && reqYear === currentYear) {
        currentMonthCount.total++;
        if (req.type === 'صحة') currentMonthCount.health++;
        else if (req.type === 'توظيف') currentMonthCount.employment++;
        else if (req.type === 'نقل') currentMonthCount.transport++;
      } else if (reqMonth === prevMonth && reqYear === prevYear) {
        previousMonthCount.total++;
        if (req.type === 'صحة') previousMonthCount.health++;
        else if (req.type === 'توظيف') previousMonthCount.employment++;
        else if (req.type === 'نقل') previousMonthCount.transport++;
      }
    });

    const getTrend = (current: number, previous: number) => {
      if (current === previous) {
         return { text: 'بدون تغيير', color: 'text-slate-500' };
      }
      if (previous === 0 && current > 0) {
         return { text: '+100% هذا الشهر', color: 'text-emerald-400' };
      }
      const p = Math.round(((current - previous) / previous) * 100);
      if (p > 0) return { text: `+${p}% هذا الشهر`, color: 'text-emerald-400' };
      if (p < 0) return { text: `${p}% هذا الشهر`, color: 'text-rose-400' };
      return { text: 'بدون تغيير', color: 'text-slate-500' };
    };

    return [
      { id: 1, label: 'طلبات الصحة', value: health.toString(), icon: HeartPulse, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: getTrend(currentMonthCount.health, previousMonthCount.health).text, trendColor: getTrend(currentMonthCount.health, previousMonthCount.health).color, filterValue: 'صحة' },
      { id: 2, label: 'طلبات التوظيف', value: employment.toString(), icon: HardHat, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: getTrend(currentMonthCount.employment, previousMonthCount.employment).text, trendColor: getTrend(currentMonthCount.employment, previousMonthCount.employment).color, filterValue: 'توظيف' },
      { id: 3, label: 'طلبات النقل', value: transport.toString(), icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: getTrend(currentMonthCount.transport, previousMonthCount.transport).text, trendColor: getTrend(currentMonthCount.transport, previousMonthCount.transport).color, filterValue: 'نقل' },
      { id: 4, label: 'إجمالي الطلبات', value: total.toString(), icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: getTrend(currentMonthCount.total, previousMonthCount.total).text, trendColor: getTrend(currentMonthCount.total, previousMonthCount.total).color, filterValue: 'all' },
    ];
  }, [requests]);

  
  useEffect(() => {
    fetchData();
  }, [settings.appsScriptUrl]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await googleSheetsService.getAllRequests(settings.appsScriptUrl);
      if (response && response.data) {
        setRequests(response.data.reverse()); // نعكس الجدول ليكون الأحدث في الأعلى
        if ((response as any).isFallback) {
          toast.success('يتم عرض البيانات المحفوظة والمسجلة محلياً بسبب عدم توافر اتصال بجوجل شيت', { icon: '⚠️', id: 'fallback-toast' });
        }
      } else {
        setRequests([]);
      }
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء جلب البيانات');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.name.includes(searchTerm) || 
                          (req.phone || '').includes(searchTerm) || 
                          (req.type || '').includes(searchTerm);
    const matchesFilter = selectedFilter === 'all' || req.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Print View */}
      <div className="hidden print:block text-black bg-white" dir="rtl">
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
          <h1 className="text-2xl font-bold mb-2">تقرير طلبات مكتب النائب - حاتم الشامي</h1>
          <p className="text-gray-600">
            التاريخ: {new Date().toLocaleDateString('ar-EG')} - القسم: {selectedFilter === 'all' ? 'جميع الطلبات' : selectedFilter}
          </p>
        </div>
        <table className="w-full border-collapse border border-gray-300 text-right text-sm">
          <thead>
            <tr className="bg-gray-100 font-bold border-b border-gray-300">
              <th className="border border-gray-300 p-2">الاسم</th>
              <th className="border border-gray-300 p-2">الهاتف</th>
              <th className="border border-gray-300 p-2">النوع</th>
              <th className="border border-gray-300 p-2">الحالة</th>
              <th className="border border-gray-300 p-2">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(req => (
              <tr key={req.id} className="border-b border-gray-300">
                <td className="border border-gray-300 p-2">{req.name}</td>
                <td className="border border-gray-300 p-2 text-left" dir="ltr">{req.phone || 'غير مسجل'}</td>
                <td className="border border-gray-300 p-2">{req.type}</td>
                <td className="border border-gray-300 p-2">{req.status || 'قيد المراجعة'}</td>
                <td className="border border-gray-300 p-2">{req.date}</td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-gray-300 p-4 text-center">لا يوجد بيانات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">لوحة التحكم</h1>
          <p className="text-slate-400 mt-1">نظرة عامة على جميع الطلبات</p>
        </div>
        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-900/20 hover:scale-105 transition-transform no-print w-full sm:w-auto"
          >
            <span>إضافة طلب جديد</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-slate-800 text-slate-200 rounded-lg text-sm font-medium shadow-lg hover:scale-105 transition-transform no-print border border-slate-700 w-full sm:w-auto"
          >
            <Download size={18} />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 print:hidden">
        {dynamicStats.map((stat) => (
          <div 
            key={stat.id} 
            onClick={() => setSelectedFilter(stat.filterValue)}
            className={cn(
              "p-4 sm:p-5 rounded-2xl flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between shadow-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] gap-3 sm:gap-0",
              selectedFilter === stat.filterValue 
                ? "bg-accent border-2 border-emerald-500 ring-4 ring-emerald-500/10" 
                : "bg-card border border-border hover:border-emerald-500/50 hover:bg-accent"
            )}
          >
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs sm:text-sm">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</h3>
              <p className={cn("text-[10px] sm:text-xs", stat.trendColor)}>{stat.trend}</p>
            </div>
            <div className={cn("p-2 sm:p-4 rounded-xl", stat.bg, stat.color)}>
              <stat.icon size={24} className="sm:w-7 sm:h-7" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests Table */}
      <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm print:hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <h2 className="font-bold text-foreground text-lg">آخر الطلبات المضافة</h2>
          <div className="relative w-full sm:w-64 no-print">
            <Search className="absolute right-3 top-3 sm:top-2.5 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="بحث في الطلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-3 sm:py-2 px-4 pr-10 min-h-[44px] sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground"
            />
          </div>
        </div>

        <div className="relative">
          {isLoading ? (
            <div className="absolute inset-0 min-h-[200px] flex items-center justify-center bg-slate-950/50 z-10">
              <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto min-h-[200px]">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-800/50 text-slate-500 text-xs uppercase sticky top-0">
                    <tr className="border-b border-slate-800">
                      <th className="px-6 py-4 font-medium whitespace-nowrap">الاسم</th>
                      <th className="px-6 py-4 font-medium whitespace-nowrap">رقم الهاتف</th>
                      <th className="px-6 py-4 font-medium whitespace-nowrap">نوع الطلب</th>
                      <th className="px-6 py-4 font-medium whitespace-nowrap">التاريخ</th>
                      <th className="px-6 py-4 font-medium w-[250px] min-w-[200px]">تفاصيل</th>
                      <th className="px-6 py-4 font-medium whitespace-nowrap">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                    {filteredRequests.map((req, index) => (
                      <tr key={req.id} className={cn("hover:bg-slate-800/20 transition-colors", index % 2 === 1 && "bg-slate-800/20")}>
                        <td className="px-6 py-4 font-medium text-slate-100">{req.name}</td>
                        <td className="px-6 py-4">{req.phone}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-sm font-medium",
                            req.type === 'صحة' ? 'text-emerald-400' :
                            req.type === 'توظيف' ? 'text-blue-400' :
                            'text-amber-400'
                          )}>
                            {req.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{req.date}</td>
                        <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]" title={req.details}>{req.details}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex px-2 py-1 rounded-full text-[10px] font-medium",
                            (req.status === 'مكتمل' || req.status === 'مقبول') ? "bg-emerald-500/10 text-emerald-500" :
                            req.status === 'قيد المراجعة' ? "bg-amber-500/10 text-amber-500" :
                            "bg-rose-500/10 text-rose-500"
                          )}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          لا يوجد طلبات مطابقة للبحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="block md:hidden p-4 space-y-4">
                {filteredRequests.map((req) => (
                  <div key={req.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                    <div className={cn(
                      "absolute top-0 right-0 w-1 h-full",
                      req.type === 'صحة' ? 'bg-emerald-500' :
                      req.type === 'توظيف' ? 'bg-blue-500' :
                      'bg-amber-500'
                    )}/>
                    
                    <div className="flex justify-between items-start pl-2 pr-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-100 text-base">{req.name}</h3>
                        <p className="text-xs text-slate-400 mt-1" dir="ltr" style={{textAlign: 'right'}}>{req.phone || 'بدون رقم'}</p>
                      </div>
                      <span className={cn(
                        "inline-flex px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap",
                        (req.status === 'مكتمل' || req.status === 'مقبول') ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                        req.status === 'قيد المراجعة' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                        "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      )}>
                        {req.status}
                      </span>
                    </div>

                    {req.details && (
                      <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg leading-relaxed line-clamp-3 mx-2">
                        {req.details}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-700/50 px-2">
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-md bg-slate-800/80",
                        req.type === 'صحة' ? 'text-emerald-400' :
                        req.type === 'توظيف' ? 'text-blue-400' :
                        'text-amber-400'
                      )}>
                        {req.type}
                      </span>
                      <span className="text-xs text-slate-500">{req.date}</span>
                    </div>
                  </div>
                ))}
                
                {filteredRequests.length === 0 && (
                  <div className="text-center py-10 px-4 text-slate-500 bg-slate-800/20 rounded-xl border border-slate-800 border-dashed">
                    لا يوجد طلبات مطابقة للبحث أو للقسم المختار
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <NewRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
};

