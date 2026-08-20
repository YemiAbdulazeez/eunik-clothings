export function delay(ms?: number): Promise<void> {
  const wait = ms ?? 200 + Math.floor(Math.random() * 300);
  return new Promise((resolve) => {
    window.setTimeout(resolve, wait);
  });
}
