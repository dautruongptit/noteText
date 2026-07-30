export const timeAgo = (date: Date) => {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  return `${Math.floor(minutes / 60)} giờ trước`;
};
