import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import type { GeneratedIdea, SuggestedTheme, BrandIdentity, Platform } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64,
            mimeType
        },
    };
};

const extractImageData = (response: GenerateContentResponse): string => {
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
        return imagePart.inlineData.data;
    }
    
    let errorMessage = "No image data in response. The model did not generate an image.";
    if (candidate?.finishReason === 'SAFETY') {
        errorMessage = "Image generation was blocked due to safety settings. Please adjust your prompt or image.";
    } else if (candidate?.finishReason) {
        errorMessage = `Image generation failed. Reason: ${candidate.finishReason}.`;
    }

    // This log is for developer debugging and won't be visible to the end user, but it's good practice.
    console.error("Image generation failed. Full response:", JSON.stringify(response, null, 2));
    throw new Error(errorMessage);
};

const applyBrandIdentityToPrompt = (basePrompt: string, brandIdentity: BrandIdentity | null): string => {
    if (!brandIdentity) return basePrompt;

    const brandInstructions: string[] = [];

    if (brandIdentity.voice?.trim()) {
        brandInstructions.push(`The brand's voice is '${brandIdentity.voice}'.`);
    }
    if (brandIdentity.primaryColor && brandIdentity.secondaryColor) {
        brandInstructions.push(`Subtly use brand colors (primary: ${brandIdentity.primaryColor}, secondary: ${brandIdentity.secondaryColor}) in the scene's composition, lighting, or background elements.`);
    }
    if (brandIdentity.primaryFont?.trim() && brandIdentity.secondaryFont?.trim()) {
        brandInstructions.push(`For any text, use a bold, impactful font visually similar to '${brandIdentity.primaryFont}' for headlines, and a clean, legible font visually similar to '${brandIdentity.secondaryFont}' for body text.`);
    } else if (brandIdentity.primaryFont?.trim()) {
        brandInstructions.push(`For any text, use a font visually similar to '${brandIdentity.primaryFont}'.`);
    }

    if (brandInstructions.length > 0) {
        return `${basePrompt}\n\nAdhere to the brand's identity: ${brandInstructions.join(' ')}`;
    }
    
    return basePrompt;
}

export const generateProductDescription = async (productImage: { base64: string; mimeType: string }): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Buatkan deskripsi produk untuk gambar ini." },
                fileToGenerativePart(productImage.base64, productImage.mimeType)
            ]
        },
        config: {
            systemInstruction: "You are a professional copywriter. Analyze the product in the image and write a concise, compelling, and SEO-friendly product description in Indonesian. Highlight its key features and potential benefits for customers. Keep it under 500 characters."
        }
    });
    return response.text.trim();
};

export const generateAdHeadline = async (adImage: { base64: string; mimeType: string }, description: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: `Buatkan satu headline menarik untuk produk ini. Deskripsi: "${description}"` },
                fileToGenerativePart(adImage.base64, adImage.mimeType)
            ]
        },
        config: {
            systemInstruction: "You are a master copywriter specializing in short, high-impact headlines. Based on the product image and description, generate one catchy headline (hook) in Indonesian. It must be very short (max 5 words) and attention-grabbing."
        }
    });
    return response.text.trim().replace(/["*]/g, '');
};

export const generateProductPoses = async (
    productImage: { base64: string; mimeType: string },
    description: string,
    modelImage: { base64: string; mimeType: string } | null,
    theme: string,
    brandIdentity: BrandIdentity | null
): Promise<GeneratedIdea[]> => {
    const ai = getAiClient();
    let userQuery = `Analyze this product. Product Description: "${description}"`;
    if (theme) {
        userQuery += `\nPhoto Theme: "${theme}"`;
    }
    userQuery = applyBrandIdentityToPrompt(userQuery, brandIdentity);

    const parts = [
        { text: userQuery },
        fileToGenerativePart(productImage.base64, productImage.mimeType)
    ];
    if (modelImage) {
        parts.push(fileToGenerativePart(modelImage.base64, modelImage.mimeType));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction: "You are a professional product photographer's AI assistant. Your task is to analyze a product, description, and optionally a model's photo, theme, and brand identity. You MUST strictly adhere to the user's theme and brand identity if provided. Generate 6 distinct, creative, and professional 'poses' or 'shots'. If a model's photo is provided, you MUST incorporate the model naturally interacting with or presenting the product. For each shot, provide a short, descriptive title (in Indonesian) and a detailed prompt for an AI image generator. The prompt must be in English and designed to create a high-quality, realistic, elegant, and cinematic product photo. Emphasize dramatic lighting, soft focus, sophisticated composition, and a high-end commercial aesthetic. Respond ONLY with a valid JSON array of 6 objects.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        "title": { "type": Type.STRING },
                        "prompt": { "type": Type.STRING }
                    },
                    required: ["title", "prompt"]
                }
            }
        }
    });
    
    return JSON.parse(response.text);
};


export const generateImageFromPrompt = async (
    prompt: string,
    baseImage: { base64: string; mimeType: string },
    modelImage: { base64: string; mimeType: string } | null
): Promise<string> => {
    const ai = getAiClient();
    const finalPrompt = `${prompt}, elegant, cinematic, professional product photography, dramatic lighting, 8k, photorealistic`;
    const parts = [
        { text: finalPrompt },
        fileToGenerativePart(baseImage.base64, baseImage.mimeType)
    ];
    if (modelImage) {
        parts.push(fileToGenerativePart(modelImage.base64, modelImage.mimeType));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });
    
    return extractImageData(response);
};

export const upscaleImage = async (
    imageToUpscale: { base64: string; mimeType: string },
    originalPrompt: string
): Promise<string> => {
    const ai = getAiClient();
    const upscalePrompt = `Re-render this image with significantly higher detail and quality. Focus on photorealism, sharp focus, and intricate textures to achieve a cinematic, 8k quality result. Do not change the composition or subject. Original creation prompt for context: "${originalPrompt}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: upscalePrompt },
                fileToGenerativePart(imageToUpscale.base64, imageToUpscale.mimeType)
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    return extractImageData(response);
};


export const generateSocialCaption = async (
    imageUrl: string,
    description: string,
    theme: string,
    brandIdentity: BrandIdentity | null
): Promise<string> => {
    const ai = getAiClient();
    const [header, base64Data] = imageUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    
    let prompt = `Product Description: "${description}"\nPhoto Theme: "${theme}"`;
    
    let systemInstruction = "You are a creative social media manager. Based on the product photo, description, and theme, write an engaging Instagram caption in Indonesian. It should be appealing, concise, and end with 3-5 relevant hashtags.";
    
    if (brandIdentity?.voice) {
        systemInstruction = `You are a creative social media manager embodying the brand voice of '${brandIdentity.voice}'. Based on the product photo, description, and theme, write an engaging Instagram caption in Indonesian that reflects this voice. It should be appealing, concise, and end with 3-5 relevant hashtags.`
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                fileToGenerativePart(base64Data, mimeType)
            ]
        },
        config: {
            systemInstruction
        }
    });

    return response.text.trim();
};

export const generateVideoFromImage = async (
    imageUrl: string,
    description: string,
    theme: string
): Promise<string> => {
    // Stage 1: Generate a video prompt first for better control
    let ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const [header, base64Data] = imageUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    const promptResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: `Product Description: "${description}"\nPhoto Theme: "${theme}"` },
                fileToGenerativePart(base64Data, mimeType)
            ]
        },
        config: {
            systemInstruction: "You are an AI video generation expert. Analyze the provided image, its theme, and the product description. Your task is to generate a concise image-to-video prompt in English. The prompt must strictly follow the formula: \"subject + what it's doing (action) + background + camera movement\". Infer the most logical and visually appealing motion from the static image for the 'action' part. Then, add a suitable 'camera movement' to make the shot more cinematic (e.g., 'slow zoom in', 'panning from left to right', 'dolly shot forward'). Be creative and focus on creating a dynamic, cinematic shot. Respond ONLY with the prompt text."
        }
    });
    const videoPrompt = promptResponse.text.trim();

    // Stage 2: Generate the video using the created prompt
    // Re-initialize client just before the call to ensure the latest key is used.
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        image: {
            imageBytes: base64Data,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '1:1'
        }
    });

    // Polling for completion
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed, no download link found.");
    }
    
    // The API key must be appended to the download link
    const fullUrl = `${downloadLink}&key=${process.env.API_KEY}`;
    
    // Fetch the video to create a blob URL, which is more secure and doesn't expose the API key in the video element's src.
    const response = await fetch(fullUrl);
    if (!response.ok) {
        throw new Error("Failed to fetch the generated video.");
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateVirtualTryOn = async (
    productImage: { base64: string; mimeType: string },
    modelImage: { base64: string; mimeType: string }
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Dengan menggunakan foto produk dan foto model yang tersedia, buatlah sebuah gambar fotorealistis baru di mana model tersebut sedang mengenakan atau menggunakan produk tersebut. Pastikan hasilnya berkualitas tinggi dan terlihat seperti sesi pemotretan profesional. Pertahankan penampilan model dan detail produk.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
                fileToGenerativePart(productImage.base64, productImage.mimeType),
                fileToGenerativePart(modelImage.base64, modelImage.mimeType)
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });
    
    return extractImageData(response);
};

export const generateFashionPose = async (
    modelImage: { base64: string; mimeType: string },
    poseDescription: string
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Berdasarkan gambar model yang disediakan, hasilkan gambar baru dengan model yang melakukan pose fesyen sesuai deskripsi berikut: '${poseDescription}'. Jangan mengubah pakaian, latar belakang, atau properti apa pun. Hanya ubah pose model.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
                fileToGenerativePart(modelImage.base64, modelImage.mimeType)
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    return extractImageData(response);
};


export const getAdVariations = async (
    adImage: { base64: string; mimeType: string },
    headline: string,
    description: string,
    theme: string,
    brandIdentity: BrandIdentity | null
): Promise<GeneratedIdea[]> => {
    const ai = getAiClient();
    let userQuery = `Headline: "${headline}"\nDescription: "${description}"`;
    if (theme) {
        userQuery += `\nAd Theme: "${theme}"`;
    }
    userQuery = applyBrandIdentityToPrompt(userQuery, brandIdentity);

    const parts = [
        { text: userQuery },
        fileToGenerativePart(adImage.base64, adImage.mimeType)
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction: "You are an expert AI graphic designer for social media ads. Analyze the product image, headline, description, optional theme, and brand identity. Generate 6 distinct ad variations. For each, provide a JSON object with a 'title' (short name in Indonesian) and a 'prompt' (detailed English prompt for an image generation AI). The prompt MUST instruct the AI to place the provided headline and a key phrase from the description onto the original image in a specific, visually appealing way. Describe text placement (e.g., 'top-center', 'bottom-left'), font style (e.g., 'bold sans-serif', 'elegant script'), color scheme, and any subtle background enhancements (e.g., 'add a soft glow'). Ensure text is legible and complements the image and the brand identity. The original product in the image must not be altered. Respond ONLY with a valid JSON array of 6 objects.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        "title": { "type": Type.STRING },
                        "prompt": { "type": Type.STRING }
                    },
                    required: ["title", "prompt"]
                }
            }
        }
    });

    return JSON.parse(response.text);
};

export const generateAdImageWithText = async (
    baseImage: { base64: string; mimeType: string },
    prompt: string,
    headline: string,
    description: string
): Promise<string> => {
    const ai = getAiClient();
    const finalPrompt = `${prompt}. The headline text to add is: "${headline}". A key phrase from the description to add is: "${description}". Ensure the text is clearly visible and beautifully integrated.`;
    const parts = [
        { text: finalPrompt },
        fileToGenerativePart(baseImage.base64, baseImage.mimeType)
    ];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    return extractImageData(response);
};

export const changeImageBackground = async (
    productImage: { base64: string; mimeType: string },
    backgroundPrompt: string
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `Carefully analyze the provided image to identify the main subject. Do not change the subject. Replace the original background with a new one based on this description: '${backgroundPrompt}'. The final image should be photorealistic and seamlessly blended.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
                fileToGenerativePart(productImage.base64, productImage.mimeType)
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    return extractImageData(response);
};

export const suggestThemes = async (productCategory: string): Promise<SuggestedTheme[]> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on current visual trends for e-commerce, suggest 5 creative and distinct photography themes for the product category: "${productCategory}".`,
        config: {
            tools: [{googleSearch: {}}],
            systemInstruction: "You are an expert creative director and market trend analyst. Based on real-time search trends, generate 5 distinct, trending, and visually appealing photo themes for the given product category. For each theme, provide a short, catchy title and a one-sentence description of the aesthetic. Respond ONLY with a valid JSON array of objects, where each object has a \"title\" (string) and a \"description\" (string) key. All text should be in English.",
        }
    });

    let jsonString = response.text.trim();
    const startIndex = jsonString.indexOf('[');
    const endIndex = jsonString.lastIndexOf(']');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonString = jsonString.substring(startIndex, endIndex + 1);
    }

    return JSON.parse(jsonString);
};

export const generateAdScript = async (description: string, usp: string, quantity: number, brandIdentity: BrandIdentity | null): Promise<string> => {
    const ai = getAiClient();
    
    const brandVoiceInstruction = brandIdentity?.voice ? `Anda adalah seorang copywriter iklan profesional yang harus menjiwai suara brand: "${brandIdentity.voice}".` : "Anda adalah seorang copywriter iklan profesional.";
    
    const prompt = `${brandVoiceInstruction} Buat ${quantity} variasi naskah voice over singkat yang unik untuk iklan digital berdasarkan informasi berikut.
    Deskripsi Produk: "${description}"
    Unique Selling Point (USP): "${usp}"
    Setiap naskah HARUS mengikuti struktur dan durasi berikut dengan ketat:
    1. Hook (2-3 detik pertama): Kalimat pembuka yang menarik perhatian.
    2. Manfaat (8-9 detik berikutnya): Jelaskan manfaat utama produk berdasarkan deskripsi dan USP.
    3. CTA (2-3 detik terakhir): Ajakan bertindak yang jelas dan singkat.
    Pastikan total durasi setiap naskah sekitar 12-15 detik.
    Hanya berikan teks naskahnya saja, tanpa judul atau label seperti "Hook:", "Manfaat:", atau "CTA:".
    ${quantity > 1 ? 'Pisahkan setiap naskah yang berbeda dengan dua kali ganti baris (enter).' : ''}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text.trim();
};

export const generateSpeech = async (
    text: string, 
    voice: string, 
    options: { stylePrompt: string }
): Promise<string> => {
    const ai = getAiClient();
    const fullText = options.stylePrompt ? `${options.stylePrompt}${text}` : text;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: fullText }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from API.");
    }
    return base64Audio;
};

export const generateCampaignBrief = async (
    productImage: { base64: string; mimeType: string },
    description: string,
    platforms: Platform[],
    brandIdentity: BrandIdentity | null
): Promise<{ platform: Platform; imagePrompt: string; caption: string; }[]> => {
    const ai = getAiClient();
    let userQuery = `Product Description: "${description}"\nTarget Platforms: ${platforms.join(', ')}`;
    userQuery = applyBrandIdentityToPrompt(userQuery, brandIdentity);

    const platformDetails: { [key in Platform]: string } = {
        instagram_post: "Instagram Post (square 1:1 aspect ratio, visually striking, engaging)",
        instagram_story: "Instagram Story (vertical 9:16 aspect ratio, immersive, often with space for text overlays)",
        facebook_ad: "Facebook Ad (landscape 1.91:1 aspect ratio, clear call-to-action, optimized for feed scrolling)"
    };

    const requestedPlatforms = platforms.map(p => platformDetails[p]).join(', ');

    const systemInstruction = `You are a world-class AI creative director for a digital marketing agency.
Your task is to analyze a product image and description to create a complete social media campaign brief.
For EACH of the requested platforms (${requestedPlatforms}), you must generate:
1.  **A detailed Image Prompt (in English)** for an AI image generator. The prompt MUST specify the exact composition, style, and aspect ratio required for that specific platform. The goal is a photorealistic, high-end commercial photo that incorporates the original product seamlessly.
2.  **An engaging Caption (in Indonesian)** tailored to the audience and style of that platform. The caption must be compelling and include relevant hashtags. It must adhere to the brand's voice if provided.

You MUST respond ONLY with a valid JSON array. Each object in the array represents a platform and MUST contain "platform", "imagePrompt", and "caption" keys.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: userQuery },
                fileToGenerativePart(productImage.base64, productImage.mimeType)
            ]
        },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        "platform": { "type": Type.STRING, "enum": platforms },
                        "imagePrompt": { "type": Type.STRING },
                        "caption": { "type": Type.STRING }
                    },
                    required: ["platform", "imagePrompt", "caption"]
                }
            }
        }
    });

    return JSON.parse(response.text);
};