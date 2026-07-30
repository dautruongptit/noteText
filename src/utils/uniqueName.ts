import type { Note } from "../types";

export const nameTaken = (notes: Note[], name: string, excludeId?: string) =>
  notes.some((n) => n.name.toLowerCase() === name.trim().toLowerCase() && n.id !== excludeId);

export const uniqueName = (notes: Note[], base: string, excludeId?: string): string => {
  if (!nameTaken(notes, base, excludeId)) return base;
  const dot = base.lastIndexOf(".");
  const [stem, ext] = dot > 0 ? [base.slice(0, dot), base.slice(dot)] : [base, ""];
  let i = 2;
  while (nameTaken(notes, `${stem} (${i})${ext}`, excludeId)) i++;
  return `${stem} (${i})${ext}`;
};
