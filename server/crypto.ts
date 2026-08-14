import crypto from "crypto";

// Default encryption key fallback if not provided in env
const DEFAULT_KEY_HEX = "f48a9b2c3d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a";

export function getMasterKey(): Buffer {
  const envKey = process.env.DATA_ENCRYPTION_KEY || DEFAULT_KEY_HEX;
  // If 64 hex chars, parse as 32-byte buffer, else hash it to 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }
  return crypto.createHash("sha256").update(envKey).digest();
}

/**
 * Returns candidate decryption keys to allow seamless key rotation and backward compatibility.
 */
function getCandidateKeys(): Buffer[] {
  const keys: Buffer[] = [];
  const envKey = process.env.DATA_ENCRYPTION_KEY;

  if (envKey) {
    if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
      keys.push(Buffer.from(envKey, "hex"));
    }
    keys.push(crypto.createHash("sha256").update(envKey).digest());
  }

  // Add default system key
  keys.push(Buffer.from(DEFAULT_KEY_HEX, "hex"));
  keys.push(crypto.createHash("sha256").update(DEFAULT_KEY_HEX).digest());

  // Add JWT_SECRET as candidate key if configured
  if (process.env.JWT_SECRET) {
    keys.push(crypto.createHash("sha256").update(process.env.JWT_SECRET).digest());
  }

  return keys;
}

/**
 * Encrypt sensitive payload using AES-256-GCM
 */
export function encryptPayload(data: unknown): string {
  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    const text = typeof data === "string" ? data : JSON.stringify(data);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt sensitive data");
  }
}

/**
 * Decrypt AES-256-GCM payload with keyring fallback
 */
export function decryptPayload<T = unknown>(encryptedString: string): T {
  try {
    if (!encryptedString || typeof encryptedString !== "string") {
      return encryptedString as unknown as T;
    }
    
    // Check if format matches iv:authTag:encrypted
    const parts = encryptedString.split(":");
    if (parts.length !== 3) {
      // Not encrypted or legacy plain text
      try {
        return JSON.parse(encryptedString) as T;
      } catch {
        return encryptedString as unknown as T;
      }
    }
    
    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const candidateKeys = getCandidateKeys();
    
    for (const key of candidateKeys) {
      try {
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedDataHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        
        try {
          return JSON.parse(decrypted) as T;
        } catch {
          return decrypted as unknown as T;
        }
      } catch {
        // Try next candidate key in keyring
        continue;
      }
    }
    
    // If all candidate keys failed, attempt plain string parse fallback
    try {
      return JSON.parse(encryptedDataHex) as T;
    } catch {
      return null as unknown as T;
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return null as unknown as T;
  }
}

/**
 * Audit / Health check for encryption system
 */
export function verifyEncryptionIntegrity(): {
  status: string;
  algorithm: string;
  keyLengthBits: number;
  testPassed: boolean;
  sampleIvLength: number;
} {
  const sample = { amount: 149.99, merchant: "AWS Cloud Services", note: "Monthly infrastructure billing" };
  const encrypted = encryptPayload(sample);
  const decrypted = decryptPayload<typeof sample>(encrypted);
  const testPassed = decrypted.amount === sample.amount && decrypted.merchant === sample.merchant;
  
  return {
    status: "active",
    algorithm: "AES-256-GCM (Galois/Counter Mode with Authentication Tag)",
    keyLengthBits: 256,
    testPassed,
    sampleIvLength: 12
  };
}
