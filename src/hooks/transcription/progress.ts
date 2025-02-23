
export function simulateProgress(
  setProgress: (progress: number) => void,
  startAt: number = 0
): NodeJS.Timeout {
  setProgress(startAt);
  return setInterval(() => {
    setProgress((prevProgress: number) => {
      if (prevProgress >= 90) {
        return prevProgress;
      }
      return prevProgress + 2;
    });
  }, 1000);
}
