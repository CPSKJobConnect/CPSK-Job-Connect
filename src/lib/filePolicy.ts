import { Buffer } from "buffer";

type MagicSignature = {
  label: string;
  bytes: Buffer;
  offset?: number;
  extraCheck?: (header: Buffer) => boolean;
};

export interface UploadPolicy {
  key: string;
  label: string;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  signatures: MagicSignature[];
}

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileValidationError";
  }
}

const hex = (value: string) => Buffer.from(value, "hex");

const MAGIC_SIGNATURES = {
  pdf: {
    label: "PDF",
    bytes: hex("25504446"),
  },
  doc: {
    label: "DOC",
    bytes: hex("D0CF11E0A1B11AE1"),
  },
  docx: {
    label: "DOCX",
    bytes: hex("504B0304"),
  },
  png: {
    label: "PNG",
    bytes: hex("89504E470D0A1A0A"),
  },
  jpg: {
    label: "JPG",
    bytes: hex("FFD8FF"),
  },
  webp: {
    label: "WEBP",
    bytes: Buffer.from("RIFF"),
    extraCheck: (header: Buffer) =>
      header.length >= 12 && header.subarray(8, 12).toString("ascii") === "WEBP",
  },
} satisfies Record<string, MagicSignature>;

const DOCUMENT_POLICY: UploadPolicy = {
  key: "document",
  label: "Document",
  allowedExtensions: ["pdf", "doc", "docx"],
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxSizeBytes: 10 * 1024 * 1024,
  signatures: [MAGIC_SIGNATURES.pdf, MAGIC_SIGNATURES.doc, MAGIC_SIGNATURES.docx],
};

const PDF_ONLY_POLICY: UploadPolicy = {
  ...DOCUMENT_POLICY,
  key: "pdf",
  allowedExtensions: ["pdf"],
  allowedMimeTypes: ["application/pdf"],
  signatures: [MAGIC_SIGNATURES.pdf],
  label: "PDF document",
};

const IMAGE_POLICY: UploadPolicy = {
  key: "image",
  label: "Profile image",
  allowedExtensions: ["png", "jpg", "jpeg", "webp"],
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxSizeBytes: 5 * 1024 * 1024,
  signatures: [MAGIC_SIGNATURES.png, MAGIC_SIGNATURES.jpg, MAGIC_SIGNATURES.webp],
};

const DOC_TYPE_POLICIES: Record<number, UploadPolicy> = {
  1: { ...DOCUMENT_POLICY, label: "Resume" },
  2: { ...DOCUMENT_POLICY, label: "CV" },
  3: { ...DOCUMENT_POLICY, label: "Portfolio" },
  4: { ...PDF_ONLY_POLICY, label: "Transcript", maxSizeBytes: 15 * 1024 * 1024 },
  5: { ...PDF_ONLY_POLICY, label: "Company document" },
  6: { ...IMAGE_POLICY, label: "Profile background" },
  7: { ...PDF_ONLY_POLICY, label: "Company evidence", maxSizeBytes: 15 * 1024 * 1024 },
};

export const SUPPORTED_DOCUMENT_TYPE_IDS = Object.keys(DOC_TYPE_POLICIES).map((key) =>
  Number.parseInt(key, 10)
);

const unsafeChars = /[^a-zA-Z0-9._-]/g;

export function sanitizeFileName(originalName: string, fallbackExtension?: string) {
  const withoutPath = originalName.replace(/\\/g, "/").split("/").pop() ?? "file";
  const pieces = withoutPath.split(".");
  const rawExtension = pieces.length > 1 ? pieces.pop()!.toLowerCase() : "";
  const baseNameRaw = pieces.join(".") || withoutPath;

  let extension = rawExtension.replace(/[^a-z0-9]/gi, "");
  if (!extension && fallbackExtension) {
    extension = fallbackExtension;
  }

  let baseName = baseNameRaw.replace(unsafeChars, "_").replace(/^_+/, "");
  if (!baseName) baseName = "file";
  if (baseName.length > 60) {
    baseName = baseName.slice(0, 60);
  }

  const sanitized = extension ? `${baseName}.${extension}` : baseName;
  return { sanitized, extension };
}

function matchesSignature(header: Buffer, signature: MagicSignature) {
  const offset = signature.offset ?? 0;
  if (header.length < signature.bytes.length + offset) {
    return false;
  }

  const slice = header.subarray(offset, offset + signature.bytes.length);
  if (!slice.equals(signature.bytes)) {
    return false;
  }

  if (signature.extraCheck) {
    return signature.extraCheck(header);
  }
  return true;
}

export async function validateFileAgainstPolicy(file: File, policy: UploadPolicy) {
  if (file.size > policy.maxSizeBytes) {
    throw new FileValidationError(
      `${policy.label} exceeds the maximum allowed size (${Math.round(policy.maxSizeBytes / (1024 * 1024))}MB).`
    );
  }

  const { sanitized, extension } = sanitizeFileName(file.name, policy.allowedExtensions[0]);

  if (!extension || !policy.allowedExtensions.includes(extension)) {
    throw new FileValidationError(`${policy.label} must be one of: ${policy.allowedExtensions.join(", ")}.`);
  }

  if (file.type && !policy.allowedMimeTypes.includes(file.type)) {
    throw new FileValidationError(`${policy.label} MIME type ${file.type} is not permitted.`);
  }

  const headerLength = Math.max(
    16,
    ...policy.signatures.map((sig) => (sig.offset ?? 0) + sig.bytes.length)
  );
  const header = Buffer.from(await file.slice(0, headerLength).arrayBuffer());

  const signatureValid = policy.signatures.some((sig) => matchesSignature(header, sig));
  if (!signatureValid) {
    throw new FileValidationError(`${policy.label} content does not match the expected file type.`);
  }

  return {
    sanitizedFileName: sanitized,
    extension,
  };
}

export function isSupportedDocumentType(docTypeId: number): boolean {
  return Object.prototype.hasOwnProperty.call(DOC_TYPE_POLICIES, docTypeId);
}

export function getPolicyForDocType(docTypeId: number): UploadPolicy {
  const policy = DOC_TYPE_POLICIES[docTypeId];
  if (!policy) {
    throw new FileValidationError("Unsupported document type.");
  }
  return policy;
}

export function getImageUploadPolicy(): UploadPolicy {
  return IMAGE_POLICY;
}
