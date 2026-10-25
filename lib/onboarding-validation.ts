export function validateBirthDate(value?: string) {
  if (!value) return true;
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(value.slice(0, 4)) ||
    date.getMonth() + 1 !== Number(value.slice(5, 7)) ||
    date.getDate() !== Number(value.slice(8, 10))
  ) return "Enter a valid date of birth";

  return date < today || "Date of birth must be in the past";
}

export function validatePhone(value?: string) {
  if (!value) return true;
  if (!/^\+?[0-9 ()-]+$/.test(value)) return "Enter a valid phone number";
  const digits = value.replace(/\D/g, "");
  return (digits.length >= 7 && digits.length <= 15) || "Phone number must contain 7 to 15 digits";
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
