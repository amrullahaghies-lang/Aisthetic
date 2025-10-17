
import React from 'react';
import { Image, ShoppingBag, Sparkles, Type, UploadCloud, Download, CloudUpload, ImagePlus, User, Box, Wand, Edit, Copy, Video, PenSquare, X } from 'lucide-react';

const iconMap = {
    image: Image,
    shoppingBag: ShoppingBag,
    sparkles: Sparkles,
    type: Type,
    uploadCloud: UploadCloud,
    download: Download,
    cloudUpload: CloudUpload,
    imagePlus: ImagePlus,
    user: User,
    box: Box,
    wand: Wand,
    edit: Edit,
    copy: Copy,
    video: Video,
    penSquare: PenSquare,
    x: X,
};

// FIX: Export IconName type
export type IconName = keyof typeof iconMap;

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
}

export const Icon: React.FC<IconProps> = ({ name, className, ...props }) => {
    const LucideIcon = iconMap[name];
    if (!LucideIcon) return null;
    return <LucideIcon className={className} {...props} />;
};