"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaBell } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

export default function FloatingNotification() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const isLoggedIn = status === "authenticated";

  useEffect(() => {
  if (!isLoggedIn) return;

  const loadData = async () => {
    const res = await fetch("/api/notification");
    const data = await res.json();
    setNotifications(Array.isArray(data) ? data : []);
  };

  loadData();

  const interval = setInterval(loadData, 5000);

  return () => clearInterval(interval);
}, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  const markAllAsRead = async () => {
    await Promise.all(
      notifications
        .filter((n) => !n.is_read)
        .map((n) =>
          fetch("/api/notification/read", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: n.id }),
          })
        )
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const togglePopup = async () => {
    if (isOpen) {
      await markAllAsRead();
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end">
      <button
        onClick={togglePopup}
        className="relative bg-white rounded-full shadow-lg p-3 hover:bg-gray-100 transition"
      >
        <FaBell size={24} color="#006C67" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-lg border overflow-hidden">
          <div className="flex justify-between items-center bg-[#006C67] text-white px-4 py-2">
            <span className="font-semibold">Notifications</span>
            <button onClick={togglePopup}>
              <IoMdClose size={20} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm text-center">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-b ${
                    n.is_read
                      ? "bg-white"
                      : "bg-green-50 border-l-4 border-green-500"
                  }`}
                >
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
