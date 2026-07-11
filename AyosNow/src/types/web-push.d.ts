declare module "web-push" {
  interface PushSubscriptionKeys {
    p256dh: string;
    auth: string;
  }

  interface PushSubscription {
    endpoint: string;
    keys: PushSubscriptionKeys;
  }

  interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  interface WebPushApi {
    setVapidDetails(contactEmail: string, publicKey: string, privateKey: string): void;
    sendNotification(
      subscription: PushSubscription,
      payload?: string,
    ): Promise<unknown>;
    generateVAPIDKeys(): VapidKeys;
  }

  const webpush: WebPushApi;
  export default webpush;
}
