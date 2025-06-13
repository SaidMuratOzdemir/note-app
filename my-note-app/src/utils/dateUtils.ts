/**
 * Timezone-safe tarih utility fonksiyonları
 * Tüm uygulamada tutarlı tarih formatı kullanımı için
 */

/**
 * Verilen Date objesini local timezone'da YYYY-MM-DD formatına çevirir
 * @param date - Date objesi
 * @returns YYYY-MM-DD formatında string
 */
export const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Bugünün tarihini local timezone'da YYYY-MM-DD formatında döner
 * @returns Bugünün tarihi YYYY-MM-DD formatında
 */
export const getTodayLocal = (): string => {
  return formatDateToLocal(new Date());
};

/**
 * İki tarihin aynı gün olup olmadığını kontrol eder (timezone-safe)
 * @param date1 - İlk tarih
 * @param date2 - İkinci tarih
 * @returns Aynı gün ise true
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateToLocal(date1) === formatDateToLocal(date2);
};

/**
 * Bugün olup olmadığını kontrol eder (timezone-safe)
 * @param date - Kontrol edilecek tarih
 * @returns Bugün ise true
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Tarihi ve saati kullanıcı dostu formatta gösterir
 * @param dateString - ISO tarih string'i
 * @returns Formatlanmış tarih ve saat string'i
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const noteDate = dateString.split('T')[0];
  
  let datePrefix = '';
  if (noteDate === today) {
    datePrefix = 'Bugün, ';
  } else if (noteDate === yesterday) {
    datePrefix = 'Dün, ';
  } else {
    datePrefix = date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }) + ', ';
  }
  
  const time = date.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return datePrefix + time;
};

/**
 * Sadece tarihi kullanıcı dostu formatta gösterir
 * @param dateString - ISO tarih string'i
 * @returns Formatlanmış tarih string'i
 */
export const formatDateOnly = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * Sadece saati gösterir
 * @param dateString - ISO tarih string'i veya Date objesi
 * @returns Formatlanmış saat string'i
 */
export const formatTimeOnly = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Tarihi "Bugün", "Dün" veya "X gün önce" formatında gösterir
 * @param dateString - ISO tarih string'i
 * @returns Kullanıcı dostu tarih formatı
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const noteDate = dateString.split('T')[0];
  
  if (noteDate === today) return 'Bugün';
  if (noteDate === yesterday) return 'Dün';
  
  return date.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * "X gün önce", "X hafta önce" formatında gösterir
 * @param dateString - ISO tarih string'i
 * @returns Relatif zaman formatı
 */
export const formatLastUsed = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} hafta önce`;
  return `${Math.ceil(diffDays / 30)} ay önce`;
};

/**
 * Bugünün tarihini "Pazartesi, 13 Haziran 2025" formatında gösterir
 * @returns Formatlanmış bugünün tarihi
 */
export const formatTodayLong = (): string => {
  const today = new Date();
  return today.toLocaleDateString('tr-TR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};
