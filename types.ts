




export type Tab = 'product' | 'background' | 'vto' | 'fashion' | 'combine-text' | 'voice' | 'brand' | 'campaign';

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
  title:string;
  prompt: string;
  imageUrl?: string;
  isLoading: boolean;
  isUpscaling?: boolean;
  error?: string;
}

export interface SuggestedTheme {
  title: string;
  description: string;
}

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface BrandIdentity {
    logo: ImageData | null;
    primaryColor: string;
    secondaryColor: string;
    voice: string;
    primaryFont: string;
    secondaryFont: string;
    assets: ImageData[];
}

export type Platform = 'instagram_post' | 'instagram_story' | 'facebook_ad';

export interface CampaignAsset {
  platform: Platform;
  imageUrl?: string;
  caption: string;
  imagePrompt: string;
  isLoading: boolean;
  isUpscaling?: boolean;
  error?: string;
}
export type CampaignResult = Partial<Record<Platform, CampaignAsset>>;