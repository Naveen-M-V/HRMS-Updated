import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import {
  ClipboardDocumentIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  UserIcon,
  DocumentTextIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function ModernSidebar({ isOpen, toggleSidebar }) {
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
  const [openRotaShift, setOpenRotaShift] = useState(false);
  const [openEmployees, setOpenEmployees] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setUnreadNotifications(0);
      return;
    }

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
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleMenuClick = () => {
    if (toggleSidebar && !isOpen) {
      toggleSidebar();
    }
  };

  return (
    <div
      onClick={(e) => {
        // Toggle sidebar when clicking on the sidebar itself (not on buttons/links)
        if (e.target === e.currentTarget) {
          toggleSidebar();
        }
      }}
      className={`fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground z-50 transition-all duration-300 flex flex-col shadow-xl ${
        isOpen ? "w-64" : "w-16"
      } cursor-pointer`}
    >
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-sidebar-border">
        {isOpen && (
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-sidebar-foreground">
              TalentShield
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Admin Dashboard
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div
        onClick={(e) => {
          // Toggle sidebar when clicking empty space in scrollable area
          if (e.target === e.currentTarget) {
            toggleSidebar();
          }
        }}
        className="flex-1 overflow-y-auto py-4 space-y-1 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Reporting Section */}
        <div>
          <button
            onClick={() => {
              handleMenuClick();
              setOpenReporting(!openReporting);
            }}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              openReporting ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
            }`}
          >
            <ClipboardDocumentIcon className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm font-medium flex-1 text-left">Home</span>
                {openReporting ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
          </button>

          {openReporting && isOpen && (
            <div className="mt-1 ml-4 space-y-1 border-l-2 border-sidebar-border pl-3">
              <button
                onClick={() => handleNavigation("/dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/dashboard")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <HomeIcon className="h-4 w-4" />
                <span>Compliance Dashboard</span>
              </button>
            </div>
          )}
        </div>

        {/* Clock In/Out Section */}
        <div>
          <button
            onClick={() => {
              handleMenuClick();
              setOpenClockInOut(!openClockInOut);
            }}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              openClockInOut ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
            }`}
          >
            <ClockIcon className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm font-medium flex-1 text-left">Clock In/Out</span>
                {openClockInOut ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
          </button>

          {openClockInOut && isOpen && (
            <div className="mt-1 ml-4 space-y-1 border-l-2 border-sidebar-border pl-3">
              <button
                onClick={() => handleNavigation("/clock-overview")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/clock-overview")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <HomeIcon className="h-4 w-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => handleNavigation("/clock-ins")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/clock-ins")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <ClockIcon className="h-4 w-4" />
                <span>Clock-ins</span>
              </button>

              <button
                onClick={() => handleNavigation("/time-history")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/time-history")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>History</span>
              </button>
            </div>
          )}
        </div>

        {/* Training Compliance Section */}
        <div>
          <button
            onClick={() => {
              handleMenuClick();
              setOpenTraining(!openTraining);
            }}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              openTraining ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
            }`}
          >
            <AcademicCapIcon className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm font-medium flex-1 text-left">Training Compliance</span>
                {openTraining ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
          </button>

          {openTraining && isOpen && (
            <div className="mt-1 ml-4 space-y-1 border-l-2 border-sidebar-border pl-3">
              <button
                onClick={() => handleNavigation("/profiles")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/profiles")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <span>Profiles</span>
              </button>

              {/* Create User button removed - employees should be created via Employee Hub */}

              <button
                onClick={() => handleNavigation("/certificates")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/certificates")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Certificates</span>
              </button>
            </div>
          )}
        </div>

        {/* Rota Shift Management - Separate Section */}
        <div className="pt-2 border-t border-sidebar-border">
          <button
            onClick={() => {
              handleMenuClick();
              setOpenRotaShift(!openRotaShift);
            }}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              openRotaShift ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
            }`}
          >
            <CalendarDaysIcon className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm font-medium flex-1 text-left">Rota & Shifts</span>
                {openRotaShift ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
          </button>

          {openRotaShift && isOpen && (
            <div className="mt-1 ml-4 space-y-1 border-l-2 border-sidebar-border pl-3">
              <button
                onClick={() => handleNavigation("/rota-shift-management")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/rota-shift-management")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Shift Management</span>
              </button>
            </div>
          )}
        </div>

        {/* Employees Section */}
        <div className="pt-2 border-t border-sidebar-border">
          <button
            onClick={() => {
              handleMenuClick();
              setOpenEmployees(!openEmployees);
            }}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              openEmployees ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
            }`}
          >
            <UsersIcon className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm font-medium flex-1 text-left">Employees Hub</span>
                {openEmployees ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </>
            )}
          </button>

          {openEmployees && isOpen && (
            <div className="mt-1 ml-4 space-y-1 border-l-2 border-sidebar-border pl-3">
              <button
                onClick={() => handleNavigation("/employee-hub")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/employee-hub")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <span>Employees</span>
              </button>

              <button
                onClick={() => handleNavigation("/employees/archived")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/employees/archived")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Archived Employees</span>
              </button>

              <button
                onClick={() => handleNavigation("/manage-teams")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive("/manage-teams")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                <span>Manage Teams</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer - Profile Section with Dropdown */}
        <div className="border-t border-sidebar-border mt-auto">
          {isOpen ? (
            <div className="p-2">
              <button
                onClick={() => setOpenSettings(!openSettings)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-all"
              >
                <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-sidebar-foreground/60 truncate">
                    {user?.email}
                  </div>
                </div>
                {openSettings ? (
                  <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {openSettings && (
                <div className="mt-1 space-y-1 px-2 py-2 bg-sidebar-accent/30 rounded-lg">
                  <button
                    onClick={() => handleNavigation("/myaccount/profiles")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent transition-all"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      handleNavigation("/myaccount/notifications");
                      triggerRefresh();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent transition-all"
                  >
                    <BellIcon className="h-4 w-4" />
                    <span>Notifications</span>
                    {unreadNotifications > 0 && (
                      <div className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </div>
                    )}
                  </button>

                  <div className="border-t border-sidebar-border my-1"></div>

                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-red-500/10 hover:text-red-400 transition-all ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>{loading ? "Logging out..." : "Logout"}</span>
                  </button>
                </div>
              )}

              {/* Version Display */}
              <div className="px-3 py-2 text-center mt-2">
                <div className="text-xs text-sidebar-foreground/50 font-medium">
                  TalentShield V 1.14
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-full p-3 flex items-center justify-center hover:bg-sidebar-accent transition-all"
            >
              <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}