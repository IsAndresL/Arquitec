/**
 * Web Notifications Utility for Magdalena Smart Farming
 */

export const notifications = {
  /**
   * Request native browser notifications permission
   */
  requestPermission: async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    return await Notification.requestPermission();
  },

  /**
   * Check if notifications are granted
   */
  getPermissionStatus: (): NotificationPermission => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  },

  /**
   * Trigger a native browser notification, accompanied by beep and vibration
   */
  show: (title: string, body: string, options: NotificationOptions = {}) => {
    if (typeof window === "undefined") return;

    // 1. Play premium audio beep
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      // Satisfying notification frequency (523.25 Hz = C5)
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      oscillator.start();
      // Short friendly beep
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.warn("AudioContext not allowed or not supported yet:", err);
    }

    // 2. Trigger hardware vibration if mobile
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // 3. Display standard HTML5 notification
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/Smart_Farming_Logo.png",
          badge: "/Smart_Farming_Logo.png",
          ...options,
        });
      } catch (err) {
        console.error("Failed to display native Notification:", err);
      }
    }
  }
};
