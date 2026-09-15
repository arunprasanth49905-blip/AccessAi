// Camera Service - MediaDevices API & Realistic Camera Demo Simulation

export interface CameraState {
  isStreaming: boolean;
  hasPermission: boolean | null;
  errorMessage: string | null;
  isDemoMode: boolean;
}

class CameraService {
  private mediaStream: MediaStream | null = null;

  async checkCameraSupport(): Promise<boolean> {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<{ success: boolean; error?: string }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { success: false, error: 'Camera API not supported in this browser' };
      }

      this.stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // Do not request microphone permission unnecessarily from the camera page
      });

      this.mediaStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();

      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      let errorMsg = 'Failed to access camera';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Demo Vision is ready.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera hardware found on this device.';
      }
      return { success: false, error: errorMsg };
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  isStreaming(): boolean {
    return !!(this.mediaStream && this.mediaStream.active);
  }

  // Capture video frame with resizing to target max dimension (e.g. 1280px) and JPEG compression
  captureOptimizedFrame(
    videoElement: HTMLVideoElement,
    maxDimension: number = 1280,
    quality: number = 0.82
  ): string | null {
    try {
      const sourceWidth = videoElement.videoWidth || 640;
      const sourceHeight = videoElement.videoHeight || 480;

      let targetWidth = sourceWidth;
      let targetHeight = sourceHeight;

      if (sourceWidth > maxDimension || sourceHeight > maxDimension) {
        if (sourceWidth >= sourceHeight) {
          targetWidth = maxDimension;
          targetHeight = Math.round((sourceHeight / sourceWidth) * maxDimension);
        } else {
          targetHeight = maxDimension;
          targetWidth = Math.round((sourceWidth / sourceHeight) * maxDimension);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL('image/jpeg', quality);
    } catch (err) {
      console.warn('Failed to capture snapshot:', err);
      return null;
    }
  }

  captureSnapshot(videoElement: HTMLVideoElement): string | null {
    return this.captureOptimizedFrame(videoElement, 1280, 0.82);
  }
}

export const cameraService = new CameraService();
