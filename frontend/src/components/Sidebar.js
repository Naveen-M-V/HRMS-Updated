// src/components/Sidebar.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { ClipboardDocumentIcon as ClipboardIcon } from "@heroicons/react/24/outline";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { HomeIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/outline";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { BellIcon } from "@heroicons/react/24/outline";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export default function Sidebar({ isOpen }) {
  const navigate = useNavigate();
  const { logout, loading, user } = useAuth();
  const {
    getUnreadCount,
    subscribeToNotificationChanges,
    triggerRefresh,
    initializeNotifications,
  } = useNotifications();

  const [openReporting, setOpenReporting] = useState(false);
  const [openTraining, setOpenTraining] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Simplified notification - completely async, won't block anything
  useEffect(() => {
    if (!user || user.role !== "admin") {
      setUnreadNotifications(0);
      return;
    }

    // Make this completely non-blocking
    Promise.resolve().then(() => {
      try {
        if (isOpen) {
          initializeNotifications();
        }
        setUnreadNotifications(getUnreadCount());
      } catch (error) {
        console.error("Notification init error:", error);
      }
    });

    const unsubscribe = subscribeToNotificationChanges((count) => {
      setUnreadNotifications(count);
    });

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [user, isOpen, getUnreadCount, subscribeToNotificationChanges, initializeNotifications]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  const handleNavigation = (path) => {
    console.log("Navigating to:", path);
    navigate(path);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-green-900 text-white overflow-y-auto z-50 transition-all duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="py-4 space-y-2">
        {/* Header */}
        {isOpen && (
          <div className="px-4 pb-2 text-xs uppercase font-bold tracking-wider text-green-300">
            My Compliance
          </div>
        )}

        {/* Reporting Section */}
        <div>
          <div
            onClick={() => {
              console.log("Reporting clicked");
              setOpenReporting(!openReporting);
            }}
            className="relative group flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-800 rounded-md select-none"
          >
            <ClipboardIcon className="h-6 w-6 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm flex-1">Reporting</span>
                {openReporting ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                Reporting
              </div>
            )}
          </div>

          {/* Reporting Children */}
          {openReporting && isOpen && (
            <div className="ml-3 pl-5 border-l border-green-800">
              <div
                onClick={() => handleNavigation("/")}
                className="relative group flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-800 rounded-md"
              >
                <HomeIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Compliance Dashboard</span>
              </div>
            </div>
          )}

          <div className="border-b border-green-300 mx-2 my-2"></div>
        </div>

        {/* Training Compliance Section */}
        <div>
          <div
            onClick={() => {
              console.log("Training clicked");
              setOpenTraining(!openTraining);
            }}
            className="relative group flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-800 rounded-md select-none"
          >
            <AcademicCapIcon className="h-6 w-6 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm flex-1">Training Compliance</span>
                {openTraining ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                Training Compliance
              </div>
            )}
          </div>

          {/* Training Children */}
          {openTraining && isOpen && (
            <div className="ml-3 pl-5 border-l border-green-800">
              <div
                onClick={() => handleNavigation("/reporting/profiles")}
                className="relative group flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-800 rounded-md"
              >
                <UserIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Profiles</span>
              </div>

              <div
                onClick={() => handleNavigation("/create-user")}
                className="relative group flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-800 rounded-md"
              >
                <UserPlusIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Create User</span>
              </div>

              <div
                onClick={() => handleNavigation("/certificates")}
                className="relative group flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-800 rounded-md"
              >
                <DocumentTextIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Certificates</span>
              </div>
            </div>
          )}

          <div className="border-b border-green-300 mx-2 my-2"></div>
        </div>

        {/* My Settings Section */}
        <div>
          <div
            onClick={() => {
              console.log("Settings clicked");
              setOpenSettings(!openSettings);
            }}
            className="relative group flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-800 rounded-md select-none"
          >
            <UserCircleIcon className="h-6 w-6 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm flex-1">My Settings</span>
                {openSettings ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                My Settings
              </div>
            )}
          </div>

          {/* Settings Children */}
          {openSettings && isOpen && (
            <div className="ml-3 pl-5 border-l border-green-800">
              <div
                onClick={() => handleNavigation("/myaccount/profiles")}
                className="relative group flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-800 rounded-md"
              >
                <UserIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Profile</span>
              </div>

              <div
                onClick={() => {
                  handleNavigation("/myaccount/notifications");
                  triggerRefresh();
                }}
                className="relative group flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-800 rounded-md"
              >
                <BellIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Notifications</span>
                {unreadNotifications > 0 && (
                  <div className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-b border-green-300 mx-2 my-2"></div>
        </div>

        {/* Logout Button */}
        <div className="mt-auto pt-4">
          <div
            onClick={handleLogout}
            className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-800 rounded-md select-none ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6 flex-shrink-0" />
            {isOpen && (
              <span className="text-sm flex-1">
                {loading ? "Logging out..." : "Logout"}
              </span>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                Logout
              </div>
            )}
          </div>
        </div>

        {/* Version */}
        <div className="pb-2 text-center text-xs text-green-300/50">
          Talentshield v.0.1
        </div>
      </div>
    </div>
  );
}
