// src/components/Sidebar.js
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { ClockIcon } from "@heroicons/react/24/outline";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, loading, user } = useAuth();
  const {
    getUnreadCount,
    subscribeToNotificationChanges,
    triggerRefresh,
    initializeNotifications,
  } = useNotifications();

  const [openReporting, setOpenReporting] = useState(false);
  const [openClockInOut, setOpenClockInOut] = useState(false);
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
    if (toggleSidebar && !isOpen) toggleSidebar();
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleIconClick = () => {
    if (toggleSidebar && !isOpen) {
      toggleSidebar();
    }
  };

  const handleMenuClick = () => {
    if (toggleSidebar && !isOpen) {
      toggleSidebar();
    }
  };

  return (
    <div
      onClick={() => {
        if (!isOpen && toggleSidebar) {
          toggleSidebar();
        }
      }}
      className={`fixed left-0 top-0 h-screen bg-green-900 text-white z-50 transition-all duration-300 flex flex-col ${
        isOpen ? "w-64" : "w-16"
      } cursor-pointer`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .sidebar-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="py-4 space-y-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
              handleMenuClick();
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
                onClick={() => handleNavigation("/dashboard")}
                className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md select-none ${
                  isActive('/dashboard') ? 'bg-green-700' : 'hover:bg-green-800'
                }`}
              >
                <HomeIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Compliance Dashboard</span>
              </div>
            </div>
          )}

          <div className="border-b border-green-300 mx-2 my-2"></div>
        </div>

        {/* Clock In/Out Section */}
        <div>
          <div
            onClick={() => {
              console.log("Clock In/Out clicked");
              handleMenuClick();
              setOpenClockInOut(!openClockInOut);
            }}
            className="relative group flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-800 rounded-md select-none"
          >
            <ClockIcon className="h-6 w-6 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm flex-1">Clock In/Out</span>
                {openClockInOut ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
            {!isOpen && (
              <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                Clock In/Out
              </div>
            )}
          </div>

          {/* Clock In/Out Children */}
          {openClockInOut && isOpen && (
            <div className="ml-3 pl-5 border-l border-green-800">
              <div
                onClick={() => handleNavigation("/clock-overview")}
                className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md select-none ${
                  isActive('/clock-overview') ? 'bg-green-700' : 'hover:bg-green-800'
                }`}
              >
                <HomeIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Overview</span>
              </div>

              <div
                onClick={() => handleNavigation("/clock-ins")}
                className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md select-none ${
                  isActive('/clock-ins') ? 'bg-green-700' : 'hover:bg-green-800'
                }`}
              >
                <ClockIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Clock-ins</span>
              </div>

              <div
                onClick={() => handleNavigation("/time-history")}
                className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md select-none ${
                  isActive('/time-history') ? 'bg-green-700' : 'hover:bg-green-800'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">History</span>
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
              handleMenuClick();
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
                onClick={() => handleNavigation("/profiles")}
                className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md select-none ${
                  isActive('/profiles') ? 'bg-green-700' : 'hover:bg-green-800'
                }`}
              >
                <UserIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Profiles</span>
              </div>

              <div
                onClick={() => handleNavigation("/create-user")}
                className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md select-none ${
                  isActive('/create-user') ? 'bg-green-700' : 'hover:bg-green-800'
                }`}
              >
                <UserPlusIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Create User</span>
              </div>

              <div
                onClick={() => handleNavigation("/certificates")}
                className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md select-none ${
                  isActive('/certificates') ? 'bg-green-700' : 'hover:bg-green-800'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Certificates</span>
              </div>

              <div
                onClick={() => handleNavigation("/rota-shift-management")}
                className={`relative group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-md select-none ${
                  isActive('/rota-shift-management') ? 'bg-green-700' : 'hover:bg-green-800'
                }`}
              >
                <CalendarDaysIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">Rota Shift Management</span>
              </div>
            </div>
          )}

          <div className="border-b border-green-300 mx-2 my-2"></div>
        </div>

        {/* My Settings Section */}
        <div>
          <div
            onClick={() => {
              console.log("My Settings clicked");
              if (!isOpen && toggleSidebar) {
                toggleSidebar(); // Expand sidebar if collapsed
              }
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

              {/* Logout Button inside Settings */}
              <div
                onClick={handleLogout}
                className={`relative group flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-800 rounded-md ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
                <span className="text-sm">
                  {loading ? "Logging out..." : "Logout"}
                </span>
              </div>
            </div>
          )}

          <div className="border-b border-green-300 mx-2 my-2"></div>
        </div>
      </div>

      {/* Bottom section - Version Display */}
      <div className="mt-auto border-t border-green-800">
        {/* Version Display */}
        {isOpen && (
          <div className="px-4 py-3 text-center text-xs text-green-300/70">
            <div className="font-semibold">TalentShield V 1.14</div>
          </div>
        )}
      </div>
    </div>
  );
}
