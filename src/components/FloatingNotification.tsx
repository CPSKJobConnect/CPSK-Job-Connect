"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaBell, FaArrowLeft } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

type NotificationSummary = {
  senderId: number | null;
  senderName: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type NotificationDetail = {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
};

// helper functions
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString(); // วัน/เดือน/ปี + เวลา
};

export default function FloatingNotification() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [summaries, setSummaries] = useState<NotificationSummary[]>([]);
  const [detailMessages, setDetailMessages] = useState<NotificationDetail[]>([]);
  const [selectedSender, setSelectedSender] = useState<number | null | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  // filter / sort states
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchSummaries = async () => {
      // Only fetch if the page is visible
      if (document.hidden) return;

      try {
        const res = await fetch("/api/notification/");
        if (res.ok) {
          const data = await res.json();
          setSummaries(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Initial fetch
    fetchSummaries();

    // Poll every 30 seconds (reduced from 5 seconds)
    const interval = setInterval(fetchSummaries, 30000);

    // Fetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSummaries();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const unreadCount = summaries.filter((n) => !n.is_read).length;

  const openDetail = async (senderId: number | null) => {
    setSelectedSender(senderId);

    // Use "system" as the URL parameter for null sender_id
    const senderParam = senderId === null ? "system" : senderId;
    const res = await fetch(`/api/notification/${senderParam}`);
    const data = await res.json();
    setDetailMessages(Array.isArray(data) ? data : []);

    // mark all messages from this sender as read locally
    setSummaries((prev) =>
      prev.map((s) => (s.senderId === senderId ? { ...s, is_read: true } : s))
    );
  };

  const backToSummary = () => {
    setSelectedSender(undefined);
    setDetailMessages([]);
  };

  const displayedSummaries = [...summaries]
    .filter((s) => (filterUnread ? !s.is_read : true))
    .sort((a, b) =>
      sortNewestFirst
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSelectedSender(undefined);
        }}
        className="relative bg-white rounded-full shadow-lg p-3 hover:bg-gray-100 transition cursor-pointer"
      >
        <FaBell size={24} color="#006C67" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Summary View */}
      {selectedSender === undefined && isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-lg border overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center bg-[#006C67] text-white px-4 py-2 cursor-pointer">
            <span className="font-semibold">Notifications</span>
            <button onClick={() => setIsOpen(false)} className={"cursor-pointer"}>
              <IoMdClose size={20} />
            </button>
          </div>

          {/* Filter / Sort Bar */}
          <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50 gap-2 flex-wrap">
            <button
              onClick={() => setSortNewestFirst(!sortNewestFirst)}
              className={`
                inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md
                bg-[#2BA17C] text-white shadow-lg hover:bg-[#27946F] transition cursor-pointer
              `}
            >
              {sortNewestFirst ? "Newest → Oldest" : "Oldest → Newest"}
            </button>
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              className={`
                inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md
                bg-[#2BA17C] text-white shadow-lg hover:bg-[#27946F] transition cursor-pointer
              `}
            >
              {filterUnread ? "Unread Only" : "All"}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {displayedSummaries.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm text-center">No notifications</p>
            ) : (
              displayedSummaries.map((n) => (
                <div
                  key={n.senderId ?? Math.random()}
                  onClick={() => openDetail(n.senderId)}
                  className={`p-3 border-b cursor-pointer ${
                    n.is_read ? "bg-white" : "bg-green-50 border-l-4 border-green-500"
                  } flex flex-col`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{n.senderName}</span>
                    <span className="text-gray-400 text-xs">{formatDate(n.created_at)}</span>
                  </div>
                  <div className="text-gray-500 text-sm truncate">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detail View */}
      {selectedSender !== undefined && isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-lg border overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center bg-[#006C67] text-white px-4 py-2">
            <div className="flex items-center gap-2">
              <button onClick={backToSummary} className="p-0 cursor-pointer">
                <FaArrowLeft size={20} color="white" />
              </button>
              <span className="font-semibold">
                {summaries.find((s) => s.senderId === selectedSender)?.senderName || "Messages"}
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className={"cursor-pointer"}>
              <IoMdClose size={20} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-2">
            {detailMessages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">No messages</p>
            ) : (
              detailMessages.map((m) => (
                <div key={m.id} className="border-b py-2">
                  <p className="text-sm text-gray-700">{m.message}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(m.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
