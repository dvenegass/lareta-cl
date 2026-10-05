// Imágenes que suben los usuarios (chat y álbum de las juntas).

/** Deben coincidir con MAX_IMAGE_MB y ALLOWED_IMAGE_TYPES en backend/apps/common/images.py. */
export const MAX_IMAGE_MB = 8;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Revisa la imagen antes de subirla; devuelve el error o null si está bien. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Usa una imagen JPG, PNG, GIF o WebP.";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `«${file.name}» pesa más de ${MAX_IMAGE_MB} MB.`;
  return null;
}
