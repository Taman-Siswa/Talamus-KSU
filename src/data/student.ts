// Placeholder profile from the prototype — replace with real account data when auth exists.
export const STUDENT = {
  name: 'Alya Nasywa',
  meta: 'SMP IX · target SMA 2027',
};

export const initials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
