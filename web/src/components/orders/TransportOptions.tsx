interface TransportOptionsProps {
  transportOptions?: Array<{
    id: string;
    transportId: string;
    transportName: string;
    isSelected: boolean;
  }>;
}

export function TransportOptions({ transportOptions }: TransportOptionsProps) {
  if (!transportOptions || transportOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-900">
        Транспортные компании
      </h4>
      <div className="flex flex-wrap gap-2">
        {transportOptions.map(option => (
          <div
            key={option.id}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              option.isSelected
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {option.transportName}
          </div>
        ))}
      </div>
    </div>
  );
}
