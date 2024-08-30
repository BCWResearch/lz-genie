import { PostHog } from 'posthog-node';
import { nanoid } from 'nanoid';
import logger from './logger';

class PostHogUtil {
  private static instance: PostHog | null = null;
  private static userId: string | null = null;
  private static sessionId: string | null = null;

  public static initialize(userId: string): void {
    if (!PostHogUtil.instance) {
      PostHogUtil.userId = userId;
      PostHogUtil.instance = new PostHog(
        'phc_eQBKFoUSsUfRI4vV5PCAA5sE31F6UsTj5TIq7H0Bf90',
        { host: 'https://us.i.posthog.com', flushAt: 1, flushInterval: 0 }
      );

      PostHogUtil.instance.on('error', (err) => {
        logger.verbose('Error in PostHogUtil:', err);
      });

      PostHogUtil.instance.identify({ distinctId: PostHogUtil.userId });
      PostHogUtil.sessionId = PostHogUtil.generateRandomId();
      logger.verbose(
        `User id: ${PostHogUtil.userId}, session id: ${PostHogUtil.sessionId}`
      );
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
        timestamp: new Date(),
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
