/** Formats a Georgian local mobile number as 598-90-08-49 while it is typed. */
export function formatGeorgianMobile(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "").replace(/^995/, "").slice(0, 9);
  const groups = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return groups.join("-");
}
