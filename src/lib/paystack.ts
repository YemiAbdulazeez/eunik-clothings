import PaystackPop from "@paystack/inline-js";
import { HTTP_ENABLED, httpPayments } from "@/api/http";
import { db } from "@/db/database";

const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

export type PaystackResult = {
  reference: string;
  demo: boolean;
};

/**
 * Opens Paystack Inline when API + public key are available.
 * Falls back to local demo complete when offline/demo mode.
 */
export async function openPaystackCheckout(opts: {
  orderId: string;
  email: string;
  amountKobo: number;
  type?: "deposit" | "balance" | "full";
}): Promise<PaystackResult> {
  const type = opts.type ?? "full";

  if (!HTTP_ENABLED || !publicKey || publicKey.includes("...")) {
    await db.payments.completePaystack(opts.orderId, opts.amountKobo, type);
    const init = await db.payments.initializePaystack(opts.orderId, opts.amountKobo);
    return { reference: init.reference, demo: true };
  }

  const { accessCode, reference } = await httpPayments.initializePaystack(opts.orderId, type);

  await new Promise<void>((resolve, reject) => {
    const popup = new PaystackPop();
    popup.resumeTransaction(accessCode, {
      onSuccess: () => resolve(),
      onCancel: () => reject(new Error("Payment cancelled.")),
      onError: (error: { message?: string }) => reject(new Error(error?.message ?? "Paystack error.")),
    });
  });

  await httpPayments.verifyPaystack(reference);
  return { reference, demo: false };
}
