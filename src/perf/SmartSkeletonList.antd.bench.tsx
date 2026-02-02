import { UserOutlined } from "@ant-design/icons";
import { Avatar, Card, Flex, Space, Tag, Typography } from "antd";
import { bench, describe } from "vitest";
import { SmartSkeletonList } from "../components/SmartSkeletonList/SmartSkeletonList";
import { renderWithProfiler } from "./renderWithProfiler";

type Member = {
  id: number;
  name: string;
  role: string;
  status: "online" | "away" | "offline";
};

const items: Member[] = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  name: `Member ${index + 1}`,
  role: "Product Ops",
  status: index % 3 === 0 ? "online" : index % 3 === 1 ? "away" : "offline",
}));

const heavyItems: Member[] = Array.from({ length: 200 }, (_, index) => ({
  id: index,
  name: `Member ${index + 1}`,
  role: "Product Ops",
  status: index % 3 === 0 ? "online" : index % 3 === 1 ? "away" : "offline",
}));

const ultraItems: Member[] = Array.from({ length: 1000 }, (_, index) => ({
  id: index,
  name: `Member ${index + 1}`,
  role: "Product Ops",
  status: index % 3 === 0 ? "online" : index % 3 === 1 ? "away" : "offline",
}));

const renderStatus = (status: Member["status"]) => {
  if (status === "online") return <Tag color="green">Online</Tag>;
  if (status === "away") return <Tag color="gold">Away</Tag>;
  return <Tag color="default">Offline</Tag>;
};

const renderItem = (item: Member) => (
  <Flex align="center" justify="space-between" gap={16}>
    <Space align="center" size={12}>
      <Avatar icon={<UserOutlined />} />
      <div>
        <Typography.Text>{item.name}</Typography.Text>
        <Typography.Text type="secondary">{item.role}</Typography.Text>
      </div>
    </Space>
    {renderStatus(item.status)}
  </Flex>
);

const renderSkeleton = (index: number) => (
  <Flex align="center" justify="space-between" gap={16}>
    <Space align="center" size={12}>
      <Avatar icon={<UserOutlined />} />
      <div>
        <Typography.Text>{`Loading ${index + 1}`}</Typography.Text>
        <Typography.Text type="secondary">Loading</Typography.Text>
      </div>
    </Space>
    <Tag color="default">Loading</Tag>
  </Flex>
);

describe("SmartSkeletonList (Ant Design)", () => {
  bench("mount loading list (antd)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:mount:antd",
      element: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={true}
              items={undefined}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              defaultCount={12}
              storageKey="bench-smart-skeleton-list-antd"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
    });
  });

  bench("update loading to items (antd)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:update:antd",
      element: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={true}
              items={undefined}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              defaultCount={12}
              storageKey="bench-smart-skeleton-list-antd"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
      update: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={false}
              items={items}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              storageKey="bench-smart-skeleton-list-antd"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
    });
  });

  bench("mount loading list (antd heavy)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:mount:antd:heavy",
      element: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={true}
              items={undefined}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              defaultCount={200}
              storageKey="bench-smart-skeleton-list-antd-heavy"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
    });
  });

  bench("update loading to items (antd heavy)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:update:antd:heavy",
      element: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={true}
              items={undefined}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              defaultCount={200}
              storageKey="bench-smart-skeleton-list-antd-heavy"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
      update: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={false}
              items={heavyItems}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              storageKey="bench-smart-skeleton-list-antd-heavy"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
    });
  });

  bench("mount loading list (antd ultra)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:mount:antd:ultra",
      element: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={true}
              items={undefined}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              defaultCount={1000}
              storageKey="bench-smart-skeleton-list-antd-ultra"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
    });
  });

  bench("update loading to items (antd ultra)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:update:antd:ultra",
      element: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={true}
              items={undefined}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              defaultCount={1000}
              storageKey="bench-smart-skeleton-list-antd-ultra"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
      update: (
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text strong>Team Activity</Typography.Text>
            <SmartSkeletonList
              loading={false}
              items={ultraItems}
              renderItem={renderItem}
              renderSkeleton={renderSkeleton}
              storageKey="bench-smart-skeleton-list-antd-ultra"
              keyExtractor={(item) => item.id}
            />
          </Space>
        </Card>
      ),
    });
  });
});
