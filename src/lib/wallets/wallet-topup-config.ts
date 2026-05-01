export const QUOTE_SUBMISSION_CREDIT_COST = 40;
export const DEMO_TRADESMAN_INITIAL_CREDIT = 200;
export const WALLET_TOPUP_PACKAGES = [200, 400, 800] as const;
export const WALLET_TOPUP_PENDING_WINDOW_MINUTES = 10;

export function isSupportedWalletTopupAmount(amount: number) {
  return WALLET_TOPUP_PACKAGES.includes(amount as (typeof WALLET_TOPUP_PACKAGES)[number]);
}
