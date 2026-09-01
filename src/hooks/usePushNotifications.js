import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { clientApi } from "../../clientApi"; // ⚠️ adapte le chemin relatif si besoin

/**
 * À appeler une seule fois, dans ClientDashboard, une fois que le
 * mutualiste est connecté (clientApi injecte déjà le token automatiquement).
 */
export function usePushNotifications() {
  useEffect(() => {
    // Pas de notifications natives en dehors de l'app Android/iOS
    if (!Capacitor.isNativePlatform()) return;

    const registerPush = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        console.warn("Permission notifications refusée par le mutualiste");
        return;
      }

      await PushNotifications.register();
    };

    const registrationListener = PushNotifications.addListener(
      "registration",
      async (token) => {
        try {
          // clientApi a déjà pour baseURL /api/client et injecte le token
          await clientApi.post("/push-token", {
            fcmToken: token.value,
            platform: Capacitor.getPlatform(),
          });
        } catch (err) {
          console.error("Erreur enregistrement token push:", err);
        }
      }
    );

    const registrationErrorListener = PushNotifications.addListener(
      "registrationError",
      (err) => console.error("Erreur registration push:", err.error)
    );

    const receivedListener = PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Notification reçue (app ouverte):", notification);
      }
    );

    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        console.log("Notification tapée:", action.notification);
      }
    );

    registerPush();

    return () => {
      registrationListener.remove();
      registrationErrorListener.remove();
      receivedListener.remove();
      actionListener.remove();
    };
  }, []);
}
