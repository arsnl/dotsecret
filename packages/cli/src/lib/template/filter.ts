import dayjs from "dayjs";
import yaml from "js-yaml";
import nodeCrypto from "node:crypto";
/**
 * Encodes a text string as a valid component of a Uniform Resource Identifier (URI)
 */
export const filterEncodeURIComponent = (val: string) =>
  encodeURIComponent(val);

/**
 * Gets the unencoded version of an encoded component of a Uniform Resource Identifier (URI).
 */
export const filterDecodeURIComponent = (val: string) =>
  decodeURIComponent(val);

/**
 * Encode a string to base64
 */
export const filterBase64encode = (val: string) =>
  Buffer.from(val, "utf8").toString("base64");

/**
 * Decode a base64 string
 */
export const filterBase64decode = (val: string) =>
  Buffer.from(val, "base64").toString("utf8");

/**
 * Hashes a string using the specified algorithm.
 */
export const filterHash = (val: string, algorithm: string = "sha256") => {
  const hash = nodeCrypto.createHash(algorithm);
  hash.update(val);
  return hash.digest("hex");
};

/**
 * Encrypt a string using the specified algorithm.
 */
export const filterEncrypt = (
  val: string,
  {
    secret = "",
    iv = "0123456789abcdef0123456789abcdef",
    algorithm = "aes-256-cbc",
  }: { secret?: string; iv?: string; algorithm?: string } = {},
) => {
  const cipher = nodeCrypto.createCipheriv(
    algorithm,
    nodeCrypto.createHash("sha256").update(secret).digest(),
    Buffer.from(iv, "hex"),
  );
  let encrypted = cipher.update(val, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

/**
 * Decrypt a string using the specified algorithm.
 */
export const filterDecrypt = (
  val: string,
  {
    secret = "",
    iv = "0123456789abcdef0123456789abcdef",
    algorithm = "aes-256-cbc",
  }: { secret?: string; iv?: string; algorithm?: string } = {},
) => {
  const decipher = nodeCrypto.createDecipheriv(
    algorithm,
    nodeCrypto.createHash("sha256").update(secret).digest(),
    Buffer.from(iv, "hex"),
  );
  let decrypted = decipher.update(val, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

/**
 * Get the formatted date according to the string of tokens passed in.
 */
export const filterFormatDate = (
  val: string | number | Date,
  format: string = "YYYY-MM-DD HH:mm:ss",
) => dayjs(val).format(format);

/**
 * Converts a JavaScript value to a JSON string.
 */
export const filterJson = (val: any, indent = 2) =>
  JSON.stringify(val, null, indent);

/**
 * Convert a JSON to key=value
 */
export const filterKeyValue = (val: object) =>
  Object.entries(val)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

/**
 * Converts a JSON to YAML.
 */
export const filterYaml = (val: any) => yaml.dump(val);
