'use client';

import { User, Users, Package, Calendar } from 'lucide-react';

import { genderRu, seasonRu } from '@/lib/format';

type Props = {
  material?: string | null;
  gender?: keyof typeof genderRu | null;
  season?: keyof typeof seasonRu | null;
  packPairs: number | null;
};

export function ProductFeatures({
  material,
  gender,
  season,
  packPairs,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ключевые особенности</h3>
      <div className="grid grid-cols-2 gap-4">
        {material && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Материал</p>
              <p className="text-sm font-medium">{material}</p>
            </div>
          </div>
        )}
        {gender && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
              {gender === 'female' ? (
                <User className="h-4 w-4 text-pink-600" />
              ) : (
                <Users className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Пол</p>
              <p className="text-sm font-medium">{genderRu[gender]}</p>
            </div>
          </div>
        )}
        {season && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Сезон</p>
              <p className="text-sm font-medium">{seasonRu[season]}</p>
            </div>
          </div>
        )}
        {packPairs != null && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Пар в коробке</p>
              <p className="text-sm font-medium">{packPairs}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
