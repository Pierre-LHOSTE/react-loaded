import { Flex, List, Progress, Space, Tag, Typography } from "antd";

const { Text } = Typography;

export interface InventoryEntry {
  id: string;
  name: string;
  stock: number;
  threshold: number;
}

interface InventoryItemProps {
  item: InventoryEntry;
}

export function InventoryItem({ item }: InventoryItemProps) {
  const percent = Math.round((item.stock / (item.threshold * 2)) * 100);
  const isLow = item.stock <= item.threshold;

  return (
    <List.Item>
      <Space orientation="vertical" style={{ width: "100%" }}>
        <Flex justify="space-between">
          <Text strong>{item.name}</Text>
          <Tag color={isLow ? "red" : "green"}>{isLow ? "Low" : "Healthy"}</Tag>
        </Flex>
        <Progress
          percent={percent}
          size="small"
          status={isLow ? "exception" : "normal"}
        />
      </Space>
    </List.Item>
  );
}
