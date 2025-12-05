import Image from 'next/image';

export function AggregatorIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/aggregator-icon.png"
      alt="Aggregator icon"
      width={24}
      height={24}
      className={className}
    />
  );
}
