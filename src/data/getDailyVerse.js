import verses from './verses.json';

export const getDailyVerse = () => {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  return verses[dayOfYear % verses.length];
};
