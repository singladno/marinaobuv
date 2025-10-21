'use client';

import { Share, Heart } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFavorites } from '@/contexts/FavoritesContext';
import { genderRu, seasonRu } from '@/lib/format';

type Props = {
  name: string;
  article?: string | null;
  gender?: keyof typeof genderRu | null;
  season?: keyof typeof seasonRu | null;
  slug: string;
};

export function ProductHeader({ name, article, gender, season, slug }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isSharing, setIsSharing] = useState(false);

  const isWishlisted = isFavorite(slug);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      setIsSharing(true);
      await navigator.clipboard.writeText(window.location.href);
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{name}</h1>
          {article && (
            <p className="text-muted-foreground text-sm">Артикул: {article}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="p-2"
            title={isSharing ? 'Скопировано!' : 'Поделиться'}
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(slug)}
            className={`p-2 ${isWishlisted ? 'text-red-500' : ''}`}
            title={isWishlisted ? 'В избранном' : 'В избранное'}
          >
            <Heart
              className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`}
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {gender && <Badge variant="secondary">{genderRu[gender]}</Badge>}
        {season && <Badge variant="outline">{seasonRu[season]}</Badge>}
      </div>
    </div>
  );
}
