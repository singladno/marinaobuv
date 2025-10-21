import { RowLoadingIndicator } from './GruzchikRowLoadingIndicator';

interface GruzchikRowWrapperProps {
  itemId: string;
  updatingItems: Set<string>;
  children: React.ReactNode;
}

export function GruzchikRowWrapper({
  itemId,
  updatingItems,
  children,
}: GruzchikRowWrapperProps) {
  const isUpdating = updatingItems.has(itemId);

  return (
    <div className="relative">
      {children}
      <RowLoadingIndicator isUpdating={isUpdating} />
    </div>
  );
}
