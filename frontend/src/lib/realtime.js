import { getAccessToken, getApiBaseUrl } from "../api/axiosConfig";

export function getWebSocketBaseUrl() {
  const httpUrl = getApiBaseUrl();
  const url = new URL(httpUrl.endsWith("/") ? httpUrl : `${httpUrl}/`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

export async function openBookingSocket({ role, userId, onMessage, onOpen, onError, onClose }) {
  const token = await getAccessToken();
  if (!token || !userId) return null;

  const wsBase = getWebSocketBaseUrl();
  const socket = new WebSocket(
    `${wsBase}/ws/bookings/${role}/${encodeURIComponent(userId)}/?token=${encodeURIComponent(token)}`
  );

  socket.addEventListener("open", () => onOpen?.());
  socket.addEventListener("error", (event) => onError?.(event));
  socket.addEventListener("close", (event) => onClose?.(event));
  socket.addEventListener("message", (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage?.(parsed);
    } catch {
      onMessage?.(event.data);
    }
  });

  return socket;
}
