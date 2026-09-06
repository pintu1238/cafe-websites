import { useState, type ReactNode } from 'react';

type ProfileAvatarProps = {
  imageUrl?: string | null;
  className: string;
  fallback: ReactNode;
};

export function ProfileAvatar({ imageUrl, className, fallback }: ProfileAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl && imageUrl !== failedImageUrl);

  return (
    <span className={className}>
      {showImage && imageUrl ? <img src={imageUrl} alt="" onError={() => setFailedImageUrl(imageUrl)} /> : fallback}
    </span>
  );
}
