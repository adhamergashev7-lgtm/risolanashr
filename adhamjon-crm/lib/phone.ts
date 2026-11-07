/**
 * Telefon maskasi: har qanday kiritilgan qiymatni "+998 XX XXX XX XX" ko'rinishiga keltiradi.
 * Foydalanuvchi "90 123...", "+99890...", "998 90..." yoki "8 90..." yozsa/paste qilsa ham ishlaydi,
 * kursor "+998" dan oldin turgan bo'lsa ham prefiks buzilmaydi.
 */
export function formatUzPhone(raw: string): string {
  const idx = raw.indexOf("+998");
  let digits: string;

  if (idx !== -1) {
    digits = (raw.slice(0, idx) + raw.slice(idx + 4)).replace(/\D/g, "");
  } else {
    digits = raw.replace(/\D/g, "");
    if (/^\s*998(\s|$)/.test(raw) || (digits.startsWith("998") && digits.length >= 12)) digits = digits.slice(3);
    else if (digits.length === 10 && digits.startsWith("8")) digits = digits.slice(1);
  }

  digits = digits.slice(0, 9);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return parts.length ? `+998 ${parts.join(" ")}` : "+998 ";
}
