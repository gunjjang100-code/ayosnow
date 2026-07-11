export type UserRole = "customer" | "tradesman" | "admin";
export type Locale = "fil" | "en";
export type QuoteRequestStatus = "open" | "matched" | "closed" | "cancelled";
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
  categoryName: string;
  providerName: string;
  providerSlug: string;
  location: string;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTime: string;
  durationLabel: string;
  isVerified: boolean;
  providerBadges: ProfessionalBadgeSummary[];
  arrival: string;
  tags: string[];
}

export interface ProfessionalBadgeSummary {
  code: "VERIFIED_PROFESSIONAL" | "TOP_PROFESSIONAL";
  label: string;
  description: string;
  tone: "verified" | "top";
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

export interface TradesmanAvailabilityItem {
  dayOfWeek: number;
  dayLabel: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
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
  tradesmanBadges?: ProfessionalBadgeSummary[];
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
  photoUrl?: string | null;
  targetName?: string;
  location?: string;
  createdAt?: string;
}

export interface TradesmanCertificatePreview {
  id: string;
  title: string;
  issuer: string | null;
  acquiredAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
}

export interface TradesmanPortfolioPreview {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
}

export interface TradesmanProfileData {
  slug: string;
  name: string;
  headline: string;
  bio: string;
  skills: string[];
  certificates: TradesmanCertificatePreview[];
  portfolio: TradesmanPortfolioPreview[];
  serviceAreas: string[];
  rating: number;
  badges: ProfessionalBadgeSummary[];
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
