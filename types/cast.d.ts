export {};

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    chrome?: {
      cast?: {
        AutoJoinPolicy?: {
          ORIGIN_SCORED: string;
          TAB_AND_ORIGIN_SCORED: string;
          PAGE_SCORED: string;
        };
        media?: {
          DEFAULT_MEDIA_RECEIVER_APP_ID: string;
        };
      };
    };
    cast?: {
      framework?: {
        CastContext: {
          getInstance: () => {
            setOptions: (options: Record<string, unknown>) => void;
            requestSession: () => Promise<unknown>;
            getCastState: () => string;
          };
        };
        CastState?: {
          NO_DEVICES_AVAILABLE: string;
          NOT_CONNECTED: string;
          CONNECTING: string;
          CONNECTED: string;
        };
      };
    };
  }
}
