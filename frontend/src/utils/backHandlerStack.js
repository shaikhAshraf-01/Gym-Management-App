// Generic "who should handle the hardware back button right now" stack.
//
// Har jo bhi modal/overlay/bottom-sheet khulta hai, wo apne aap ko is stack
// mein register kar sakta hai (useBackHandler hook ke through). Jab back
// button dabta hai, BackButtonHandler sabse upar wale (sabse recently khule)
// handler ko call karke sirf usko close karta hai — page history mein
// piche nahi jaata. Agar stack khali hai, to normal route navigation hoti hai.

let stack = [];

export function registerBackHandler(id, onBack) {
  // agar same id dobara register ho (re-render ki wajah se) to purana hata do
  stack = stack.filter((entry) => entry.id !== id);
  stack.push({ id, onBack });
}

export function unregisterBackHandler(id) {
  stack = stack.filter((entry) => entry.id !== id);
}

// Sabse upar wale (LIFO) handler ko call karta hai.
// Return true agar kisi ne handle kiya, false agar stack khali tha.
export function consumeBackPress() {
  if (stack.length === 0) return false;
  const top = stack[stack.length - 1];
  top.onBack();
  return true;
}

export function hasActiveBackHandler() {
  return stack.length > 0;
}