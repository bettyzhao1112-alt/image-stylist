
export interface GeneratedImage {
  id: string;
  url: string;
  style: string;
  isLoading: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR'
}

export const STYLES = [
  { name: 'Cyberpunk', prompt: 'Transform this image into a cyberpunk neon-lit digital art style with futuristic vibes.' },
  { name: 'Oil Painting', prompt: 'Recreate this image as a classic Renaissance oil painting with rich textures.' },
  { name: 'Pencil Sketch', prompt: 'Convert this image into a detailed hand-drawn charcoal pencil sketch.' },
  { name: 'Studio Ghibli', prompt: 'Reimagine this image in a whimsical Studio Ghibli anime aesthetic with lush backgrounds.' },
  { name: '3D Render', prompt: 'Convert this image into a high-quality 3D claymation render with soft lighting.' }
];
