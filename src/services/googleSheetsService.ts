export interface RequestParams {
  id?: string;
  name: string;
  phone?: string;
  type?: string; // صحة, توظيف, نقل
  status?: string;
  date?: string;
  details?: string;
}

const LOCAL_STORAGE_KEY = 'deputy_requests_fallback';

const getLocalRequests = (): RequestParams[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalRequest = (data: RequestParams) => {
  const reqs = getLocalRequests();
  const newReq = { ...data, id: `local_${Date.now()}` };
  reqs.push(newReq);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reqs));
  return newReq;
};

const updateLocalRequest = (data: RequestParams) => {
  const reqs = getLocalRequests();
  const index = reqs.findIndex(req => req.name === data.name);
  if (index !== -1) {
    if (data.status) reqs[index].status = data.status;
    if (data.phone) reqs[index].phone = data.phone;
    if (data.type) reqs[index].type = data.type;
    if (data.details !== undefined) reqs[index].details = data.details;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reqs));
  }
};

const deleteLocalRequest = (name: string) => {
  const reqs = getLocalRequests();
  const updatedReqs = reqs.filter(req => req.name !== name && req.id !== name);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedReqs));
};

export const googleSheetsService = {
  addRequest: async (url: string, data: RequestParams) => {
    // 1. دائماً احفظ البيانات محلياً لضمان عدم ضياعها وظهورها فوراً
    saveLocalRequest(data);
    
    const finalUrl = url || localStorage.getItem('deputy_apps_script_url') || '';
    
    if (!finalUrl) {
      throw new Error("تم الحفظ محلياً (رابط Google Sheets غير متوفر)");
    }
    
    try {
      await fetch(finalUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'ADD', payload: data }),
        headers: { 'Content-Type': 'text/plain' },
        mode: 'no-cors'
      });
      
      // بما أن no-cors لا يعيد رد يمكن قراءته، نفترض النجاح هنا
      return { success: true, message: 'تم الإرسال لجوجل شيت' };
    } catch(err) {
      throw new Error('تم الحفظ محلياً بنجاح. لكن لم نتمكن من الوصول لجوجل شيت (تأكد من الشبكة)');
    }
  },

  getAllRequests: async (url: string) => {
    const localData = getLocalRequests();
    
    if (!url) {
      return { success: true, data: localData, isFallback: true };
    }
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'getAll' }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
      });
      
      if (!res.ok) throw new Error('فشل جلب البيانات');
      const responseJson = await res.json();
      
      // ندمج البيانات القادمة من جوجل شيت مع البيانات المخزنة محلياً لضمان عرض كل شيء
      const sheetData = responseJson.data || [];
      
      // Deduplicate based on name
      const allData = [...sheetData, ...localData];
      const uniqueData = allData.filter((item, index, self) => 
        index === self.findIndex((t) => (
          t.name === item.name
        ))
      );
      
      return { success: true, data: uniqueData };
      
    } catch(err) {
      // في حالة الفشل نرجع البيانات المحلية فقط
      return { success: true, data: localData, isFallback: true };
    }
  },

  searchRequest: async (url: string, query: string) => {
    const localData = getLocalRequests().filter(req => 
      req.name.includes(query) || (req.phone && req.phone.includes(query))
    );

    if (!url) {
      return { success: true, data: localData };
    }
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'search', query }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
      });
      if (!res.ok) throw new Error('فشل جلب البيانات');
      const responseJson = await res.json();
      return { success: true, data: [...(responseJson.data || []), ...localData] };
    } catch(err) {
       return { success: true, data: localData, isFallback: true };
    }
  },

  updateRequest: async (url: string, data: RequestParams) => {
    updateLocalRequest(data);
    const finalUrl = url || localStorage.getItem('deputy_apps_script_url') || '';
    if (!finalUrl) throw new Error("تم التعديل محلياً (لا يوجد رابط لجوجل شيت)");
    try {
      await fetch(finalUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'UPDATE', payload: { name: data.name, status: data.status } }),
        headers: { 'Content-Type': 'text/plain' },
        mode: 'no-cors'
      });
      return { success: true, message: 'تم التعديل لجوجل شيت' };
    } catch(err) {
      throw new Error('فشل التعديل، تم الحفظ محليا فقط');
    }
  },

  deleteRequest: async (url: string, id: string) => {
    deleteLocalRequest(id);
    const finalUrl = url || localStorage.getItem('deputy_apps_script_url') || '';
    if (!finalUrl) throw new Error("تم الحذف محلياً (لا يوجد رابط لجوجل شيت)");
    try {
      await fetch(finalUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', payload: { name: id } }),
        headers: { 'Content-Type': 'text/plain' },
        mode: 'no-cors'
      });
      return { success: true, message: 'تم الحذف لجوجل شيت' };
    } catch(err) {
      throw new Error('فشل الحذف لجوجل شيت، تم الحذف محليا فقط');
    }
  }
};

/**
 * --- MOCK INSTRUCTIONS FOR DEPLOYING APPS SCRIPT ---
 * Create a new Google Sheet.
 * Extensions > Apps Script.
 * Paste the following code:
 * 
 * function doPost(e) {
 *   try {
 *     var body = JSON.parse(e.postData.contents);
 *     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *     
 *     if (body.action === 'ADD') {
 *       var d = body.payload;
 *       sheet.appendRow([new Date(), d.name, d.phone, d.type, d.details, 'قيد المراجعة']);
 *       return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
 *     }
 *     if (body.action === 'UPDATE') {
 *       var nameToUpdate = body.payload.name;
 *       var newStatus = body.payload.status;
 *       var rows = sheet.getDataRange().getValues();
 *       for (var i = 1; i < rows.length; i++) {
 *         if (rows[i][1] == nameToUpdate) {
 *           sheet.getRange(i + 1, 7).setValue(newStatus); // تأكد أن رقم 7 هو عمود الحالة
 *           return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
 *         }
 *       }
 *       return ContentService.createTextOutput(JSON.stringify({success: false, message: 'Not found'})).setMimeType(ContentService.MimeType.JSON);
 *     }
 *     if (body.action === 'DELETE') {
 *       var nameToDelete = body.payload.name;
 *       var rows = sheet.getDataRange().getValues();
 *       
 *       for (var i = 1; i < rows.length; i++) {
 *         if (rows[i][1] == nameToDelete) { // عمود الاسم هو رقم 1 (B)
 *           sheet.deleteRow(i + 1);
 *           return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
 *         }
 *       }
 *       return ContentService.createTextOutput(JSON.stringify({success: false, message: 'Not found'})).setMimeType(ContentService.MimeType.JSON);
 *     }
 *     // Handle other actions: search...
 *     return ContentService.createTextOutput(JSON.stringify({success: false, message: 'Action not found'})).setMimeType(ContentService.MimeType.JSON);
 *   } catch (error) {
 *     return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * 
 * Deploy > New Deployment > Web App > Execute as Me, Access: Anyone.
 */
