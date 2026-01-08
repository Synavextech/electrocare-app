import React from 'react';

interface Notification {
  id: number;
  message: string;
  date: Date;
}

const NotificationList: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  return (
    <ul className="space-y-2">
      {notifications.map((notif) => (
        <li key={notif.id} className="p-2 border border-border rounded">{notif.message} - {notif.date.toLocaleString()}</li>
      ))}
    </ul>
  );
};

export default NotificationList;