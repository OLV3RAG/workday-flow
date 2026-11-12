export function haptic(duration = 10) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(duration);
  }
}
