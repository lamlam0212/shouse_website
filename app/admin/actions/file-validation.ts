const imageTypes: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

async function fileHasValidSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (file.type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.type === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (file.type === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  if (file.type === "application/pdf") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "%PDF";
  }
  return false;
}

export async function validateImage(file: File, maxSizeMb = 5) {
  if (!imageTypes[file.type]) return "Ảnh phải là JPG, PNG hoặc WebP.";
  if (file.size > maxSizeMb * 1024 * 1024) return `Ảnh tối đa ${maxSizeMb} MB.`;

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!imageTypes[file.type].includes(extension)) {
    return "Phần mở rộng ảnh không khớp định dạng.";
  }
  if (!(await fileHasValidSignature(file))) {
    return "Nội dung ảnh không đúng định dạng.";
  }
  return null;
}

export async function validatePdf(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.type !== "application/pdf" || extension !== "pdf") {
    return "Tài liệu phải là file PDF.";
  }
  if (file.size > 10 * 1024 * 1024) return "PDF tối đa 10 MB.";
  if (!(await fileHasValidSignature(file))) return "Nội dung PDF không hợp lệ.";
  return null;
}

export function storageExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "pdf";
}
