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
        console.error('Error in Posthog:', err);
      });

      PostHogUtil.instance.on('flush', (args) => {
        console.log(`\n\n====> Posthog flush:\n\n`, args);
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
      console.log(
        `** Tracked event ${eventName}, for userId ${PostHogUtil.userId}, with sessionId ${PostHogUtil.sessionId} **`
      );
    } else {
      console.log(
        `Tried to track event ${eventName} but PostHogUtil instance is not initialized`
      );
    }
  }

  public static async shutdown(): Promise<void> {
    if (PostHogUtil.instance) {
      //   console.log('shutdown(): sending session_ended event');
      PostHogUtil.trackEvent('session_ended');
      //   console.log(
      //     'session_ended event sent, shutting down PostHogUtil instance'
      //   );

      //   console.log('flushing PostHogUtil instance');
      const flushed = await PostHogUtil.instance.flush();
      //   await new Promise((resolve) => setTimeout(resolve, 10_000));
      //   console.log('PostHogUtil instance flushed', flushed);
      //   console.log('shutting down PostHogUtil instance');
      await PostHogUtil.instance.shutdown();
      //   await new Promise((resolve) => setTimeout(resolve, 10_000));
      //   console.log('PostHogUtil instance shut down');
    }
  }
}

export default PostHogUtil;
