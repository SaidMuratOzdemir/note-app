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
