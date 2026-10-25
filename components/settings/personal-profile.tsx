"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { validateContact, type SelfProfile } from "@/lib/personal-settings";
import { cleanProfileDetails, defaultProfileDetails, proficiencyLevels, safeProfessionalUrl, validateProfileDetails, type ProfileDetails } from "@/lib/profile-details";
import { getSelfProfile, updateSelfProfile } from "@/services/personal-settings.service";
import { saveProfileDetails } from "@/services/profile-details.service";
import { Field, inputClass, secondaryClass } from "./settings-ui";
import ProfilePhotoEditor from "./profile-photo-editor";
import ProfileCorrections from "./profile-corrections";

const primaryClass = "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40";
function Group({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5"><div><h3 className="text-base font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>{children}</section>;
}
export default function PersonalProfile({ profile, timezone, onDirty, onBusy, onSaved }: {
  profile: SelfProfile; timezone: string; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void; onSaved: (profile: SelfProfile) => void;
}) {
  const [saved, setSaved] = useState<ProfileDetails>(() => profile.details ?? defaultProfileDetails());
  const [draft, setDraft] = useState(saved); const [cropPending, setCropPending] = useState(false);
  const [phone, setPhone] = useState(profile.employee?.phone ?? ""); const [address, setAddress] = useState(profile.employee?.address ?? "");
  const [busy, setBusy] = useState(false); const [correctionBusy, setCorrectionBusy] = useState(false); const [correctionDirty, setCorrectionDirty] = useState(false);
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoVersion, setPhotoVersion] = useState(0);
  const employee = profile.employee;
  const name = employee ? `${employee.firstName} ${employee.lastName}`.trim() : profile.email;
  const initials = employee ? `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase() : profile.email.slice(0, 2).toUpperCase();
  const extended = Boolean(profile.capabilities?.extendedProfile);
  const canEdit = (field: string) => Boolean(employee && profile.capabilities?.editableProfileFields.includes(field));
  const detailsDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const contactDirty = phone !== (employee?.phone ?? "") || address !== (employee?.address ?? "");
  useEffect(() => { onDirty(detailsDirty || contactDirty || cropPending || correctionDirty); }, [detailsDirty, contactDirty, cropPending, correctionDirty, onDirty]);
  useEffect(() => { onBusy(busy || correctionBusy); }, [busy, correctionBusy, onBusy]);
  function update(patch: Partial<ProfileDetails>) { setDraft((previous) => ({ ...previous, ...patch })); setErrors({}); setError(""); setMessage(""); }
  function reset() { setDraft(saved); setPhone(employee?.phone ?? ""); setAddress(employee?.address ?? ""); setCropPending(false); setPhotoVersion((value) => value + 1); setErrors({}); setError(""); setMessage("Unsaved profile edits discarded."); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const validation = { ...(extended || detailsDirty ? validateProfileDetails(draft) : {}), ...validateContact(phone, address) };
    if (cropPending) validation.photo = "Apply or cancel your photo crop before saving.";
    setErrors(validation);
    if (Object.keys(validation).length) { document.getElementById(`profile-${Object.keys(validation)[0]}`)?.focus(); return; }
    setBusy(true);
    let detailsSaved = false;
    try {
      if (detailsDirty) {
        // Capabilities can be stale when Settings was opened before a server reload.
        // Local photo selection does not require API support, but saving does.
        if (!extended) {
          const refreshed = await getSelfProfile();
          onSaved(refreshed);
          if (!refreshed.capabilities?.extendedProfile) throw new Error("Your server does not support saving profile photos yet. Your crop is kept here; try again after the profile service is available.");
        }
        const result = await saveProfileDetails(draft, profile.id); const next = cleanProfileDetails(result.details!); setDraft(next); setSaved(next); onSaved(result); detailsSaved = true;
      }
      if (contactDirty) {
        const body = { ...(canEdit("phone") ? { phone } : {}), ...(canEdit("address") ? { address } : {}) };
        if (!Object.keys(body).length) throw new Error("Contact editing is unavailable for this account.");
        const result = await updateSelfProfile(body, profile.id); setPhone(result.employee?.phone ?? ""); setAddress(result.employee?.address ?? ""); onSaved(result);
      }
      setMessage("Your profile has been saved to your account.");
    } catch (reason) { setError(`${detailsSaved ? "Your profile details were saved, but contact details could not be saved. " : ""}${getApiErrorMessage(reason)}`); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    {!extended && <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">You can choose and crop a photo here. Saving photos and editing the other profile options require support from your server. Supported contact details remain available.</p>}
    <form noValidate onSubmit={save} className="space-y-5"><fieldset disabled={busy || correctionBusy} className="min-w-0 space-y-5">
        <Group title="About me" description="Introduce yourself with a profile photo and a short bio."><ProfilePhotoEditor key={photoVersion} photo={draft.photo} name={name} initials={initials} disabled={busy || correctionBusy} onChange={(photo) => update({ photo })} onPending={setCropPending} />{errors.photo && <p id="profile-photo" tabIndex={-1} role="alert" className="text-sm text-red-600">{errors.photo}</p>}<fieldset disabled={!extended}><Field id="profile-bio" label="Short bio" error={errors.bio} hint={`${draft.bio.length}/500 characters. Describe your experience, responsibilities or interests.`}><textarea id="profile-bio" rows={4} maxLength={500} className={inputClass} value={draft.bio} placeholder="Tell colleagues a little about yourself…" aria-invalid={Boolean(errors.bio)} aria-describedby={errors.bio ? "profile-bio-error" : "profile-bio-hint"} onChange={(event) => update({ bio: event.target.value })} /></Field></fieldset></Group>
      <fieldset disabled={!extended} className="min-w-0 space-y-5">
        <Group title="Skills and expertise" description="List up to 20 skills. Proficiency levels are self-assessed; mark skills you want to develop.">
          <div id="profile-skills" tabIndex={-1} className="space-y-3">{draft.skills.map((skill, index) => <fieldset key={index} className="space-y-3 rounded-xl bg-slate-50 p-4"><legend className="sr-only">Skill {index + 1}</legend><div className="grid gap-3 sm:grid-cols-2"><Field id={`profile-skill-${index}`} label="Skill"><input id={`profile-skill-${index}`} maxLength={60} className={inputClass} value={skill.name} placeholder="e.g. React or project management" onChange={(event) => update({ skills: draft.skills.map((item, i) => i === index ? { ...item, name: event.target.value } : item) })} /></Field><Field id={`profile-proficiency-${index}`} label="Proficiency"><select id={`profile-proficiency-${index}`} className={inputClass} value={skill.proficiency} onChange={(event) => update({ skills: draft.skills.map((item, i) => i === index ? { ...item, proficiency: event.target.value as typeof skill.proficiency } : item) })}>{proficiencyLevels.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select></Field></div><div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={skill.developing} onChange={(event) => update({ skills: draft.skills.map((item, i) => i === index ? { ...item, developing: event.target.checked } : item) })} />I want to develop this skill</label><button type="button" aria-label={`Remove skill ${skill.name || index + 1}`} className={secondaryClass} onClick={() => update({ skills: draft.skills.filter((_, i) => i !== index) })}>Remove</button></div></fieldset>)}</div>
          {!draft.skills.length && <p className="text-sm text-slate-500">No skills added yet.</p>}{errors.skills && <p role="alert" className="text-sm text-red-600">{errors.skills}</p>}<button type="button" className={secondaryClass} disabled={draft.skills.length >= 20} onClick={() => update({ skills: [...draft.skills, { name: "", proficiency: "learning", developing: false }] })}>Add skill</button>
        </Group>
        <Group title="Career interests" description="Describe roles, responsibilities and projects you would like to explore. These interests support development conversations; they are not promotion commitments."><Field id="profile-careerInterests" label="Your career interests" error={errors.careerInterests} hint={`${draft.careerInterests.length}/1,000 characters.`}><textarea id="profile-careerInterests" className={inputClass} rows={4} maxLength={1000} value={draft.careerInterests} aria-invalid={Boolean(errors.careerInterests)} aria-describedby={errors.careerInterests ? "profile-careerInterests-error" : "profile-careerInterests-hint"} placeholder="e.g. Lead a project, explore data analysis, or mentor colleagues…" onChange={(event) => update({ careerInterests: event.target.value })} /></Field><Field id="profile-careerVisibility" label="Career interests visibility" error={errors.careerVisibility} hint="Private interests are available only to you. Shared interests are available to HR and your assigned reporting manager."><select id="profile-careerVisibility" className={inputClass} value={draft.careerVisibility} onChange={(event) => update({ careerVisibility: event.target.value as ProfileDetails["careerVisibility"] })}><option value="private">Only me</option><option value="manager_hr">My reporting manager and HR</option></select></Field></Group>
        <Group title="Professional links" description="Add up to 5 links to your portfolio, professional profiles or credentials."><div id="profile-links" tabIndex={-1} className="space-y-3">{draft.links.map((link, index) => <fieldset key={index} className="space-y-3 rounded-xl bg-slate-50 p-4"><legend className="sr-only">Professional link {index + 1}</legend><Field id={`profile-link-label-${index}`} label="Link label"><input id={`profile-link-label-${index}`} className={inputClass} maxLength={60} value={link.label} placeholder="e.g. LinkedIn or portfolio" onChange={(event) => update({ links: draft.links.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} /></Field><Field id={`profile-link-url-${index}`} label="Web address"><input id={`profile-link-url-${index}`} className={inputClass} type="url" maxLength={500} value={link.url} placeholder="https://" onChange={(event) => update({ links: draft.links.map((item, i) => i === index ? { ...item, url: event.target.value } : item) })} /></Field><div className="flex flex-wrap items-center justify-between gap-3">{safeProfessionalUrl(link.url) && <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700 underline">Open {link.label || "link"}</a>}<button type="button" className={secondaryClass} aria-label={`Remove link ${link.label || index + 1}`} onClick={() => update({ links: draft.links.filter((_, i) => i !== index) })}>Remove</button></div></fieldset>)}</div>{!draft.links.length && <p className="text-sm text-slate-500">No professional links added yet.</p>}{errors.links && <p role="alert" className="text-sm text-red-600">{errors.links}</p>}<button type="button" className={secondaryClass} disabled={draft.links.length >= 5} onClick={() => update({ links: [...draft.links, { label: "", url: "" }] })}>Add professional link</button></Group>
      </fieldset>
      <Group title="Employment details" description="Official details are managed by HR. Use the correction request below if something needs updating."><dl className="grid gap-4 text-sm sm:grid-cols-2">{[{ label: "Full name", value: name }, { label: "Employee ID", value: employee?.employeeNumber }, { label: "Work email", value: profile.email }, { label: "Job title", value: employee?.jobTitle }, { label: "Department", value: employee?.department }, { label: "Team", value: employee?.team }, { label: "Reporting manager", value: employee?.reportingManager }].map(({ label, value }) => <div key={label}><dt className="font-semibold text-slate-800">{label}</dt><dd className="mt-1 break-words text-slate-500">{value || "Not provided"}</dd></div>)}</dl></Group>
      <Group title="Personal contact details" description="Your personal contact information is kept separate from professional profile details."><Field id="profile-phone" label="Phone number" error={errors.phone}><input id="profile-phone" type="tel" autoComplete="tel" maxLength={20} className={inputClass} value={phone} disabled={!canEdit("phone")} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "profile-phone-error" : undefined} onChange={(event) => { setPhone(event.target.value); setErrors({}); setMessage(""); }} /></Field><Field id="profile-address" label="Personal address" error={errors.address}><textarea id="profile-address" autoComplete="street-address" rows={2} maxLength={300} className={inputClass} value={address} disabled={!canEdit("address")} aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? "profile-address-error" : undefined} onChange={(event) => { setAddress(event.target.value); setErrors({}); setMessage(""); }} /></Field>{!employee && <p className="text-sm text-slate-500">No employee record is linked to this account.</p>}</Group>
      <div className="flex flex-wrap justify-end gap-3"><button type="button" className={secondaryClass} disabled={!detailsDirty && !contactDirty && !cropPending} onClick={reset}>Cancel profile edits</button><button type="submit" className={primaryClass} disabled={cropPending || (!detailsDirty && !contactDirty)}>{busy ? "Saving profile…" : "Save profile"}</button></div>
    </fieldset></form>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div aria-live="polite">{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}</div>
    <ProfileCorrections profile={profile} timezone={timezone} onDirty={setCorrectionDirty} onBusy={setCorrectionBusy} onUpdated={() => { getSelfProfile().then(onSaved).catch((reason) => setError(getApiErrorMessage(reason))); }} />
  </div>;
}
