import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { NAV_BY_ROLE, ROLE_HOME } from "@/lib/nav";
import { ROLE_LABELS as ROLE_NAMES } from "@/types";
import { Logo } from "@/components/shared/logo";
import { cn, initials } from "@/lib/utils";
import {
  useNotifications,
  useTickets,
  usePodRecords,
} from "@/lib/hooks";
import {
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  CheckCheck,
  ShieldAlert,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";
import { useMarkAllNotificationsRead } from "@/lib/hooks";

export function DashboardLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navSections = NAV_BY_ROLE[user.role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border lg:flex shadow-xl z-20">
        <SidebarContent sections={navSections} />
      </aside>

      {/* Mobile overlay + sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-sidebar text-sidebar-foreground animate-slide-in-right border-r border-sidebar-border shadow-2xl">
            <button
              className="absolute right-3 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 transition hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              sections={navSections}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content shell */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-background/60">
          <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ sections, onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const avatarUrl =
    user?.avatar ||
    user?.profileImage ||
    (user?.id ? localStorage.getItem(`avatar_${user.id}`) : null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border/60">
        <Link to={ROLE_HOME[user.role]} onClick={onNavigate} className="flex items-center gap-2">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 py-5 scrollbar-thin">
        {(sections || []).map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/50">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-primary/25 font-bold"
                        : "text-sidebar-foreground/75 hover:bg-white/[0.07] hover:text-white",
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && <NavBadge type={item.badge} />}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer User Info */}
      <div className="border-t border-sidebar-border/80 p-3 bg-white/[0.02]">
        <div className="flex items-center gap-3 rounded-xl p-2 bg-white/[0.04] border border-white/5">
          <Avatar className="h-9 w-9 border border-white/20 shrink-0 overflow-hidden">
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                alt={user.name}
                className="object-cover h-full w-full"
              />
            )}
            <AvatarFallback className="bg-primary/20 text-xs font-extrabold text-white">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white leading-snug">
              {user.name}
            </p>
            <p className="truncate text-[10px] font-medium text-sidebar-foreground/60">
              {ROLE_NAMES[user.role] || user.role}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition hover:bg-rose-500/20 hover:text-rose-400"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NavBadge({ type }) {
  const tickets = useTickets();
  const notifications = useNotifications();
  const pod = usePodRecords();

  let count = 0;
  if (type === "shipments") {
    count = 0;
  } else if (type === "tickets") {
    count =
      tickets.data?.filter((t) => ["open", "in_progress"].includes(t.status))
        .length ?? 0;
  } else if (type === "pod") {
    count =
      pod.data?.filter((p) => p.status === "pending" || p.status === "missing")
        .length ?? 0;
  } else {
    count = notifications.data?.filter((n) => !n.read).length ?? 0;
  }

  if (count === 0) return null;

  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1.5 text-[9px] font-extrabold text-white shadow-xs">
      {count}
    </span>
  );
}

function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const avatarUrl =
    user?.avatar ||
    user?.profileImage ||
    (user?.id ? localStorage.getItem(`avatar_${user.id}`) : null);

  const unread = notifications?.filter((n) => !n.read) ?? [];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/80 glass px-4 sm:px-6 shadow-2xs">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open Navigation Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {ROLE_NAMES[user.role] || user.role}
        </div>

        {/* Notifications Dropdown */}
        
        {user.role !== "admin" && ( 
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/80 hover:text-foreground">
              <Bell className="h-4.5 w-4.5" />
              {unread.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-84 p-0 shadow-lg border border-border/80"
          >
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/30">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Notifications
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {unread.length} unread alert{unread.length === 1 ? "" : "s"}
                </p>
              </div>
              {unread.length > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-border/60">
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 6).map((n) => (
                  <Link
                    key={n.id}
                    to="/app/notifications"
                    className={cn(
                      "flex flex-col gap-1 px-4 py-3 text-xs transition hover:bg-muted/50",
                      !n.read && "bg-primary/[0.04]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          n.severity === "success" && "bg-emerald-500",
                          n.severity === "warning" && "bg-amber-500",
                          n.severity === "error" && "bg-rose-500",
                          n.severity === "info" && "bg-blue-500",
                        )}
                      />
                      <p className="flex-1 font-semibold text-foreground truncate">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground leading-relaxed pl-4">
                      {n.message}
                    </p>
                    <p className="pl-4 text-[10px] font-medium text-muted-foreground/70">
                      {timeAgo(n.timestamp)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No new notifications
                </div>
              )}
            </div>

            <div className="border-t border-border/80 p-2 bg-muted/20">
              <Link
                to="/app/notifications"
                className="block rounded-lg px-2 py-1.5 text-center text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 p-1 pl-1.5 pr-2.5 shadow-2xs transition hover:border-border hover:bg-card">
              <Avatar className="h-7 w-7 border border-primary/20 overflow-hidden">
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={user.name}
                    className="object-cover h-full w-full"
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block min-w-0">
                <span className="block truncate text-xs font-bold leading-tight text-foreground max-w-[120px]">
                  {user.name}
                </span>
                <span className="block text-[10px] leading-tight text-muted-foreground">
                  {ROLE_NAMES[user.role]}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground/70 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 shadow-lg border border-border/80"
          >
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-bold text-foreground">{user.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/app/profile")}
              className="text-xs font-medium cursor-pointer"
            >
              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              Profile
            </DropdownMenuItem>
            {/* <DropdownMenuItem onClick={() => navigate("/app/settings")} className="text-xs font-medium cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs font-semibold text-destructive focus:text-destructive cursor-pointer"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

