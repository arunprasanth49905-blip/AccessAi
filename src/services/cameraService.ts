// Camera Service - MediaDevices API & Realistic Camera Demo Simulation

export interface CameraState {
  isStreaming: boolean;
  hasPermission: boolean | null;
  errorMessage: string | null;
  isDemoMode: boolean;
}

class CameraService {
  private mediaStream: MediaStream | null = null;
  private currentFacingMode: 'user' | 'environment' = 'environment';

  async checkCameraSupport(): Promise<boolean> {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  getFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
  }

  setFacingMode(mode: 'user' | 'environment') {
    this.currentFacingMode = mode;
  }

  toggleFacingMode(): 'user' | 'environment' {
    this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
    return this.currentFacingMode;
  }

  async startCamera(
    videoElement: HTMLVideoElement,
    preferredFacingMode?: 'user' | 'environment'
  ): Promise<{ success: boolean; error?: string; facingMode?: 'user' | 'environment' }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { success: false, error: 'Camera API not supported in this browser' };
      }

      this.stopCamera();

      if (preferredFacingMode) {
        this.currentFacingMode = preferredFacingMode;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // Do not request microphone permission unnecessarily from the camera page
      });

      this.mediaStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();

      return { success: true, facingMode: this.currentFacingMode };
    } catch (err: unknown) {
      const error = err as Error;
      let errorMsg = 'Failed to access camera';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. You can upload a photo or use sample test scenes.';
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
