export type BoardView = "kanban" | "list";

const VIEW_KEY = "tablero-vista";
const VIEW_EVENT = "tablero-vista-change";

export function subscribeView(onStoreChange: () => void) {
  window.addEventListener(VIEW_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(VIEW_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function getViewSnapshot(): BoardView {
  return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "kanban";
}

export function getServerView(): BoardView {
  return "kanban";
}

export function setStoredView(view: BoardView) {
  localStorage.setItem(VIEW_KEY, view);
  window.dispatchEvent(new Event(VIEW_EVENT));
}
