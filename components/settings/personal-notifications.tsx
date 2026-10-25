"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@/types/auth";
import { hasManagerAlerts, notificationCategories, type NotificationDelivery, type NotificationPreferences } from "@/lib/personal-settings";
import { Field, Toggle, inputClass } from "./settings-ui";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function Group({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 p-4 sm:p-5"><h3 className="text-base font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p><div className="mt-3">{children}</div></section>;
}

export default function PersonalNotifications({ value, role, timezone, disabled, error, onChange }: {
  value: NotificationPreferences; role: UserRole; timezone: string; disabled: boolean; error?: string;
  onChange: (value: NotificationPreferences) => void;
}) {
  const delivery = value.delivery;
  const manager = hasManagerAlerts(role);
  function update(patch: Partial<NotificationDelivery>) { onChange({ ...value, delivery: { ...delivery, ...patch } }); }
  const control = { form: "personal-preferences-form", className: inputClass };
  return <fieldset id="personal-notifications" tabIndex={-1} disabled={disabled} aria-describedby="personal-notifications-notice" className="min-w-0 space-y-5">
    <legend className="sr-only">Notification preferences</legend>
    <p id="personal-notifications-notice" className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">Plan how you want to be notified. Frequency, channels and event options are saved in this browser for your account. Email delivery, in-app delivery and scheduled reminders are not connected yet.</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

    <Group title="Notification frequency" description="Choose when optional emails should arrive. In-app updates are intended to appear as events happen.">
      <Toggle id="personal-notification-email" title="Optional email notifications" description="Turn off optional emails across every category. Your category choices are kept." checked={value.email} onChange={(email) => onChange({ ...value, email })} />
      <fieldset disabled={!value.email} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field id="notification-frequency" label="Email frequency"><select {...control} id="notification-frequency" value={delivery.frequency} onChange={(event) => update({ frequency: event.target.value as NotificationDelivery["frequency"] })}><option value="instant">As it happens</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option></select></Field>
        {delivery.frequency !== "instant" && <Field id="notification-digest-time" label="Digest time" hint={`In your selected time zone: ${timezone}.`}><input {...control} id="notification-digest-time" type="time" required value={delivery.digestTime} onChange={(event) => update({ digestTime: event.target.value })} /></Field>}
        {delivery.frequency === "weekly" && <Field id="notification-digest-day" label="Digest day"><select {...control} id="notification-digest-day" value={delivery.digestDay} onChange={(event) => update({ digestDay: Number(event.target.value) })}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></Field>}
      </fieldset>
    </Group>

    <Group title="Channels by category" description="Choose email, in-app, both, or neither for each category. Event switches below also apply.">
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Delivery channels for each notification category</caption><thead><tr className="border-b border-slate-200 text-slate-500"><th scope="col" className="py-3 pr-4 font-medium">Category</th><th scope="col" className="px-3 py-3 text-center font-medium">Email</th><th scope="col" className="px-3 py-3 text-center font-medium">In-app</th></tr></thead><tbody>
        {notificationCategories.filter(({ key }) => key !== "manager" || manager).map(({ key, title }) => <tr key={key} className="border-b border-slate-100 last:border-0"><th scope="row" className="py-4 pr-4 font-medium text-slate-700">{title}</th>{(["email", "inApp"] as const).map((channel) => <td key={channel} className="px-3 py-4 text-center"><input form="personal-preferences-form" type="checkbox" aria-label={`${title}: ${channel === "email" ? "email" : "in-app"}`} className="h-4 w-4 accent-blue-600 disabled:opacity-40" disabled={channel === "email" && !value.email} checked={delivery.channels[key][channel]} onChange={(event) => {
          const channels = { ...delivery.channels, [key]: { ...delivery.channels[key], [channel]: event.target.checked } };
          const next = { ...value, delivery: { ...delivery, channels } };
          if (key === "goals" || key === "reviews" || key === "feedback" || key === "development") next[key] = channels[key].email || channels[key].inApp;
          onChange(next);
        }} /></td>)}</tr>)}
      </tbody></table></div>
      {!value.email && <p className="mt-3 text-xs text-slate-500">Email is off for all categories. Enable optional email notifications above to use your saved email choices.</p>}
    </Group>

    <Group title="Reminder schedule" description="Plan reminders for incomplete reviews, goals and learning tasks with a deadline. Completed items should stop receiving reminders.">
      <Toggle id="notification-reminders" title="Upcoming deadline reminders" description="Send one reminder before each deadline, using the category's selected channels." checked={delivery.reminders.enabled} onChange={(enabled) => update({ reminders: { ...delivery.reminders, enabled } })} />
      <Toggle id="notification-reminder-overdue" title="Overdue reminder" description="Send one additional reminder the day after an incomplete item is due, at your reminder time. The weekdays-only choice also applies." checked={delivery.reminders.overdue} onChange={(overdue) => update({ reminders: { ...delivery.reminders, overdue } })} />
      <fieldset disabled={!delivery.reminders.enabled && !delivery.reminders.overdue} className="min-w-0">
        <div className="grid gap-4 sm:grid-cols-2"><Field id="notification-reminder-days" label="Days before deadline" hint="Choose a whole number from 1 to 30."><input {...control} id="notification-reminder-days" disabled={!delivery.reminders.enabled} type="number" min={1} max={30} step={1} value={Number.isNaN(delivery.reminders.daysBefore) ? "" : delivery.reminders.daysBefore} onChange={(event) => update({ reminders: { ...delivery.reminders, daysBefore: event.target.valueAsNumber } })} /></Field><Field id="notification-reminder-time" label="Reminder time" hint={`In your selected time zone: ${timezone}.`}><input {...control} id="notification-reminder-time" type="time" required value={delivery.reminders.time} onChange={(event) => update({ reminders: { ...delivery.reminders, time: event.target.value } })} /></Field></div>
        <Toggle id="notification-reminder-weekdays" title="Weekdays only" description="Move Saturday and Sunday reminders to the preceding Friday." checked={delivery.reminders.weekdaysOnly} onChange={(weekdaysOnly) => update({ reminders: { ...delivery.reminders, weekdaysOnly } })} />
      </fieldset>
      <p className="text-xs leading-5 text-slate-500">Scheduled reminders use their own time rather than waiting for a digest. Category channels and the optional email switch still apply.</p>
    </Group>

    <Group title="Mentions and replies" description="Stay involved in conversations without receiving every comment.">
      <Toggle id="notification-direct-mentions" title="Direct mentions" description="When someone @mentions you in a comment or feedback thread." checked={delivery.mentions.direct} onChange={(direct) => update({ mentions: { ...delivery.mentions, direct } })} />
      <Toggle id="notification-thread-replies" title="Replies to your conversations" description="When someone replies to your comment or a thread you participate in." checked={delivery.mentions.replies} onChange={(replies) => update({ mentions: { ...delivery.mentions, replies } })} />
    </Group>

    <Group title="Approvals and status changes" description="Choose which workflow updates matter to you. These use the Approvals and status changes channels.">
      <Toggle id="notification-approval-requests" title="Approval requests" description="When an item needs your approval." checked={delivery.approvals.requests} onChange={(requests) => update({ approvals: { ...delivery.approvals, requests } })} />
      <Toggle id="notification-approval-decisions" title="Approval decisions" description="When your submitted item is approved, rejected or returned for changes." checked={delivery.approvals.decisions} onChange={(decisions) => update({ approvals: { ...delivery.approvals, decisions } })} />
      <Toggle id="notification-status-changes" title="Status changes" description="When your goal or review moves to a new stage, such as submitted or completed." checked={delivery.approvals.statusChanges} onChange={(statusChanges) => update({ approvals: { ...delivery.approvals, statusChanges } })} />
    </Group>

    {manager ? <Group title="Manager alerts" description="Updates for teams you are authorized to manage. These choices do not grant access to other employees' information.">
      <Toggle id="notification-manager-approvals" title="Pending team approvals" description="A daily summary of team items still awaiting your decision." checked={delivery.manager.pendingApprovals} onChange={(pendingApprovals) => update({ manager: { ...delivery.manager, pendingApprovals } })} />
      <Toggle id="notification-manager-reviews" title="Overdue team reviews" description="A daily summary of incomplete team reviews past their deadline." checked={delivery.manager.overdueReviews} onChange={(overdueReviews) => update({ manager: { ...delivery.manager, overdueReviews } })} />
      <Toggle id="notification-manager-goals" title="At-risk team goals" description="When an authorized team member's goal is marked at risk or off track." checked={delivery.manager.goalRisks} onChange={(goalRisks) => update({ manager: { ...delivery.manager, goalRisks } })} />
      <p className="text-xs leading-5 text-slate-500">Daily summaries use your reminder time and weekdays-only choice. Goal status events follow your email frequency. All use the Manager alerts channels.</p>
    </Group> : <Group title="Manager alerts" description="Available to managers, team leads, HR and admins with an authorized team scope."><p className="text-sm text-slate-500">Your current role does not have manager alert controls.</p></Group>}

    <Toggle id="personal-security-notification" title="Security notifications" description="Mandatory account-security notices remain enabled regardless of your optional choices." checked disabled onChange={() => {}} />
  </fieldset>;
}
