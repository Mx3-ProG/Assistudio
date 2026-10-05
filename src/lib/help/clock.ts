/** 75 → "1:15". Shared by server pages and client players. */
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
