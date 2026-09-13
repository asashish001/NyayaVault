import * as jose from 'jose';

// In a real production setup, the App would verify using the ESP's Public Key (RS256).
// For this simulation, we use symmetric HS256 to represent the ESP gateway's signature.
const ESP_SECRET = new TextEncoder().encode(
  'super-secure-national-esign-secret-key-2026'
);

/**
 * Generates a cryptographically signed JWT representing an X.509 e-Sign certificate.
 * This is called by the "external" e-Sign Gateway after the user authenticates with OTP.
 */
export async function generateEspSignature(
  actorId: string,
  documentId: string,
  action: string,
  toDepartment: string,
  reason: string
): Promise<string> {
  const jwt = await new jose.SignJWT({ actorId, documentId, action, toDepartment, reason })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('urn:nyayavault:esp:simulator')
    .setAudience('urn:nyayavault:app')
    .setExpirationTime('10m') // Tokens expire quickly to prevent replay attacks
    .sign(ESP_SECRET);
    
  return jwt;
}

/**
 * Verifies the signed JWT from the e-Sign Gateway.
 * The NyayaVault backend calls this to cryptographically validate the signature 
 * before committing the custody transfer to the ledger.
 */
export async function verifyEspSignature(jwt: string): Promise<jose.JWTPayload> {
  try {
    const { payload } = await jose.jwtVerify(jwt, ESP_SECRET, {
      issuer: 'urn:nyayavault:esp:simulator',
      audience: 'urn:nyayavault:app',
    });
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired e-Sign signature token.');
  }
}
