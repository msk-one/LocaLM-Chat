const { Notification } = require('electron');

function showNotification(title, body, options = {}) {
  // Check if notifications are supported
  if (!Notification.isSupported()) {
    console.log(`Notification: ${title} - ${body}`);
    return null;
  }

  const notification = new Notification({
    title: title || 'LocaLM Chat',
    body: body || '',
    silent: options.silent || false,
    urgency: options.urgency || 'normal',
    ...options
  });

  notification.show();
  return notification;
}

function showProgressNotification(title, body, progress = 0) {
  if (!Notification.isSupported()) {
    console.log(`Progress ${progress}%: ${title} - ${body}`);
    return null;
  }

  return showNotification(title, `${body} (${progress}%)`);
}

module.exports = { showNotification, showProgressNotification };