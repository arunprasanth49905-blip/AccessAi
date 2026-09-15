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
        audio: false,
      });

      this.mediaStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();

      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      let errorMsg = 'Failed to access camera';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Switching to Demo Mode.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
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

  captureSnapshot(videoElement: HTMLVideoElement): string | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      console.warn('Failed to capture snapshot:', err);
      return null;
    }
  }
}

export const cameraService = new CameraService();
