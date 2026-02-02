import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";
import { forwardRef, useState } from "react";
import { SmartSkeleton } from "./SmartSkeleton";

const meta: Meta<typeof SmartSkeleton> = {
  title: "Components/SmartSkeleton",
  component: SmartSkeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SmartSkeleton>;

const ProductCard = forwardRef<
  HTMLDivElement,
  {
    title: string;
    price: number;
    description: string;
    className?: string;
    style?: CSSProperties;
  }
>(({ title, price, description, className, style }, ref) => {
  return (
    <div
      ref={ref}
      className={className}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        width: 280,
        ...style,
      }}
    >
      <img
        src="https://assets.vercel.com/image/upload/v1711040074/front/framework%20pages/Vercel_Next_OG.png"
        alt={title}
        style={{
          display: "block",
          width: "100%",
          height: 160,
          backgroundColor: "#f3f4f6",
          borderRadius: 4,
          marginBottom: 12,
        }}
      />
      <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{title}</h3>
      <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 14 }}>
        {description}
      </p>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>${price}</p>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

const mockProduct = {
  title: "Product Name",
  price: 99,
  description: "This is a product description",
};

export const Loading: Story = {
  render: () => (
    <SmartSkeleton loading={true} element={<ProductCard {...mockProduct} />} />
  ),
};

export const Loaded: Story = {
  render: () => (
    <SmartSkeleton loading={false} element={<ProductCard {...mockProduct} />}>
      <ProductCard
        title="MacBook Pro 14"
        price={1999}
        description="Apple M3 Pro chip, 18GB RAM"
      />
    </SmartSkeleton>
  ),
};

export const NoAnimation: Story = {
  render: () => (
    <SmartSkeleton
      loading={true}
      element={<ProductCard {...mockProduct} />}
      animate={false}
    />
  ),
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [loading, setLoading] = useState(true);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          type="button"
          onClick={() => setLoading((l) => !l)}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "none",
            backgroundColor: "#3b82f6",
            color: "white",
            cursor: "pointer",
          }}
        >
          Toggle: {loading ? "Loading" : "Loaded"}
        </button>
        <SmartSkeleton
          loading={loading}
          element={<ProductCard {...mockProduct} />}
        >
          <ProductCard
            title="MacBook Pro 14"
            price={1999}
            description="Apple M3 Pro chip, 18GB RAM, 512GB SSD"
          />
        </SmartSkeleton>
      </div>
    );
  },
};
