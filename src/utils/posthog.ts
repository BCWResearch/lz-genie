import { PostHog } from 'posthog-node';
import { nanoid } from 'nanoid';

class PostHogUtil {
  private static instance: PostHog | null = null;
  private static userId: string | null = null;
  private static sessionId: string | null = null;

  public static initialize(userId: string): void {
    if (!PostHogUtil.instance) {
      PostHogUtil.userId = userId;
      // TODO: Figure out best way to bundle api key
      PostHogUtil.instance = new PostHog(
        'phc_6usCsJGzJQdL6tf7tgmg5iwFAawypdrm2yeflksJwa4',
        { host: 'https://us.i.posthog.com', flushAt: 1, flushInterval: 0 }
      );

      PostHogUtil.instance.on('error', (err) => {
        // TODO: Some verbose logging here
        console.error('Error in PostHogUtil:', err);
      });

      // generate a random user id
      console.log('User ID:', PostHogUtil.userId);
      PostHogUtil.instance.identify({ distinctId: PostHogUtil.userId });
      PostHogUtil.sessionId = PostHogUtil.generateRandomId();
      PostHogUtil.trackEvent('session_started');
    }
  }

  public static generateRandomId(): string {
    return nanoid();
  }

  public static trackEvent(
    eventName: string,
    properties: Record<string, any> = {}
  ): void {
    if (PostHogUtil.instance) {
      PostHogUtil.instance.capture({
        distinctId: PostHogUtil.userId,
        event: eventName,
        properties: {
          $session_id: PostHogUtil.sessionId,
          ...properties,
        },
      });
    }
  }

  public static async shutdown(): Promise<void> {
    if (PostHogUtil.instance) {
      PostHogUtil.trackEvent('session_ended');
      await PostHogUtil.instance.flush();
      await PostHogUtil.instance.shutdown();
    }
  }
}

export default PostHogUtil;
