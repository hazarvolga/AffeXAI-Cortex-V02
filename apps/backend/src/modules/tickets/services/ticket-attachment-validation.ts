import { BadRequestException } from "@nestjs/common";
import { extname } from "node:path";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const types: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  doc: "application/msword",
  xls: "application/vnd.ms-excel",
  ppt: "application/vnd.ms-powerpoint",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
function officeZip(buffer: Buffer, directory: string): boolean {
  // Inspect bounded central-directory names without extracting or decompressing.
  let end = -1;
  for (
    let i = buffer.length - 22;
    i >= Math.max(0, buffer.length - 65557);
    i--
  ) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (
    end < 0 ||
    buffer.readUInt16LE(end + 4) !== 0 ||
    buffer.readUInt16LE(end + 6) !== 0
  )
    return false;
  const count = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16);
  if (count < 2 || count > 2048 || cursor >= end) return false;
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > end || buffer.readUInt32LE(cursor) !== 0x02014b50)
      return false;
    const length = buffer.readUInt16LE(cursor + 28),
      extra = buffer.readUInt16LE(cursor + 30),
      comment = buffer.readUInt16LE(cursor + 32);
    const next = cursor + 46 + length + extra + comment;
    if (next > end) return false;
    names.add(
      buffer.subarray(cursor + 46, cursor + 46 + length).toString("utf8"),
    );
    cursor = next;
  }
  return (
    names.has("[Content_Types].xml") &&
    [...names].some((name) => name.startsWith(`${directory}/`))
  );
}
export function validateTicketAttachment(file: Express.Multer.File): {
  name: string;
  mime: string;
} {
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    !file.buffer.length ||
    file.buffer.length > MAX_ATTACHMENT_BYTES ||
    file.size !== file.buffer.length
  )
    throw new BadRequestException("Attachment must contain at most 10 MiB");
  const name = file.originalname;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 255 ||
    /[\x00-\x1f\x7f/\\]/.test(name)
  )
    throw new BadRequestException("Invalid attachment filename");
  const ext = extname(name).slice(1).toLowerCase(),
    mime = types[ext],
    b = file.buffer;
  if (
    !mime ||
    (file.mimetype !== mime &&
      file.mimetype !== "application/octet-stream" &&
      !(ext === "md" && file.mimetype === "text/plain"))
  )
    throw new BadRequestException("Unsupported attachment type");
  const starts = (hex: string) =>
    b.subarray(0, hex.length / 2).equals(Buffer.from(hex, "hex"));
  let valid = false;
  switch (ext) {
    case "jpg":
    case "jpeg":
      valid = starts("ffd8ff");
      break;
    case "png":
      valid = starts("89504e470d0a1a0a");
      break;
    case "gif":
      valid = ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("ascii"));
      break;
    case "webp":
      valid =
        b.subarray(0, 4).toString() === "RIFF" &&
        b.subarray(8, 12).toString() === "WEBP";
      break;
    case "pdf":
      valid = b.subarray(0, 5).toString() === "%PDF-";
      break;
    case "docx":
    case "xlsx":
    case "pptx":
      valid =
        starts("504b0304") &&
        officeZip(b, { docx: "word", xlsx: "xl", pptx: "ppt" }[ext]);
      break;
    case "doc":
    case "xls":
    case "ppt": {
      const streams = {
        doc: "WordDocument",
        xls: "Workbook",
        ppt: "PowerPoint Document",
      };
      valid =
        starts("d0cf11e0a1b11ae1") &&
        b.includes(Buffer.from(streams[ext], "utf16le"));
      break;
    }
    default:
      valid =
        !b.includes(0) && Buffer.from(b.toString("utf8"), "utf8").equals(b);
  }
  if (!valid)
    throw new BadRequestException(
      "Attachment content does not match its extension",
    );
  return { name, mime };
}
