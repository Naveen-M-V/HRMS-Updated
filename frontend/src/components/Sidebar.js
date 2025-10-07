// src/components/Sidebar.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { ClipboardDocumentIcon as ClipboardIcon } from '@heroicons/react/24/outline';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { HomeIcon } from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/outline';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/outline';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Sidebar({ isOpen }) {
  const navigate = useNavigate();
  const { logout, loading, user } = useAuth();
  const { getUnreadCount, subscribeToNotificationChanges, triggerRefresh, initializeNotifications } = useNotifications();

  const [openReporting, setOpenReporting] = useState(false);
  const [openTraining, setOpenTraining] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Subscribe to notification changes from context
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setUnreadNotifications(0);
      return;
    }

    initializeNotifications();
    setUnreadNotifications(getUnreadCount());

    const unsubscribe = subscribeToNotificationChanges((count) => {
      setUnreadNotifications(count);
    });

    return unsubscribe;
  }, [user, getUnreadCount, subscribeToNotificationChanges, initializeNotifications]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  const itemBase =
    "relative group flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-800 rounded-md";

  const Divider = () => <div className="border-b border-green-300 mx-2 my-2"></div>;

  // ✅ FIXED: Added pointer-events-none to all child elements
  const ChildItem = ({ name, icon: Icon, onClick }) => (
    <div
      onClick={(e) => {
        e.stopPropagation();
        console.log(`ChildItem clicked: ${name}`);
        if (onClick) onClick();
      }}
      className="relative group flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-green-800 rounded-md ml-3"
    >
      {/* ✅ FIX: Added pointer-events-none to icon */}
      {Icon && <Icon className="h-5 w-5 shrink-0 text-green-300 pointer-events-none" />}
      
      {/* ✅ FIX: Added pointer-events-none to text */}
      {isOpen && <span className="text-sm pointer-events-none">{name}</span>}

      {/* Tooltip when collapsed */}
      {!isOpen && (
        <span className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 pointer-events-none">
          {name}
        </span>
      )}
    </div>
  );

  return (
    <div
      className={`bg-green-900 text-white fixed left-0 top-0 h-screen transition-all duration-300 z-50 ${
        isOpen ? "w-64" : "w-16"
      } overflow-y-auto`}
    >
      <div className="py-4 space-y-2">
        {isOpen && (
          <div className="px-4 pb-2 text-xs uppercase font-bold tracking-wider text-green-300 pointer-events-none">
            My Compliance
          </div>
        )}

        {/* Reporting */}
        <div>
          <div
            onClick={() => {
              console.log("Reporting section clicked");
              setOpenReporting(!openReporting);
            }}
            className={`${itemBase} select-none`}
          >
            {/* ✅ FIX: Added pointer-events-none to icon */}
            <ClipboardIcon className="h-6 w-6 shrink-0 pointer-events-none" />
            {isOpen && (
              <>
                {/* ✅ FIX: Added pointer-events-none to text */}
                <span className="text-sm flex-1 pointer-events-none">Reporting</span>
                {openReporting ? (
                  <ChevronDownIcon className="h-4 w-4 pointer-events-none" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 pointer-events-none" />
                )}
              </>
            )}
            {!isOpen && (
              <span className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 pointer-events-none">
                Reporting
              </span>
            )}
          </div>
          {openReporting && (
            <div className={`${isOpen ? "ml-3 pl-5" : ""} border-l border-green-800`}>
              <ChildItem
                name="Compliance Dashboard"
                icon={HomeIcon}
                onClick={() => {
                  console.log("Compliance Dashboard clicked");
                  navigate("/");
                }}
              />
            </div>
          )}
          <Divider />
        </div>

        {/* Training Compliance */}
        <div>
          <div
            onClick={() => {
              console.log("Training Compliance section clicked");
              setOpenTraining(!openTraining);
            }}
            className={`${itemBase} select-none`}
          >
            {/* ✅ FIX: Added pointer-events-none to icon */}
            <AcademicCapIcon className="h-6 w-6 shrink-0 pointer-events-none" />
            {isOpen && (
              <>
                {/* ✅ FIX: Added pointer-events-none to text */}
                <span className="text-sm flex-1 pointer-events-none">Training Compliance</span>
                {openTraining ? (
                  <ChevronDownIcon className="h-4 w-4 pointer-events-none" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 pointer-events-none" />
                )}
              </>
            )}
            {!isOpen && (
              <span className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 pointer-events-none">
                Training Compliance
              </span>
            )}
          </div>
          {openTraining && (
            <div className={`${isOpen ? "ml-3 pl-5" : ""} border-l border-green-800`}>
              <ChildItem
                name="Profiles"
                icon={UserIcon}
                onClick={() => {
                  console.log("Profiles clicked");
                  navigate("/reporting/profiles");
                }}
              />
              <ChildItem
                name="Create User"
                icon={UserPlusIcon}
                onClick={() => {
                  console.log("Create User clicked");
                  navigate("/create-user");
                }}
              />
              <ChildItem
                name="Certificates"
                icon={DocumentTextIcon}
                onClick={() => {
                  console.log("Certificates clicked");
                  navigate("/certificates");
                }}
              />
            </div>
          )}
          <Divider />
        </div>

        {/* My Settings */}
        <div>
          <div
            onClick={() => {
              console.log("My Settings section clicked");
              setOpenSettings(!openSettings);
            }}
            className={`${itemBase} select-none`}
          >
            {/* ✅ FIX: Added pointer-events-none to icon */}
            <UserCircleIcon className="h-6 w-6 shrink-0 pointer-events-none" />
            {isOpen && (
              <>
                {/* ✅ FIX: Added pointer-events-none to text */}
                <span className="text-sm flex-1 pointer-events-none">My Settings</span>
                {openSettings ? (
                  <ChevronDownIcon className="h-4 w-4 pointer-events-none" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 pointer-events-none" />
                )}
              </>
            )}
            {!isOpen && (
              <span className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 pointer-events-none">
                My Settings
              </span>
            )}
          </div>
          {openSettings && (
            <div className={`${isOpen ? "ml-3 pl-5" : ""} border-l border-green-800`}>
              <ChildItem
                name="Profile"
                icon={UserIcon}
                onClick={() => {
                  console.log("Profile clicked");
                  navigate("/myaccount/profiles");
                }}
              />
              <div className="relative">
                <ChildItem
                  name="Notifications"
                  icon={BellIcon}
                  onClick={() => {
                    console.log("Notifications clicked");
                    navigate("/myaccount/notifications");
                    triggerRefresh();
                  }}
                />
                {/* Notification Badge - pointer-events-none so it doesn't block clicks */}
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold pointer-events-none">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </div>
                )}
              </div>
            </div>
          )}
          <Divider />
        </div>

        {/* Logout Button */}
        <div className="mt-auto pt-4">
          <div
            onClick={handleLogout}
            className={`${itemBase} select-none ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {/* ✅ FIX: Added pointer-events-none to icon */}
            <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0 pointer-events-none" />
            {isOpen && (
              <span className="text-sm flex-1 pointer-events-none">
                {loading ? 'Logging out...' : 'Logout'}
              </span>
            )}
            {!isOpen && (
              <span className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 pointer-events-none">
                Logout
              </span>
            )}
          </div>
        </div>

        {/* Version Text - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 text-center pb-2 text-xs text-green-300/50 pointer-events-none">
          Talentshield v.0.1
        </div>
      </div>
    </div>
  );
}