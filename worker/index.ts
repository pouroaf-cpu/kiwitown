const serviceWorkerScope = globalThis as unknown as {
  addEventListener: (name: string, handler: (event: any) => void) => void;
  registration: { showNotification: (title: string, options: Record<string, unknown>) => Promise<void> };
  clients: { openWindow: (url: string) => Promise<unknown> };
};

serviceWorkerScope.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? { title: "Kiwitown KPI", body: "Your performance update is ready." };
  event.waitUntil(serviceWorkerScope.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: { url: payload.url || "/sparky" },
  }));
});

serviceWorkerScope.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(serviceWorkerScope.clients.openWindow(event.notification.data?.url || "/sparky"));
});
