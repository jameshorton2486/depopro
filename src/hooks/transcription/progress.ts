
export function simulateProgress(
  setProgress: (progress: number) => void,
  startAt: number = 0
): NodeJS.Timeout {
  setProgress(startAt);
  return setInterval(() => {
    setProgress((prev) => {
      if (prev >= 90) {
        return prev;
      }
      return prev + 2;
    });
  }, 1000);
}
