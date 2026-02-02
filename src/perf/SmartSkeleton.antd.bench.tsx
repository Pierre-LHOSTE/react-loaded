import { DollarOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Flex,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { bench, describe } from "vitest";
import { SmartSkeleton } from "../components/SmartSkeleton/SmartSkeleton";
import { renderWithProfiler } from "./renderWithProfiler";

type ActivityItem = {
  id: number;
  name: string;
  role: string;
  amount: number;
  status: "active" | "paused" | "new";
};

const heavyItems: ActivityItem[] = Array.from({ length: 200 }, (_, index) => ({
  id: index,
  name: `User ${index + 1}`,
  role: "Operations",
  amount: 1200 + index * 7,
  status: index % 3 === 0 ? "active" : index % 3 === 1 ? "paused" : "new",
}));

const ultraItems: ActivityItem[] = Array.from({ length: 500 }, (_, index) => ({
  id: index,
  name: `User ${index + 1}`,
  role: "Operations",
  amount: 1200 + index * 7,
  status: index % 3 === 0 ? "active" : index % 3 === 1 ? "paused" : "new",
}));

const renderStatus = (status: ActivityItem["status"]) => {
  if (status === "active") return <Tag color="green">Active</Tag>;
  if (status === "paused") return <Tag color="orange">Paused</Tag>;
  return <Tag color="blue">New</Tag>;
};

const summaryCard = (
  <Card>
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Space align="center" size={12}>
        <Avatar icon={<UserOutlined />} />
        <div>
          <Typography.Text strong>Team Snapshot</Typography.Text>
          <Typography.Text type="secondary">Operations</Typography.Text>
        </div>
      </Space>
      <Statistic
        title="Monthly Revenue"
        value={142_580}
        prefix={<DollarOutlined />}
      />
      <Space>
        <Tag color="geekblue">Priority</Tag>
        <Button type="primary" size="small">
          Action
        </Button>
      </Space>
    </Space>
  </Card>
);

const summaryCardSkeleton = (
  <Card>
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Space align="center" size={12}>
        <Avatar icon={<UserOutlined />} />
        <div>
          <Typography.Text strong>Loading</Typography.Text>
          <Typography.Text type="secondary">Loading</Typography.Text>
        </div>
      </Space>
      <Statistic title="Loading" value={0} prefix={<DollarOutlined />} />
      <Space>
        <Tag color="geekblue">Loading</Tag>
        <Button type="primary" size="small" disabled>
          Action
        </Button>
      </Space>
    </Space>
  </Card>
);

const renderListCard = (items: ActivityItem[], label: string) => (
  <Card>
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Text strong>{label}</Typography.Text>
      {items.map((item) => (
        <Flex key={item.id} align="center" justify="space-between" gap={16}>
          <Space align="center" size={12}>
            <Avatar icon={<UserOutlined />} />
            <div>
              <Typography.Text>{item.name}</Typography.Text>
              <Typography.Text type="secondary">{item.role}</Typography.Text>
            </div>
          </Space>
          <Space align="center">
            {renderStatus(item.status)}
            <Typography.Text type="secondary">${item.amount}</Typography.Text>
          </Space>
        </Flex>
      ))}
    </Space>
  </Card>
);

const renderListSkeleton = (items: ActivityItem[]) => (
  <Card>
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Text strong>Loading</Typography.Text>
      {items.map((item) => (
        <Flex key={item.id} align="center" justify="space-between" gap={16}>
          <Space align="center" size={12}>
            <Avatar icon={<UserOutlined />} />
            <div>
              <Typography.Text>{`Loading ${item.id}`}</Typography.Text>
              <Typography.Text type="secondary">Loading</Typography.Text>
            </div>
          </Space>
          <Space align="center">
            <Tag color="default">Loading</Tag>
            <Typography.Text type="secondary">$0</Typography.Text>
          </Space>
        </Flex>
      ))}
    </Space>
  </Card>
);

describe("SmartSkeleton (Ant Design)", () => {
  bench("mount loading skeleton (antd)", () => {
    renderWithProfiler({
      id: "SmartSkeleton:mount:antd",
      element: <SmartSkeleton loading={true} element={summaryCardSkeleton} />,
    });
  });

  bench("update loading to content (antd)", () => {
    renderWithProfiler({
      id: "SmartSkeleton:update:antd",
      element: <SmartSkeleton loading={true} element={summaryCardSkeleton} />,
      update: (
        <SmartSkeleton loading={false} element={summaryCardSkeleton}>
          {summaryCard}
        </SmartSkeleton>
      ),
    });
  });

  bench("mount loading skeleton (antd heavy)", () => {
    renderWithProfiler({
      id: "SmartSkeleton:mount:antd:heavy",
      element: (
        <SmartSkeleton
          loading={true}
          element={renderListSkeleton(heavyItems)}
        />
      ),
    });
  });

  bench("update loading to content (antd heavy)", () => {
    renderWithProfiler({
      id: "SmartSkeleton:update:antd:heavy",
      element: (
        <SmartSkeleton
          loading={true}
          element={renderListSkeleton(heavyItems)}
        />
      ),
      update: (
        <SmartSkeleton loading={false} element={renderListSkeleton(heavyItems)}>
          {renderListCard(heavyItems, "Activity Feed")}
        </SmartSkeleton>
      ),
    });
  });

  bench("mount loading skeleton (antd ultra)", () => {
    renderWithProfiler({
      id: "SmartSkeleton:mount:antd:ultra",
      element: (
        <SmartSkeleton
          loading={true}
          element={renderListSkeleton(ultraItems)}
        />
      ),
    });
  });

  bench("update loading to content (antd ultra)", () => {
    renderWithProfiler({
      id: "SmartSkeleton:update:antd:ultra",
      element: (
        <SmartSkeleton
          loading={true}
          element={renderListSkeleton(ultraItems)}
        />
      ),
      update: (
        <SmartSkeleton loading={false} element={renderListSkeleton(ultraItems)}>
          {renderListCard(ultraItems, "Activity Feed")}
        </SmartSkeleton>
      ),
    });
  });
});
