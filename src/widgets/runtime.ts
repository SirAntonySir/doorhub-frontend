export function substitute(content: string): string {
  const now = new Date();
  const TIME = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const CITY = "Berlin";
  const TEMP = "22";
  const COND = "Cloudy";
  return content
    .replaceAll("{TIME}", TIME)
    .replaceAll("{CITY}", CITY)
    .replaceAll("{TEMP}", TEMP)
    .replaceAll("{COND}", COND);
}
