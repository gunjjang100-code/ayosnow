const LEGACY_PROFILE_BIO =
  "전문 기술 카테고리 설정 후 포트폴리오와 소개를 더 채워 넣을 수 있습니다.";
const hangulPattern = /[가-힣]/;

export function normalizeTradesmanProfileHeadline(params: {
  headline: string;
  fullName: string;
}) {
  const trimmedHeadline = params.headline.trim();

  if (trimmedHeadline === `${params.fullName}님의 전문 서비스`) {
    return `${params.fullName}'s professional services`;
  }

  if (trimmedHeadline.endsWith("님의 전문 서비스")) {
    return trimmedHeadline.replace(/님의 전문 서비스$/, "'s professional services");
  }

  if (hangulPattern.test(trimmedHeadline)) {
    return `${params.fullName}'s professional services`;
  }

  return params.headline;
}

export function normalizeTradesmanProfileBio(bio: string) {
  if (bio.trim() === LEGACY_PROFILE_BIO) {
    return "You can add portfolio items and a stronger introduction after choosing specialty categories.";
  }

  if (hangulPattern.test(bio)) {
    return "Tell customers about your experience, service style, and the jobs you handle best.";
  }

  return bio;
}
