const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// VAPID Keys - These are test keys, replace with your own for production
const vapidKeys = {
  publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  privateKey: 'qVxV2qHqKqYxV2qHqKqYxV2qHqKqYxV2qHqKqYxV2qHq'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Store subscriptions and reminders (in memory - will reset on restart)
let subscriptions = [];
let reminders = [];

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Subscribe endpoint
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  // Avoid duplicates
  if (!subscriptions.find(s => s.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription);
    console.log('New subscription added, total:', subscriptions.length);
  }
  res.json({ success: true });
});

// Add reminder endpoint
app.post('/api/reminders', (req, res) => {
  const { name, time } = req.body;
  const reminder = {
    id: Date.now().toString(),
    name,
    time: new Date(time).toISOString(),
    createdAt: new Date().toISOString(),
    sent: false
  };
  reminders.push(reminder);
  console.log(`Reminder added: "${name}" at ${time}`);
  
  // Schedule push notification
  schedulePush(reminder);
  
  res.json({ success: true, reminder });
});

// Get reminders
app.get('/api/reminders', (req, res) => {
  res.json(reminders);
});

// Delete reminder
app.delete('/api/reminders/:id', (req, res) => {
  reminders = reminders.filter(r => r.id !== req.params.id);
  res.json({ success: true });
});

// Test notification endpoint
app.post('/api/test-notification', (req, res) => {
  sendPushToAll('🔔 Test Notification', 'This is a test push notification! It works on lock screen!');
  res.json({ success: true });
});

// Schedule push notification
function schedulePush(reminder) {
  const reminderTime = new Date(reminder.time).getTime();
  const now = Date.now();
  const delay = reminderTime - now;
  
  if (delay > 0 && delay < 30 * 24 * 60 * 60 * 1000) {
    console.log(`Scheduling push for "${reminder.name}" in ${Math.round(delay / 1000)} seconds`);
    
    setTimeout(() => {
      sendPushToAll(
        '🛍️ Shopping Reminder',
        `${reminder.name} is due now!`
      );
      reminder.sent = true;
      console.log(`Push sent for: ${reminder.name}`);
    }, delay);
  }
}

// Send push to all subscribers
function sendPushToAll(title, body) {
  const payload = JSON.stringify({ title, body });
  
  subscriptions.forEach(subscription => {
    webpush.sendNotification(subscription, payload)
      .then(() => console.log('✅ Push sent'))
      .catch(err => {
        console.error('❌ Push failed:', err.statusCode);
        // Remove invalid subscription
        if (err.statusCode === 410) {
          subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
        }
      });
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
