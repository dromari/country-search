export function debounce<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  delay: number
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (...args: Args): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
