import { useAuth } from "@/context/auth-context";
import { useTickets, useShipments } from "@/lib/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState, EmptyState } from "@/components/shared/states";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Headphones,
  ArrowRight,
  Inbox,
} from "lucide-react";

const statusMeta = {
  open: {
    label: "Open",
    class: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  in_progress: {
    label: "In Progress",
    class: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  resolved: {
    label: "Resolved",
    class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  closed: {
    label: "Closed",
    class: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  },
};

export default function SupportDashboard() {
  const { user } = useAuth();
  const tickets = useTickets();
  const shipments = useShipments();
  const isLoading = tickets.isLoading;

  const open = tickets.data?.filter((t) => t.status?.toLowerCase() === "open") ?? [];
  const resolved = tickets.data?.filter((t) => t.status?.toLowerCase() === "resolved") ?? [];
  const myTickets =
    tickets.data?.filter(
      (t) =>
        t.assigneeId === user?.id ||
        t.assignee?.toLowerCase() === (user?.name || "").toLowerCase() ||
        t.assignee?.toLowerCase() === (user?.firstName || "").toLowerCase() ||
        (t.assignee && user?.name && t.assignee.toLowerCase().includes(user.name.toLowerCase()))
    ) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customer Care Desk"
          description="Customer inquiries, highway delay reassurance & grievance resolution"
          icon={Headphones}
        />
        <LoadingState label="Loading support ticket queues..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Customer Care Desk"
        description={`Welcome, ${user?.name ?? user?.firstName ?? "Customer Care Executive"} — customer ticket queue & issue resolution`}
        icon={Headphones}
        actions={
          <Button asChild variant="brand" size="sm" className="font-bold text-xs">
            <Link to="/app/tickets">
              <Inbox className="mr-1.5 h-4 w-4" />
              Open Care Inbox
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="My Open Tickets"
          value={
            myTickets.filter(
              (t) => t.status !== "closed" && t.status !== "resolved",
            ).length
          }
          icon={Headphones}
          iconClass="bg-primary/10 text-primary border border-primary/20"
          footer="Assigned to your queue"
        />
        <StatCard
          label="Awaiting Response"
          value={open.length}
          icon={Clock}
          iconClass="bg-amber-500/10 text-amber-600 border border-amber-500/20"
          footer="Unresolved support tickets"
        />
        <StatCard
          label="Resolved Today"
          value={resolved.length}
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          footer="Closed & solved tickets"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-card border-border/80">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Priority Support Queue</CardTitle>
                <CardDescription className="text-xs">Active customer tickets needing agent attention</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
                <Link to="/app/tickets">
                  All Tickets ({tickets.data?.length ?? 0}) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            {tickets.data
              ?.filter((t) => t.status === "open" || t.status === "in_progress")
              .sort((a) =>
                a.priority === "express" || a.priority === "critical" ? -1 : 1,
              )
              .map((t) => (
                <Link
                  key={t.id}
                  to={`/app/tickets/${t.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-2xs"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      t.channel === "chat" && "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                      t.channel === "email" && "bg-primary/10 text-primary border-primary/20",
                      t.channel === "phone" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      t.channel === "portal" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    )}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t.subject}
                      </p>
                    </div>
                    <p className="truncate text-xs text-muted-foreground font-medium mt-0.5">
                      {t.reference} · {t.customer} · {timeAgo(t.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      statusMeta[t.status]?.class ?? statusMeta.open.class,
                    )}
                  >
                    {statusMeta[t.status]?.label ?? t.status}
                  </span>
                </Link>
              ))}
            {tickets.data?.filter(
              (t) => t.status === "open" || t.status === "in_progress",
            ).length === 0 && (
              <EmptyState
                icon={CheckCircle2}
                title="Support queue is clear!"
                description="No active customer tickets waiting for a response."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

