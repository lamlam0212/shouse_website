export function publicImageUrl(path: string) {
  return `/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function mapSignedUrls(
  paths: string[],
  data: { signedUrl?: string | null }[] | null,
) {
  const urls = new Map<string, string>();
  data?.forEach((item, index) => {
    if (item.signedUrl) urls.set(paths[index], item.signedUrl);
  });
  return urls;
}
