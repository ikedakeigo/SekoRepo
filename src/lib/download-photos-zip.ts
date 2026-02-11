import JSZip from "jszip";

interface PhotoForZip {
  photoUrl: string;
  title: string;
}

export async function downloadPhotosAsZip(
  photos: PhotoForZip[],
  zipFileName: string,
) {
  const zip = new JSZip();

  let skipped = 0;

  const fetchPromises = photos.map(async (photo, index) => {
    const response = await fetch(photo.photoUrl);
    if (!response.ok) {
      console.error(`Failed to fetch: ${photo.photoUrl} (${response.status})`);
      skipped++;
      return;
    }
    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const safeName = photo.title.replace(/[/\\?%*:|"<>]/g, "_");
    zip.file(`${index + 1}_${safeName}.${ext}`, blob);
  });

  await Promise.all(fetchPromises);

  if (skipped > 0 && skipped === photos.length) {
    throw new Error("全ての写真の取得に失敗しました");
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
