import { useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import { Mail } from "lucide-react";

export default function Notifications() {
  const { notifications, refreshNotifications } = useNotifications();

  // 👇 Track which notification is selected
  const [selected, setSelected] = useState(null);

  return (
    <div className="p-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((note) => (
          <div
            key={note.id}
            className="flex items-start justify-between bg-white shadow rounded-lg p-4 border"
          >
            {/* Left side - icon + content */}
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-gray-600 mt-1" />

              <div>
                <p className="text-sm text-gray-600">{note.date}</p>
                <p className="text-gray-800">{note.title}</p>
              </div>
            </div>

            {/* Status Button (opens modal) */}
            <button
              onClick={() => setSelected(note)}
              className={`px-3 py-1 rounded text-sm shadow ${
                note.status === "Open"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {note.status}
            </button>
          </div>
        ))}
      </div>

      {/* Floating Modal */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 animate-fadeIn">
            {/* Header */}
            <h2 className="text-lg font-bold mb-2">{selected.title}</h2>
            <p className="text-sm text-gray-500 mb-1">
              Created: {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Status: {selected.status}
            </p>

            {/* Message */}
            <p className="text-gray-700">{selected.message}</p>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={refreshNotifications}
          className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 shadow"
        >
          Refresh Notifications
        </button>
      </div>
    </div>
  );
}
