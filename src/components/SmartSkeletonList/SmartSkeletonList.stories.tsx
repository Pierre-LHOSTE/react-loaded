import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SmartSkeletonList } from "./SmartSkeletonList";

const meta: Meta<typeof SmartSkeletonList> = {
  title: "Components/SmartSkeletonList",
  component: SmartSkeletonList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SmartSkeletonList>;

interface Product {
  id: number;
  title: string;
  price: number;
}

function ProductRow({ title, price }: { title: string; price: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div>
        <span style={{ fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: 14, color: "#6b7280" }}>In stock</span>
      </div>
      <div style={{ fontWeight: 600 }}>${price}</div>
    </div>
  );
}

const mockProducts: Product[] = [
  { id: 1, title: "MacBook Pro 14", price: 1999 },
  { id: 2, title: "iPhone 15 Pro", price: 999 },
  { id: 3, title: "AirPods Pro", price: 249 },
  { id: 4, title: "iPad Air", price: 599 },
  { id: 5, title: "Apple Watch Ultra", price: 799 },
];

export const Loading: Story = {
  render: () => (
    <div style={{ width: 400, border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <SmartSkeletonList
        loading={true}
        items={undefined}
        defaultCount={3}
        renderItem={(product: Product) => (
          <ProductRow title={product.title} price={product.price} />
        )}
        renderSkeleton={() => <ProductRow title="Loading..." price={0} />}
      />
    </div>
  ),
};

export const Loaded: Story = {
  render: () => (
    <div style={{ width: 400, border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <SmartSkeletonList
        loading={false}
        items={mockProducts}
        renderItem={(product: Product) => (
          <ProductRow title={product.title} price={product.price} />
        )}
        renderSkeleton={() => <ProductRow title="Loading..." price={0} />}
        keyExtractor={(product) => product.id}
      />
    </div>
  ),
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Product[] | undefined>(undefined);

    const handleLoad = () => {
      setLoading(true);
      setItems(undefined);
      setTimeout(() => {
        setItems(mockProducts);
        setLoading(false);
      }, 1500);
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          type="button"
          onClick={handleLoad}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "none",
            backgroundColor: "#3b82f6",
            color: "white",
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          {loading ? "Loading..." : "Reload Data"}
        </button>
        <div
          style={{ width: 400, border: "1px solid #e5e7eb", borderRadius: 8 }}
        >
          <SmartSkeletonList
            loading={loading}
            items={items}
            defaultCount={3}
            storageKey="demo-products"
            renderItem={(product: Product) => (
              <ProductRow title={product.title} price={product.price} />
            )}
            renderSkeleton={() => <ProductRow title="Loading..." price={0} />}
            keyExtractor={(product) => product.id}
          />
        </div>
        <p style={{ fontSize: 12, color: "#6b7280" }}>
          storageKey=&quot;demo-products&quot; — Le nombre de skeletons sera
          persisté après le premier chargement.
        </p>
      </div>
    );
  },
};

export const EmptyList: Story = {
  render: () => (
    <div style={{ width: 400, border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <SmartSkeletonList
        loading={false}
        items={[]}
        renderItem={(product: Product) => (
          <ProductRow title={product.title} price={product.price} />
        )}
        renderSkeleton={() => <ProductRow title="Loading..." price={0} />}
      />
      <p style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
        Liste vide — aucun skeleton, aucun item
      </p>
    </div>
  ),
};
