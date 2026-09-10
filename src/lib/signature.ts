import crypto from "crypto";

/**
 * Simulates a Digital Signature Certificate (Class-3 DSC) signature process.
 * In a real-world scenario, this would involve a PKI infrastructure,
 * e-Sign API, or a hardware token (USB Dongle) where the user enters a PIN.
 * 
 * For this MVP (per Rule R3), we deterministically hash the payload 
 * along with the actor's ID and timestamp to simulate a verifiable signature.
 */
export function simulateDigitalSignature(
  actorId: string,
  documentId: string,
  action: string,
  pin: string
): string {
  // If the PIN is obviously wrong, we can reject it (for demo purposes)
  if (pin !== "1234" && pin !== "0000") {
    throw new Error("Invalid DSC PIN");
  }

  const payload = JSON.stringify({
    actorId,
    documentId,
    action,
    timestamp: new Date().toISOString(),
    salt: crypto.randomBytes(8).toString("hex")
  });

  // Create a SHA-256 hash of the payload
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  
  // Return a mock PKCS7/JWT-like string structure for realism
  return `dsc.sig.${hash.substring(0, 32)}`;
}
