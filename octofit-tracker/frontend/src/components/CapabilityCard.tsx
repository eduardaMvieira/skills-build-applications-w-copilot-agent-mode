import type { ReactNode } from 'react';

type Props<T extends Record<string, unknown>> = {
  title: string;
  description: string;
  items: T[] | null;
  error: string;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T extends Record<string, unknown>>({
  title,
  description,
  items,
  error,
  emptyText,
  renderItem,
}: Props<T>) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? (
          <p className="alert alert-danger mb-0" role="alert">{error}</p>
        ) : items === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p>{emptyText}</p>
        ) : (
          <ul className="mb-0">
            {items.map((item, index) => (
              <li key={index}>{renderItem(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
