// Derive a Whisper-friendly file extension from a MediaRecorder MIME type.
//
// Whisper detects audio format by filename extension (not Content-Type). iOS
// Safari's MediaRecorder produces audio/mp4, while Chromium/Firefox produce
// audio/webm — so naming every upload "rep.webm" misleads Whisper on iOS and
// transcription fails. This helper picks the right extension from the blob's
// .type.
//
// Reference: OpenAI Whisper accepts mp3, mp4, mpeg, mpga, m4a, wav, webm,
// flac, oga, ogg. The fallback is 'webm' (the dominant case on Chromium and
// Firefox, where MediaRecorder defaults to that container).

const MIME_TO_EXT = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/oga': 'oga',
  'audio/mp4': 'mp4',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
};

export function audioExtensionFromMime(mime) {
  if (!mime || typeof mime !== 'string') return 'webm';
  const base = mime.toLowerCase().split(';')[0].trim();
  return MIME_TO_EXT[base] ?? 'webm';
}

export function audioFilenameFromMime(mime, baseName = 'rep') {
  return `${baseName}.${audioExtensionFromMime(mime)}`;
}
