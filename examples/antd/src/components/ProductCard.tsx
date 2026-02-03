import { Button, Card, Rate, Space, Typography } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import type { Ref } from "react";

const { Text } = Typography;

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  ref?: Ref<HTMLDivElement>;
}

export function ProductCard(
  { product, ref }: ProductCardProps,
) {
  return (

      <Card style={{ width: 260 }} hoverable ref={ref}>
        <Space orientation="vertical" size={4} style={{ width: "100%" }}>
          <Text strong>{product.name}</Text>
          <Space>
            <Rate
              allowHalf
              disabled
              defaultValue={product.rating}
              style={{ fontSize: 14 }}
            />
            <Text type="secondary">{product.rating}</Text>
          </Space>
          <Space align="baseline">
            <Text strong>${product.price}</Text>
            <Text type="secondary">In stock: {product.stock}</Text>
          </Space>
          <Button type="primary" size="small" icon={<ShoppingCartOutlined />}>
            Add
          </Button>
        </Space>
      </Card>

  );
}

ProductCard.displayName = "ProductCard";
