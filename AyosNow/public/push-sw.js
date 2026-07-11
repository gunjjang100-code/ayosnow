self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "New notification";
  const body = payload.body || "You have a new update.";
  const url = payload.url || "/dashboard";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const nextUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matched = clients.find((client) => "focus" in client);

      if (matched) {
        matched.navigate(nextUrl);
        return matched.focus();
      }

      return self.clients.openWindow(nextUrl);
    }),
  );
});
