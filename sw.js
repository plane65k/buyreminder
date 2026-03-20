javascript
self.addEventListener("push", event => {
  const data = event.data.json();

  self.registration.showNotification("Shopping Reminder", {
    body: data.body
  });
});

