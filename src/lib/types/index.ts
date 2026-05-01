export type UserRole = "customer" | "tradesman" | "admin";
export type Locale = "ko" | "fil" | "en";
export type QuoteRequestStatus = "open" | "matched" | "closed";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface NavigationItem {
  label: string;
  href: string;
}

export interface Category {
  slug: string;
  name: string;
  shortDescription: string;
  startingPrice: string;
}

export interface ServiceSummary {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  providerName: string;
  providerSlug: string;
  location: string;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  arrival: string;
  tags: string[];
}

export interface ManagedServiceItem {
  id: string;
  slug: string;
  title: string;
  location: string;
  priceLabel: string;
  arrival: string;
  tags: string[];
  isActive: boolean;
}

export interface QuoteRequestPreview {
  id: string;
  serviceName: string;
  location: string;
  budgetLabel: string;
  targetDate: string;
  summary: string;
  bidsCount: number;
  status: QuoteRequestStatus;
}

export interface QuoteOffer {
  id: string;
  requestId: string;
  tradesmanName: string;
  tradesmanSlug: string;
  amountLabel: string;
  arrivalText: string;
  message: string;
  rating: number;
  completedJobs: number;
}

export interface BookingPreview {
  id: string;
  title: string;
  customerName: string;
  tradesmanName: string;
  dateLabel: string;
  location: string;
  status: BookingStatus;
  mode: "instant-booking" | "quote-match";
}

export interface ReviewPreview {
  id: string;
  author: string;
  rating: number;
  comment: string;
}

export interface TradesmanProfileData {
  slug: string;
  name: string;
  headline: string;
  bio: string;
  skills: string[];
  certificates: string[];
  portfolio: string[];
  serviceAreas: string[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTime: string;
  startingPrice: string;
  reviews: ReviewPreview[];
}

export interface ChatPreview {
  id: string;
  participantName: string;
  jobTitle: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

export interface AdminAlert {
  id: string;
  type: "risk" | "approval" | "dispute";
  title: string;
  description: string;
  actionLabel: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  helper: string;
}

export interface AdminCategoryItem {
  id: string;
  slug: string;
  nameKo?: string;
  nameFil?: string;
  nameEn?: string;
  descriptionKo?: string;
  descriptionFil?: string;
  descriptionEn?: string;
  name?: string;
  description?: string;
  serviceCount: number;
  statusLabel: string;
  sortOrder: number;
  featured?: boolean;
  isActive?: boolean;
}

export interface PlatformFeeItem {
  id: string;
  name: string;
  targetLabel: string;
  feeLabel: string;
  chargeRule: string;
}

export interface BannerItem {
  id: string;
  title: string;
  placement: string;
  statusLabel: string;
  activePeriod: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  audienceLabel: string;
  statusLabel: string;
  publishedAt: string;
}

export interface ApprovalQueueItem {
  id: string;
  tradesmanName: string;
  categoryLabel: string;
  submittedAt: string;
  verificationLabel: string;
}

export interface OneOutCaseItem {
  id: string;
  tradesmanName: string;
  issueSummary: string;
  riskLevel: string;
  lastActionAt: string;
}
