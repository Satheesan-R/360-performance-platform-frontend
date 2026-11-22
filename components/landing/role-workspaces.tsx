"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";
const roles = [
  { label: "Employees", title: "Your personal starting point.", description: "Activate your invited account and sign in to the employee workspace.", bullets: ["Access the employee dashboard with your assigned account.", "Find dedicated routes for goals, reviews, feedback and development."], note: "Assigned goals, review progress, self-reviews, finalized results, permitted review feedback, development plans and disputes are planned; their current screens are placeholders." },
  { label: "Managers & Tech Leads", title: "A dedicated entry point for team leaders.", description: "Sign in to the workspace associated with your department manager or tech lead role.", bullets: ["Use a dedicated dashboard route for your assigned role.", "Keep manager and tech lead access separate from HR configuration."], note: "Team performance, assigned assessments, ratings, evidence, comments, review completion and promotion discussions are planned, not connected functionality." },
  { label: "HR Leaders", title: "Help new employees get started.", description: "Use the HR dashboard and employee onboarding flow to manage account invitations.", bullets: ["Create employee profiles and assign supported roles.", "Send an activation email to the new employee's company address.", "View employee records and pending onboarding totals."], note: "The backend supports frameworks, template submission and draft department-manager cycles. Workflow configuration, live review monitoring, performance analytics, promotion eligibility, calibration and disputes are planned." },
  { label: "System Administrators", title: "Keep template approval accountable.", description: "Use the administrator dashboard and authorized backend configuration capabilities.", bullets: ["Access a dedicated administrator dashboard.", "Approve or reject review templates submitted by HR through the backend.", "Access authorized framework and template configuration endpoints."], note: "Organization configuration is backend supported. Account and permission-management screens are not yet available; unsupported integrations are outside the current scope." },
];
export default function RoleWorkspaces() {
  const [active,setActive] = useState(0);
  const role = roles[active];
  return <section id="solutions" className={styles.workflowSection}><div className={styles.container}>
    <div className={styles.heading}><span className={styles.eyebrow}>Role-based workspaces</span><h2>The right performance information for every role.</h2><p>Workspace access follows the role assigned to your account. A role does not grant unrestricted access to confidential employee information.</p></div>
    <div className={styles.tabs} aria-label="Choose a workspace role">{roles.map((item,index) => <button type="button" key={item.label} className={[styles.tab, active === index ? styles.activeTab : ""].join(" ")} aria-pressed={active === index} aria-controls="role-workspace" onClick={() => setActive(index)}>{item.label}</button>)}</div>
    <div id="role-workspace" className={styles.rolePanel} aria-live="polite"><div className={styles.roleCopy}><span className={styles.eyebrow}>{role.label}</span><h3>{role.title}</h3><p>{role.description}</p><ul>{role.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul><Link href="/login">Open your workspace →</Link></div><aside className={styles.roleAvailability}><span className={styles.eyebrow}>Current availability</span><h3>Know what to expect.</h3><p>{role.note}</p><p>Contact your HR team if you need access or help with your assigned role.</p></aside></div>
    <p className={styles.demoNote}>Peer reviewers are intended to participate only in assigned peer reviews, without unrestricted access to employee records. Peer-review execution is planned.</p>
  </div></section>;
}
