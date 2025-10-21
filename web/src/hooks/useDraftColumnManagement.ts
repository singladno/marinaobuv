import * as React from 'react';

export function useDraftColumnManagement(status?: string) {
  const [columnVisibility, setColumnVisibility] = React.useState({
    select: true,
    name: true,
    article: true,
    category: status === 'approved',
    provider: true,
    source: true,
    pricePairRub: true,
    packPairs: true,
    priceBoxRub: true,
    providerDiscountRub: true,
    material: true,
    description: true,
    gender: true,
    season: true,
    sizes: true,
    aiStatus: true,
    images: true,
    gptRequest: false,
    gptResponse: false,
    gptRequest2: false,
    gptResponse2: false,
    createdAt: false,
    updatedAt: false,
    actions: true,
  });

  const handleToggleColumn = React.useCallback(
    (columnId: string) => {
      setColumnVisibility(prev => {
        const newVisibility = {
          ...prev,
          [columnId]: !prev[columnId as keyof typeof prev],
        };

        // For approved status, always keep category visible
        if (status === 'approved' && columnId === 'category') {
          newVisibility.category = true;
        }

        return newVisibility;
      });
    },
    [status]
  );

  const handleResetColumns = React.useCallback(() => {
    // Reset to default visibility
    setColumnVisibility({
      select: true,
      name: true,
      article: true,
      category: status === 'approved',
      provider: true,
      source: true,
      pricePairRub: true,
      packPairs: true,
      priceBoxRub: true,
      providerDiscountRub: true,
      material: true,
      description: true,
      gender: true,
      season: true,
      sizes: true,
      aiStatus: true,
      images: true,
      gptRequest: false,
      gptResponse: false,
      gptRequest2: false,
      gptResponse2: false,
      createdAt: false,
      updatedAt: false,
      actions: true,
    });
  }, [status]);

  return {
    columnVisibility,
    setColumnVisibility,
    handleToggleColumn,
    handleResetColumns,
  };
}
