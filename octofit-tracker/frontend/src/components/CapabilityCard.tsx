import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T extends Record<string, unknown>> = {
  title: string;
  description: string;
  endpoint: string;
  itemsKey: string;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T extends Record<string, unknown>>({
  title,
  description,
  endpoint,
  itemsKey,
  emptyText,
  renderItem,
}: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setItems(null);
    setError('');

    getJson<Record<string, T[]>>(endpoint)
      .then((data) => {
        if (active) setItems(Array.isArray(data[itemsKey]) ? data[itemsKey] : []);
      })
      .catch((reason: unknown) => {
        if (active) {
          const message = reason instanceof Error ? reason.message : 'Unknown error';
          setError(`Unable to load ${title}: ${message}`);
        }
      });

    return () => {
      active = false;
    };
  }, [endpoint, itemsKey, title]);

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
