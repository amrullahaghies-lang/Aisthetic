import React from 'react';
import { 
    Image, ShoppingBag, Sparkles, Type, UploadCloud, Download, CloudUpload, ImagePlus, User, Box, Wand, Edit, Copy, Video, PenSquare, X, ChevronDown, Layers, Lightbulb, CheckCircle2, AlertTriangle, Info, Moon, Sun, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

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
    chevronDown: ChevronDown,
    layers: Layers,
    lightbulb: Lightbulb,
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
    moon: Moon,
    sun: Sun,
    panelLeftClose: PanelLeftClose,
    panelLeftOpen: PanelLeftOpen,
};

export type IconName = keyof typeof iconMap;

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
    size?: string | number;
}

export const Icon: React.FC<IconProps> = ({ name, className, ...props }) => {
    const LucideIcon = iconMap[name];
    if (!LucideIcon) return null;
    return <LucideIcon className={className} {...props} />;
};