
export type Tab = 'product' | 'vto' | 'fashion' | 'combine-text';

export interface ImageData {
  base64: string;
  mimeType: string;
  name: string;
}

export interface GeneratedIdea {
  title: string;
  prompt: string;
}

export interface GeneratedImageResult {
  id: number;
  title: string;
  prompt: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}
