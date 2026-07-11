"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useState, useTransition } from "react";

import { ProfessionalBadges } from "@/components/shared/professional-badges";
import type { Locale, ProfessionalBadgeSummary } from "@/lib/types";

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

type CertificationItem = {
  id: string;
  title: string;
  issuer: string | null;
  acquiredAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
};

interface TradesmanProfileEditorProps {
  locale: Locale;
  initialProfile: {
    avatarUrl: string | null;
    headline: string;
    bio: string;
    experienceYears: number;
    serviceRadiusKm: number;
    badges: ProfessionalBadgeSummary[];
    portfolio: PortfolioItem[];
    certifications: CertificationItem[];
  };
}

type ProfileFilePickerProps = {
  id: string;
  label: string;
  buttonLabel: string;
  fileName?: string;
  emptyLabel: string;
  accept: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const copy = {
  en: {
    title: "Professional profile",
    description: "Add your profile photo, introduction, experience, service radius, work photos, and certificates.",
    avatar: "Profile photo",
    chooseAvatar: "Choose profile image",
    headline: "Headline",
    bio: "Bio",
    experienceYears: "Experience years",
    serviceRadiusKm: "Service radius",
    save: "Save profile",
    saving: "Saving...",
    saved: "Profile updated.",
    portfolioTitle: "Portfolio photos",
    portfolioDescription: "Show customers real examples of your finished work.",
    workTitle: "Work photo title",
    workDescription: "Work photo description",
    chooseWorkPhoto: "Choose work photo",
    addPhoto: "Add work photo",
    updatePhoto: "Update work photo",
    adding: "Saving...",
    added: "Portfolio photo saved.",
    noPortfolio: "No portfolio photos yet.",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    deleted: "Item deleted.",
    certificationTitle: "Certificates",
    certificationDescription: "Upload licenses, training certificates, permits, or other trust documents.",
    certificateName: "Certificate title",
    certificateIssuer: "Issuer",
    acquiredAt: "Issue date",
    expiresAt: "Expiry date",
    chooseCertificate: "Choose certificate image",
    chooseFile: "Choose file",
    noFileSelected: "No file selected",
    datePlaceholder: "YYYY-MM-DD",
    addCertificate: "Add certificate",
    updateCertificate: "Update certificate",
    certificateSaved: "Certificate saved.",
    noCertificates: "No certificates yet.",
    viewFile: "View file",
    fileError: "Please choose an image file that is 2.5MB or smaller.",
    genericError: "Something went wrong. Please try again.",
  },
  fil: {
    title: "Professional profile",
    description: "Magdagdag ng profile photo, introduction, experience, service radius, work photos, at certificates.",
    avatar: "Profile photo",
    chooseAvatar: "Pumili ng profile image",
    headline: "Headline",
    bio: "Bio",
    experienceYears: "Experience years",
    serviceRadiusKm: "Service radius",
    save: "Save profile",
    saving: "Saving...",
    saved: "Na-update ang profile.",
    portfolioTitle: "Portfolio photos",
    portfolioDescription: "Ipakita sa customers ang tunay na examples ng natapos mong trabaho.",
    workTitle: "Work photo title",
    workDescription: "Work photo description",
    chooseWorkPhoto: "Pumili ng work photo",
    addPhoto: "Add work photo",
    updatePhoto: "Update work photo",
    adding: "Saving...",
    added: "Na-save ang portfolio photo.",
    noPortfolio: "Wala pang portfolio photos.",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    deleted: "Na-delete ang item.",
    certificationTitle: "Certificates",
    certificationDescription: "Mag-upload ng licenses, training certificates, permits, o trust documents.",
    certificateName: "Certificate title",
    certificateIssuer: "Issuer",
    acquiredAt: "Issue date",
    expiresAt: "Expiry date",
    chooseCertificate: "Pumili ng certificate image",
    chooseFile: "Choose file",
    noFileSelected: "No file selected",
    datePlaceholder: "YYYY-MM-DD",
    addCertificate: "Add certificate",
    updateCertificate: "Update certificate",
    certificateSaved: "Na-save ang certificate.",
    noCertificates: "Wala pang certificates.",
    viewFile: "View file",
    fileError: "Pumili ng image file na 2.5MB o mas maliit.",
    genericError: "May nangyaring mali. Subukan ulit.",
  },
} satisfies Record<Locale, Record<string, string>>;

const allowedImageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const maxImageBytes = 2_500_000;

function getFieldError(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  if ("fieldErrors" in error) {
    const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    return Object.values(fieldErrors ?? {}).flat().find(Boolean) ?? null;
  }

  if ("formErrors" in error) {
    const formErrors = (error as { formErrors?: string[] }).formErrors;
    return formErrors?.[0] ?? null;
  }

  return null;
}

function readImageFile(file: File, errorMessage: string) {
  return new Promise<{ dataUrl: string; fileName: string }>((resolve, reject) => {
    if (!allowedImageTypes.includes(file.type) || file.size > maxImageBytes) {
      reject(new Error(errorMessage));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ dataUrl: reader.result, fileName: file.name });
        return;
      }

      reject(new Error(errorMessage));
    };
    reader.onerror = () => reject(new Error(errorMessage));
    reader.readAsDataURL(file);
  });
}

function getApiError(result: { error?: unknown } | null, fallback: string) {
  return getFieldError(result?.error) ?? (typeof result?.error === "string" ? result.error : fallback);
}

function ProfileFilePicker({
  id,
  label,
  buttonLabel,
  fileName,
  emptyLabel,
  accept,
  onChange,
}: ProfileFilePickerProps) {
  const labelId = `${id}-label`;
  const statusId = `${id}-status`;

  return (
    <div className="grid gap-2 text-sm font-bold text-slate-800">
      <span id={labelId}>{label}</span>
      <div className="relative">
        {/* 실제 파일 input은 투명한 유리문처럼 위에 올려 둔다.
            그래서 클릭/키보드 접근은 그대로 되고, 화면에는 브라우저의 한국어 기본 문구가 보이지 않는다. */}
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={onChange}
          aria-labelledby={labelId}
          aria-describedby={statusId}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <span
          id={statusId}
          aria-live="polite"
          className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition peer-hover:border-teal-300 peer-hover:bg-teal-50 peer-focus-visible:border-teal-400 peer-focus-visible:ring-4 peer-focus-visible:ring-teal-100"
        >
          <span className="min-w-0 truncate">
            {fileName ?? emptyLabel}
          </span>
          <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
            {buttonLabel}
          </span>
        </span>
      </div>
    </div>
  );
}

export function TradesmanProfileEditor({
  locale,
  initialProfile,
}: TradesmanProfileEditorProps) {
  const text = copy[locale];
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string | undefined>();
  const [headline, setHeadline] = useState(initialProfile.headline);
  const [bio, setBio] = useState(initialProfile.bio);
  const [experienceYears, setExperienceYears] = useState(String(initialProfile.experienceYears));
  const [serviceRadiusKm, setServiceRadiusKm] = useState(String(initialProfile.serviceRadiusKm));
  const [portfolio, setPortfolio] = useState(initialProfile.portfolio);
  const [portfolioEditingId, setPortfolioEditingId] = useState<string | null>(null);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [portfolioDataUrl, setPortfolioDataUrl] = useState<string | null>(null);
  const [portfolioFileName, setPortfolioFileName] = useState<string | undefined>();
  const [certifications, setCertifications] = useState(initialProfile.certifications);
  const [certificationEditingId, setCertificationEditingId] = useState<string | null>(null);
  const [certificateTitle, setCertificateTitle] = useState("");
  const [certificateIssuer, setCertificateIssuer] = useState("");
  const [certificateAcquiredAt, setCertificateAcquiredAt] = useState("");
  const [certificateExpiresAt, setCertificateExpiresAt] = useState("");
  const [certificateDataUrl, setCertificateDataUrl] = useState<string | null>(null);
  const [certificateFileName, setCertificateFileName] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [isAddingPortfolio, startPortfolioSave] = useTransition();
  const [isSavingCertificate, startCertificateSave] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage("");
    setErrorMessage("");

    if (!file) {
      return;
    }

    try {
      const image = await readImageFile(file, text.fileError);
      setAvatarDataUrl(image.dataUrl);
      setAvatarFileName(image.fileName);
      setAvatarUrl(image.dataUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text.fileError);
    }
  }

  async function handlePortfolioImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage("");
    setErrorMessage("");

    if (!file) {
      return;
    }

    try {
      const image = await readImageFile(file, text.fileError);
      setPortfolioDataUrl(image.dataUrl);
      setPortfolioFileName(image.fileName);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text.fileError);
    }
  }

  async function handleCertificateFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage("");
    setErrorMessage("");

    if (!file) {
      return;
    }

    try {
      const image = await readImageFile(file, text.fileError);
      setCertificateDataUrl(image.dataUrl);
      setCertificateFileName(image.fileName);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text.fileError);
    }
  }

  function resetPortfolioForm() {
    setPortfolioEditingId(null);
    setPortfolioTitle("");
    setPortfolioDescription("");
    setPortfolioDataUrl(null);
    setPortfolioFileName(undefined);
  }

  function resetCertificateForm() {
    setCertificationEditingId(null);
    setCertificateTitle("");
    setCertificateIssuer("");
    setCertificateAcquiredAt("");
    setCertificateExpiresAt("");
    setCertificateDataUrl(null);
    setCertificateFileName(undefined);
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    startSaving(async () => {
      const response = await fetch("/api/tradesman-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          bio,
          experienceYears,
          serviceRadiusKm,
          avatarDataUrl: avatarDataUrl ?? "",
          avatarFileName: avatarFileName ?? "",
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            profile?: {
              avatarUrl: string | null;
              headline: string;
              bio: string;
              experienceYears: number;
              serviceRadiusKm: number;
            };
            error?: unknown;
          }
        | null;

      if (!response.ok || !result?.profile) {
        setErrorMessage(getApiError(result, text.genericError));
        return;
      }

      setAvatarUrl(result.profile.avatarUrl);
      setAvatarDataUrl(null);
      setAvatarFileName(undefined);
      setHeadline(result.profile.headline);
      setBio(result.profile.bio);
      setExperienceYears(String(result.profile.experienceYears));
      setServiceRadiusKm(String(result.profile.serviceRadiusKm));
      setMessage(text.saved);
    });
  }

  function handlePortfolioSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!portfolioEditingId && !portfolioDataUrl) {
      setErrorMessage(text.fileError);
      return;
    }

    startPortfolioSave(async () => {
      const response = await fetch(
        portfolioEditingId
          ? `/api/tradesman-profile/portfolio/${portfolioEditingId}`
          : "/api/tradesman-profile",
        {
          method: portfolioEditingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: portfolioTitle,
            description: portfolioDescription,
            imageDataUrl: portfolioDataUrl ?? "",
            imageFileName: portfolioFileName ?? "",
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | {
            portfolioItem?: PortfolioItem;
            error?: unknown;
          }
        | null;

      if (!response.ok || !result?.portfolioItem) {
        setErrorMessage(getApiError(result, text.genericError));
        return;
      }

      setPortfolio((current) =>
        portfolioEditingId
          ? current.map((item) => (item.id === result.portfolioItem?.id ? result.portfolioItem : item))
          : [result.portfolioItem!, ...current],
      );
      resetPortfolioForm();
      setMessage(text.added);
    });
  }

  function handleCertificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    startCertificateSave(async () => {
      const response = await fetch(
        certificationEditingId
          ? `/api/tradesman-profile/certifications/${certificationEditingId}`
          : "/api/tradesman-profile",
        {
          method: certificationEditingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "certification",
            title: certificateTitle,
            issuer: certificateIssuer,
            acquiredAt: certificateAcquiredAt,
            expiresAt: certificateExpiresAt,
            fileDataUrl: certificateDataUrl ?? "",
            fileName: certificateFileName ?? "",
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | {
            certification?: CertificationItem;
            error?: unknown;
          }
        | null;

      if (!response.ok || !result?.certification) {
        setErrorMessage(getApiError(result, text.genericError));
        return;
      }

      setCertifications((current) =>
        certificationEditingId
          ? current.map((item) => (item.id === result.certification?.id ? result.certification : item))
          : [result.certification!, ...current],
      );
      resetCertificateForm();
      setMessage(text.certificateSaved);
    });
  }

  function editPortfolioItem(item: PortfolioItem) {
    setMessage("");
    setErrorMessage("");
    setPortfolioEditingId(item.id);
    setPortfolioTitle(item.title);
    setPortfolioDescription(item.description);
    setPortfolioDataUrl(null);
    setPortfolioFileName(undefined);
  }

  function editCertification(item: CertificationItem) {
    setMessage("");
    setErrorMessage("");
    setCertificationEditingId(item.id);
    setCertificateTitle(item.title);
    setCertificateIssuer(item.issuer ?? "");
    setCertificateAcquiredAt(item.acquiredAt ?? "");
    setCertificateExpiresAt(item.expiresAt ?? "");
    setCertificateDataUrl(null);
    setCertificateFileName(undefined);
  }

  function deletePortfolioItem(id: string) {
    setMessage("");
    setErrorMessage("");

    startDeleting(async () => {
      const response = await fetch(`/api/tradesman-profile/portfolio/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: unknown } | null;
        setErrorMessage(getApiError(result, text.genericError));
        return;
      }

      setPortfolio((current) => current.filter((item) => item.id !== id));
      if (portfolioEditingId === id) {
        resetPortfolioForm();
      }
      setMessage(text.deleted);
    });
  }

  function deleteCertification(id: string) {
    setMessage("");
    setErrorMessage("");

    startDeleting(async () => {
      const response = await fetch(`/api/tradesman-profile/certifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: unknown } | null;
        setErrorMessage(getApiError(result, text.genericError));
        return;
      }

      setCertifications((current) => current.filter((item) => item.id !== id));
      if (certificationEditingId === id) {
        resetCertificateForm();
      }
      setMessage(text.deleted);
    });
  }

  return (
    <article className="soft-card p-5">
      <div>
        <p className="text-lg font-bold text-slate-950">{text.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{text.description}</p>
        <div className="mt-3">
          <ProfessionalBadges badges={initialProfile.badges} compact />
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          {message}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
          {errorMessage}
        </p>
      ) : null}

      <form onSubmit={handleProfileSubmit} className="mt-5 grid gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-slate-950 text-white">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" sizes="80px" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-black">
                Pro
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <ProfileFilePicker
              id="profile-avatar-file"
              label={text.avatar}
              buttonLabel={text.chooseAvatar}
              fileName={avatarFileName}
              emptyLabel={text.noFileSelected}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <label className="grid gap-2 text-sm font-bold text-slate-800">
          {text.headline}
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-800">
          {text.bio}
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={5}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            {text.experienceYears}
            <input
              type="number"
              min={0}
              max={60}
              value={experienceYears}
              onChange={(event) => setExperienceYears(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            {text.serviceRadiusKm}
            <input
              type="number"
              min={1}
              max={100}
              value={serviceRadiusKm}
              onChange={(event) => setServiceRadiusKm(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black !text-white transition hover:bg-teal-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? text.saving : text.save}
        </button>
      </form>

      <section className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-lg font-bold text-slate-950">{text.portfolioTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{text.portfolioDescription}</p>

        <form onSubmit={handlePortfolioSubmit} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              {text.workTitle}
              <input
                value={portfolioTitle}
                onChange={(event) => setPortfolioTitle(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
              />
            </label>
            <ProfileFilePicker
              id="profile-portfolio-file"
              label={text.chooseWorkPhoto}
              buttonLabel={text.chooseFile}
              fileName={portfolioFileName}
              emptyLabel={text.noFileSelected}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handlePortfolioImageChange}
            />
          </div>
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            {text.workDescription}
            <textarea
              value={portfolioDescription}
              onChange={(event) => setPortfolioDescription(event.target.value)}
              rows={3}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
            />
          </label>
          {portfolioDataUrl ? (
            <div className="relative h-44 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <Image src={portfolioDataUrl} alt="" fill className="object-cover" sizes="320px" unoptimized />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isAddingPortfolio}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 transition hover:border-teal-300 hover:bg-teal-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {isAddingPortfolio ? text.adding : portfolioEditingId ? text.updatePhoto : text.addPhoto}
            </button>
            {portfolioEditingId ? (
              <button
                type="button"
                onClick={resetPortfolioForm}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200 active:scale-[0.98] sm:flex-none"
              >
                {text.cancel}
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {portfolio.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="relative h-40 bg-slate-100">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="320px" unoptimized />
                ) : null}
              </div>
              <div className="p-4">
                <p className="font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => editPortfolioItem(item)}
                    className="min-h-10 flex-1 rounded-full bg-teal-50 px-3 text-xs font-black text-teal-800 transition hover:bg-teal-100 active:scale-[0.98]"
                  >
                    {text.edit}
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => deletePortfolioItem(item.id)}
                    className="min-h-10 flex-1 rounded-full bg-rose-50 px-3 text-xs font-black text-rose-700 transition hover:bg-rose-100 active:scale-[0.98] disabled:opacity-60"
                  >
                    {text.delete}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {portfolio.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              {text.noPortfolio}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-lg font-bold text-slate-950">{text.certificationTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{text.certificationDescription}</p>

        <form onSubmit={handleCertificationSubmit} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              {text.certificateName}
              <input
                value={certificateTitle}
                onChange={(event) => setCertificateTitle(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              {text.certificateIssuer}
              <input
                value={certificateIssuer}
                onChange={(event) => setCertificateIssuer(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              {text.acquiredAt}
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d{4}-\\d{2}-\\d{2}"
                placeholder={text.datePlaceholder}
                value={certificateAcquiredAt}
                onChange={(event) => setCertificateAcquiredAt(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              {text.expiresAt}
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d{4}-\\d{2}-\\d{2}"
                placeholder={text.datePlaceholder}
                value={certificateExpiresAt}
                onChange={(event) => setCertificateExpiresAt(event.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-400"
              />
            </label>
            <ProfileFilePicker
              id="profile-certificate-file"
              label={text.chooseCertificate}
              buttonLabel={text.chooseFile}
              fileName={certificateFileName}
              emptyLabel={text.noFileSelected}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleCertificateFileChange}
            />
          </div>
          {certificateDataUrl ? (
            <div className="relative h-44 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <Image src={certificateDataUrl} alt="" fill className="object-cover" sizes="320px" unoptimized />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSavingCertificate}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 transition hover:border-teal-300 hover:bg-teal-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {isSavingCertificate
                ? text.adding
                : certificationEditingId
                  ? text.updateCertificate
                  : text.addCertificate}
            </button>
            {certificationEditingId ? (
              <button
                type="button"
                onClick={resetCertificateForm}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200 active:scale-[0.98] sm:flex-none"
              >
                {text.cancel}
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {certifications.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{item.title}</p>
                  {item.issuer ? (
                    <p className="mt-1 text-sm text-slate-600">{item.issuer}</p>
                  ) : null}
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {item.acquiredAt ?? "No issue date"}
                    {item.expiresAt ? ` - ${item.expiresAt}` : ""}
                  </p>
                </div>
                {item.fileUrl ? (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-teal-50 hover:text-teal-800"
                  >
                    {text.viewFile}
                  </a>
                ) : null}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => editCertification(item)}
                  className="min-h-10 flex-1 rounded-full bg-teal-50 px-3 text-xs font-black text-teal-800 transition hover:bg-teal-100 active:scale-[0.98]"
                >
                  {text.edit}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => deleteCertification(item.id)}
                  className="min-h-10 flex-1 rounded-full bg-rose-50 px-3 text-xs font-black text-rose-700 transition hover:bg-rose-100 active:scale-[0.98] disabled:opacity-60"
                >
                  {text.delete}
                </button>
              </div>
            </div>
          ))}
          {certifications.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              {text.noCertificates}
            </p>
          ) : null}
        </div>
      </section>
    </article>
  );
}
