javascript
self.addEventListener("push", function(event) {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification("Shopping Reminder", {
      body: data.body
    })
  );
});

