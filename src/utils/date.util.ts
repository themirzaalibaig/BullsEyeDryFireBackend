export const isFirstOfMonth = (): boolean => {
  const today = new Date();
  return today.getDate() === 1;
};

export const now = (): Date => {
  return new Date();
};
