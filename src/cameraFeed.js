/**
 * Streams the rear camera into a video element. On failure (desktop without
 * webcam, permission refused, non-HTTPS page) the video keeps its CSS
 * gradient background so the game stays playable.
 *
 * @param {HTMLVideoElement} video element displaying the feed
 * @returns {Promise<boolean>} true if the camera feed started
 */
export async function startCameraFeed(video) {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    return true;
  } catch (err) {
    console.warn('Camera unavailable:', err);
    return false;
  }
}
