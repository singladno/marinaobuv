import { buildKey, getExtensionFromMime, putBase64, putFromUrl } from './s3u';

export async function processMediaUpload(mediaInfo: { type: string; data?: string; mimeType?: string }): Promise<{
  mediaS3Key: string | null;
  mediaUrl: string | null;
}> {
  if (!mediaInfo.data) {
    return { mediaS3Key: null, mediaUrl: null };
  }

  try {
    const ext = mediaInfo.mimeType ? getExtensionFromMime(mediaInfo.mimeType) : 'bin';
    const key = buildKey(ext);

    let uploadResult;

    if (mediaInfo.data.startsWith('data:')) {
      // Base64 data
      uploadResult = await putBase64(key, mediaInfo.data, mediaInfo.mimeType || 'application/octet-stream');
    } else if (mediaInfo.data.startsWith('http')) {
      // URL data
      uploadResult = await putFromUrl(key, mediaInfo.data, mediaInfo.mimeType);
    } else {
      // Assume base64 without data URL prefix
      uploadResult = await putBase64(
        key,
        `data:${mediaInfo.mimeType || 'application/octet-stream'};base64,${mediaInfo.data}`,
        mediaInfo.mimeType || 'application/octet-stream'
      );
    }

    if (uploadResult.success && uploadResult.url) {
      console.log('Media uploaded to S3:', { key, url: uploadResult.url });
      return { mediaS3Key: key, mediaUrl: uploadResult.url };
    } else {
      console.error('Failed to upload media:', uploadResult.error);
      return { mediaS3Key: null, mediaUrl: null };
    }
  } catch (error) {
    console.error('Error uploading media:', error);
    return { mediaS3Key: null, mediaUrl: null };
  }
}
