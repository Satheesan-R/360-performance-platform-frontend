"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { createEmployee } from "@/services/employee.service";
import type { CreateEmployeeRequest } from "@/types/employee";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export default function EmployeeOnboardingPage() {
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activationUrl, setActivationUrl] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeRequest>({
    defaultValues: { role: "employee", employmentType: "full-time" },
  });

  async function onSubmit(values: CreateEmployeeRequest) {
    setServerError("");
    setSuccessMessage("");
    setActivationUrl("");

    const token = getToken();
    if (!token) {
      setServerError("Your session has expired. Please log in again.");
      return;
    }

    try {
      const result = await createEmployee(values, token);
      setSuccessMessage(result.message);
      setActivationUrl(result.activationUrl ?? "");
      reset({ role: "employee", employmentType: "full-time" });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <nav className="mb-3 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/hr/dashboard" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <span className="font-medium text-blue-600">Employee Onboarding</span>
      </nav>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">NEW EMPLOYEE</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Create Talent Profile</h1>
          <p className="mt-2 text-slate-500">Add employee details and send an account activation email.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => reset()} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Clear
          </button>
          <button form="employee-form" type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Creating..." : "Save & Send Mail"}
          </button>
        </div>
      </div>

      {successMessage && (
        <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <p className="font-semibold">{successMessage}</p>
          {activationUrl && (
            <p className="mt-2 break-all text-xs">
              Development activation link: <a className="font-semibold underline" href={activationUrl}>{activationUrl}</a>
            </p>
          )}
        </div>
      )}
      {serverError && <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{serverError}</p>}

      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Personal details</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Basic identification and contact information.</p>
          </div>
          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
            <Field label="Full name *" error={errors.fullName?.message}>
              <input {...register("fullName", { required: "Full name is required" })} className={inputClass} placeholder="e.g. John Doe" />
            </Field>
            <Field label="Gender">
              <select {...register("gender")} className={inputClass} defaultValue="">
                <option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input {...register("dateOfBirth")} type="date" className={inputClass} />
            </Field>
            <Field label="Personal email" error={errors.personalEmail?.message}>
              <input {...register("personalEmail", { pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } })} type="email" className={inputClass} placeholder="john@example.com" />
            </Field>
            <Field label="Phone number">
              <input {...register("phone")} type="tel" className={inputClass} placeholder="+94 77 123 4567" />
            </Field>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Professional details</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Define placement, access role, and reporting hierarchy.</p>
          </div>
          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
            <Field label="Company email *" error={errors.companyEmail?.message}>
              <input {...register("companyEmail", { required: "Company email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid company email" } })} type="email" className={inputClass} placeholder="john@company.com" />
            </Field>
            <Field label="System role *">
              <select {...register("role", { required: true })} className={inputClass}>
                <option value="employee">Employee</option><option value="tech_lead">Tech Lead</option><option value="department_manager">Department Manager</option><option value="hr">HR</option><option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Department">
              <select {...register("department")} className={inputClass} defaultValue="">
                <option value="">Select department</option><option value="engineering">Engineering</option><option value="qa">QA & Testing</option><option value="finance">Finance</option><option value="hr">Human Resources</option><option value="operations">Operations</option>
              </select>
            </Field>
            <Field label="Designation / position">
              <input {...register("designation")} className={inputClass} placeholder="e.g. Software Engineer" />
            </Field>
            <Field label="Reporting manager">
              <input {...register("reportingManager")} className={inputClass} placeholder="Manager name or email" />
            </Field>
            <Field label="Office location">
              <input {...register("officeLocation")} className={inputClass} placeholder="e.g. Colombo" />
            </Field>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Contract & status</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Employment terms and starting information.</p>
          </div>
          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
            <Field label="Employment type">
              <select {...register("employmentType")} className={inputClass}>
                <option value="full-time">Full-time</option><option value="probation">Probation</option><option value="intern">Intern</option>
              </select>
            </Field>
            <Field label="Contract start date">
              <input {...register("contractStartDate")} type="date" className={inputClass} />
            </Field>
          </div>
        </section>
      </form>
    </main>
  );
}
