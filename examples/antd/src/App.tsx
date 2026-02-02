import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Descriptions,
  Divider,
  Flex,
  Form,
  Input,
  List,
  Progress,
  QRCode,
  Result,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Switch,
  Table,
  Tag,
  Timeline,
  Typography,
  theme,
} from "antd";
import type { DescriptionsProps, TableColumnsType } from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  MailOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { SmartSkeleton, SmartSkeletonList } from "loaded";

import { TeamMemberItem, type TeamMember } from "./components/TeamMemberItem";
import { MessageItem, type Message } from "./components/MessageItem";
import { ProductCard, type Product } from "./components/ProductCard";
import { TaskItem, type Task } from "./components/TaskItem";
import { TicketItem, type Ticket } from "./components/TicketItem";
import { FileItem, type FileInfo } from "./components/FileItem";
import { StatCard, type Stat } from "./components/StatCard";
import { InventoryItem, type InventoryEntry } from "./components/InventoryItem";

const { Text, Title } = Typography;

// Mock data for skeletons
const mockTeamMember: TeamMember = {
  id: "skeleton",
  name: "Member Name",
  role: "Role Title",
  status: "online",
};

const mockMessage: Message = {
  id: "skeleton",
  sender: "Sender",
  subject: "Message subject",
  time: "1h ago",
};

const mockProduct: Product = {
  id: "skeleton",
  name: "Product Name",
  price: 999,
  rating: 4.5,
  stock: 10,
};

const mockTask: Task = {
  id: "skeleton",
  title: "Task title here",
  progress: 50,
};

const mockTicket: Ticket = {
  id: "skeleton",
  customer: "Customer",
  issue: "Issue description",
  priority: "medium",
};

const mockFile: FileInfo = {
  id: "skeleton",
  name: "filename.ext",
  size: "1.0 MB",
  updated: "Today",
};

const mockStat: Stat = {
  key: "skeleton",
  title: "Metric",
  value: 1000,
  prefix: <DollarOutlined />,
  color: "#1677ff",
};

const mockInventory: InventoryEntry = {
  id: "skeleton",
  name: "Item Name",
  stock: 50,
  threshold: 50,
};

// Real data
const stats: Stat[] = [
  {
    key: "revenue",
    title: "Revenue",
    value: 124893,
    prefix: <DollarOutlined />,
    suffix: "USD",
    color: "#1677ff",
  },
  {
    key: "orders",
    title: "Orders",
    value: 1324,
    prefix: <ShoppingCartOutlined />,
    color: "#722ed1",
  },
  {
    key: "support",
    title: "Tickets",
    value: 86,
    prefix: <FileTextOutlined />,
    color: "#fa8c16",
  },
  { key: "nps", title: "NPS", value: 58, suffix: "/100", color: "#52c41a" },
];

const products: Product[] = [
  { id: "p1", name: "Noise Canceling Headphones", price: 349, rating: 4.7, stock: 28 },
  { id: "p2", name: '13" Ultrabook Pro', price: 1399, rating: 4.6, stock: 12 },
  { id: "p3", name: "Ergonomic Keyboard", price: 129, rating: 4.4, stock: 54 },
  { id: "p4", name: "4K Webcam", price: 189, rating: 4.5, stock: 41 },
  { id: "p5", name: "Portable SSD 2TB", price: 219, rating: 4.8, stock: 19 },
  { id: "p6", name: "Desk Lamp", price: 59, rating: 4.3, stock: 73 },
];

const teamMembers: TeamMember[] = [
  { id: "t1", name: "Alex Morgan", role: "Product Manager", status: "online" },
  { id: "t2", name: "Priya Singh", role: "Frontend Engineer", status: "online" },
  { id: "t3", name: "Marco Ruiz", role: "Backend Engineer", status: "away" },
  { id: "t4", name: "Emma Chen", role: "Designer", status: "offline" },
];

const messages: Message[] = [
  { id: "m1", sender: "Logistics", subject: "Shipment delayed", time: "2h ago" },
  { id: "m2", sender: "Billing", subject: "Invoice 1029", time: "3h ago" },
  { id: "m3", sender: "Customer", subject: "Return request", time: "5h ago" },
  { id: "m4", sender: "Support", subject: "SLA breach", time: "1d ago" },
];

const files: FileInfo[] = [
  { id: "f1", name: "Q1-report.pdf", size: "2.3 MB", updated: "Today" },
  { id: "f2", name: "pricing.xlsx", size: "840 KB", updated: "Yesterday" },
  { id: "f3", name: "branding.zip", size: "12.4 MB", updated: "2d ago" },
  { id: "f4", name: "roadmap.docx", size: "1.1 MB", updated: "3d ago" },
];

const tasks: Task[] = [
  { id: "tk1", title: "Finalize onboarding emails", progress: 80 },
  { id: "tk2", title: "Migrate search index", progress: 45 },
  { id: "tk3", title: "Release v2.4.0", progress: 65 },
  { id: "tk4", title: "Bug triage", progress: 30 },
];

const inventory: InventoryEntry[] = [
  { id: "i1", name: "USB-C Cables", stock: 180, threshold: 60 },
  { id: "i2", name: "Laptop Stands", stock: 48, threshold: 80 },
  { id: "i3", name: "Docking Stations", stock: 92, threshold: 70 },
  { id: "i4", name: "Travel Adapters", stock: 35, threshold: 50 },
];

const tickets: Ticket[] = [
  { id: "s1", customer: "Acme Inc.", issue: "SSO setup", priority: "high" },
  { id: "s2", customer: "Northwind", issue: "Billing mismatch", priority: "medium" },
  { id: "s3", customer: "Initech", issue: "Webhook retries", priority: "low" },
  { id: "s4", customer: "Globex", issue: "Latency spike", priority: "high" },
];

interface OrderRecord {
  key: string;
  orderId: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "failed";
}

const orders: OrderRecord[] = [
  { key: "1", orderId: "ORD-1024", customer: "Monolith Labs", amount: 1249, status: "paid" },
  { key: "2", orderId: "ORD-1025", customer: "Brightside", amount: 649, status: "pending" },
  { key: "3", orderId: "ORD-1026", customer: "Atlas Co.", amount: 1899, status: "paid" },
  { key: "4", orderId: "ORD-1027", customer: "Nimbus", amount: 429, status: "failed" },
];

const orderColumns: TableColumnsType<OrderRecord> = [
  { title: "Order", dataIndex: "orderId", key: "orderId" },
  { title: "Customer", dataIndex: "customer", key: "customer" },
  {
    title: "Amount",
    dataIndex: "amount",
    key: "amount",
    render: (value: number) => <Text strong>${value}</Text>,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: OrderRecord["status"]) => {
      const color = status === "paid" ? "green" : status === "pending" ? "gold" : "red";
      return <Tag color={color}>{status.toUpperCase()}</Tag>;
    },
  },
];

const profileItems: DescriptionsProps["items"] = [
  { key: "name", label: "Name", children: "Jamie Rivera" },
  { key: "role", label: "Role", children: "Operations Lead" },
  { key: "email", label: "Email", children: "jamie@company.com" },
  { key: "region", label: "Region", children: "EMEA" },
  { key: "status", label: "Status", children: <Badge status="success" text="Active" /> },
];

const mockProfileItems: DescriptionsProps["items"] = [
  { key: "name", label: "Name", children: "User Name" },
  { key: "role", label: "Role", children: "User Role" },
  { key: "email", label: "Email", children: "user@example.com" },
  { key: "region", label: "Region", children: "Region" },
  { key: "status", label: "Status", children: <Badge status="success" text="Status" /> },
];

const timelineItems = [
  { color: "green", icon: <CheckCircleOutlined />, content: "Order confirmed" },
  { color: "blue", icon: <ClockCircleOutlined />, content: "Warehouse picking" },
  { color: "gold", icon: <ClockCircleOutlined />, content: "In transit" },
  { color: "gray", icon: <ClockCircleOutlined />, content: "Delivered" },
];

const checkoutSteps = [
  { title: "Cart", status: "finish" as const },
  { title: "Shipping", status: "process" as const },
  { title: "Payment", status: "wait" as const },
  { title: "Review", status: "wait" as const },
];

const initialLoading = {
  stats: true,
  products: true,
  team: true,
  messages: true,
  files: true,
  tasks: true,
  inventory: true,
  tickets: true,
  orders: true,
  profile: true,
  steps: true,
  timeline: true,
  settings: true,
  progress: true,
  alert: true,
  result: true,
  qrcode: true,
  lab: true,
};

type LoadingKey = keyof typeof initialLoading;

export function App() {
  const [loading, setLoading] = useState(initialLoading);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggle = (key: LoadingKey) => {
    setLoading((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDarkMode(event.matches);
    };
    setIsDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const renderControls = (key: LoadingKey) => {
    return (
      <Space align="center" size={6}>
        <Text type="secondary">Loading</Text>
        <Switch checked={loading[key]} onChange={() => toggle(key)} />
      </Space>
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div
        style={{
          padding: 24,
          margin: 0,
          minHeight: "100vh",
          backgroundColor: isDarkMode ? "#0f0f10" : "#f8fafc",
          color: isDarkMode ? "#f3f4f6" : "#111827",
          transition: "background-color 200ms ease, color 200ms ease",
        }}
      >
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <Card>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Loaded + Ant Design Loading Examples
                </Title>
                <Text type="secondary">
                  Real-world loading cases using the same component for skeleton and content
                </Text>
              </div>
              <Button icon={<FileTextOutlined />}>Docs</Button>
            </Flex>
          </Card>

          {/* KPI Summary */}
          <Card
            title="KPI Summary"
            extra={renderControls("stats")}
          >
            <Row gutter={[16, 16]}>
              <SmartSkeletonList
                loading={loading.stats}
                items={loading.stats ? undefined : stats}
                renderItem={(stat) => <StatCard stat={stat} />}
                renderSkeleton={(index) => (
                  <StatCard stat={{ ...mockStat, key: `skeleton-${index}` }} />
                )}
                storageKey="kpi-summary"
                keyExtractor={(stat) => stat.key}
              />
            </Row>
          </Card>

          {/* Featured Products */}
          <Card
            title="Featured Products"
            extra={renderControls("products")}
          >
            <Flex wrap="wrap" gap={16}>
              <SmartSkeletonList
                loading={loading.products}
                items={loading.products ? undefined : products}
                renderItem={(product) => <ProductCard product={product} />}
                renderSkeleton={(index) => (
                  <ProductCard
                    product={{ ...mockProduct, id: `skeleton-${index}` }}
                  />
                )}
                storageKey="product-grid"
                keyExtractor={(product) => product.id}
              />
            </Flex>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Recent Orders"
                extra={renderControls("orders")}
              >
                <SmartSkeleton
                  loading={loading.orders}
                  element={
                    <Table
                      dataSource={orders}
                      columns={orderColumns}
                      pagination={false}
                      size="small"
                    />
                  }
                >
                  <Table
                    dataSource={orders}
                    columns={orderColumns}
                    pagination={false}
                    size="small"
                  />
                </SmartSkeleton>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Customer Profile"
                extra={renderControls("profile")}
              >
                <SmartSkeleton
                  loading={loading.profile}
                  element={
                    <Descriptions
                      column={1}
                      items={mockProfileItems}
                      bordered
                      size="small"
                    />
                  }
                >
                  <Descriptions
                    column={1}
                    items={profileItems}
                    bordered
                    size="small"
                  />
                </SmartSkeleton>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Team Availability"
                extra={renderControls("team")}
              >
                <List itemLayout="horizontal">
                  <SmartSkeletonList
                    loading={loading.team}
                    items={loading.team ? undefined : teamMembers}
                    renderItem={(member) => <TeamMemberItem member={member} />}
                    renderSkeleton={(index) => (
                      <TeamMemberItem
                        member={{ ...mockTeamMember, id: `skeleton-${index}` }}
                      />
                    )}
                    storageKey="team-list"
                    keyExtractor={(member) => member.id}
                  />
                </List>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Inbox"
                extra={renderControls("messages")}
              >
                <List itemLayout="horizontal">
                  <SmartSkeletonList
                    loading={loading.messages}
                    items={loading.messages ? undefined : messages}
                    renderItem={(message) => <MessageItem message={message} />}
                    renderSkeleton={(index) => (
                      <MessageItem
                        message={{ ...mockMessage, id: `skeleton-${index}` }}
                      />
                    )}
                    storageKey="message-list"
                    keyExtractor={(message) => message.id}
                  />
                </List>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Project Tasks"
                extra={renderControls("tasks")}
              >
                <List itemLayout="vertical">
                  <SmartSkeletonList
                    loading={loading.tasks}
                    items={loading.tasks ? undefined : tasks}
                    renderItem={(task) => <TaskItem task={task} />}
                    renderSkeleton={(index) => (
                      <TaskItem task={{ ...mockTask, id: `skeleton-${index}` }} />
                    )}
                    storageKey="task-list"
                    keyExtractor={(task) => task.id}
                  />
                </List>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Inventory Watch"
                extra={renderControls("inventory")}
              >
                <List itemLayout="vertical">
                  <SmartSkeletonList
                    loading={loading.inventory}
                    items={loading.inventory ? undefined : inventory}
                    renderItem={(item) => <InventoryItem item={item} />}
                    renderSkeleton={(index) => (
                      <InventoryItem
                        item={{ ...mockInventory, id: `skeleton-${index}` }}
                      />
                    )}
                    storageKey="inventory-list"
                    keyExtractor={(item) => item.id}
                  />
                </List>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Support Queue"
                extra={renderControls("tickets")}
              >
                <List itemLayout="horizontal">
                  <SmartSkeletonList
                    loading={loading.tickets}
                    items={loading.tickets ? undefined : tickets}
                    renderItem={(ticket) => <TicketItem ticket={ticket} />}
                    renderSkeleton={(index) => (
                      <TicketItem
                        ticket={{ ...mockTicket, id: `skeleton-${index}` }}
                      />
                    )}
                    storageKey="ticket-list"
                    keyExtractor={(ticket) => ticket.id}
                  />
                </List>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Files"
                extra={renderControls("files")}
              >
                <List itemLayout="horizontal">
                  <SmartSkeletonList
                    loading={loading.files}
                    items={loading.files ? undefined : files}
                    renderItem={(file) => <FileItem file={file} />}
                    renderSkeleton={(index) => (
                      <FileItem file={{ ...mockFile, id: `skeleton-${index}` }} />
                    )}
                    storageKey="file-list"
                    keyExtractor={(file) => file.id}
                  />
                </List>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Checkout Progress"
                extra={renderControls("steps")}
              >
                <SmartSkeleton
                  loading={loading.steps}
                  element={
                    <Steps items={checkoutSteps} />
                  }
                >
                  <Steps items={checkoutSteps} />
                </SmartSkeleton>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Shipment Timeline"
                extra={renderControls("timeline")}
              >
                <SmartSkeleton
                  loading={loading.timeline}
                  element={
                    <Timeline items={timelineItems} />
                  }
                >
                  <Timeline items={timelineItems} />
                </SmartSkeleton>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Settings Form"
                extra={renderControls("settings")}
              >
                <SmartSkeleton
                  loading={loading.settings}
                  element={
                    <Form layout="vertical">
                      <Form.Item label="Workspace Name">
                        <Input placeholder="Workspace" />
                      </Form.Item>
                      <Form.Item label="Default Region">
                        <Select
                          options={[
                            { label: "US East", value: "us-east" },
                            { label: "EU West", value: "eu-west" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item label="Alerts">
                        <Switch />
                      </Form.Item>
                      <Button type="primary">Save</Button>
                    </Form>
                  }
                >
                  <Form layout="vertical">
                    <Form.Item label="Workspace Name">
                      <Input placeholder="Acme HQ" />
                    </Form.Item>
                    <Form.Item label="Default Region">
                      <Select
                        options={[
                          { label: "US East", value: "us-east" },
                          { label: "EU West", value: "eu-west" },
                          { label: "APAC", value: "apac" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Alerts">
                      <Switch defaultChecked />
                    </Form.Item>
                    <Button type="primary">Save</Button>
                  </Form>
                </SmartSkeleton>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Delivery Health"
                extra={renderControls("progress")}
              >
                <SmartSkeleton
                  loading={loading.progress}
                  element={
                    <Space orientation="vertical" style={{ width: "100%" }}>
                      <Flex justify="space-between">
                        <Text>Metric name</Text>
                        <Text>0%</Text>
                      </Flex>
                      <Progress percent={0} />
                      <Flex justify="space-between">
                        <Text>Metric name</Text>
                        <Text>0%</Text>
                      </Flex>
                      <Progress percent={0} />
                      <Divider style={{ margin: "8px 0" }} />
                      <Statistic title="Avg. metric" value={0} suffix="unit" />
                    </Space>
                  }
                >
                  <Space orientation="vertical" style={{ width: "100%" }}>
                    <Flex justify="space-between">
                      <Text>On-time delivery</Text>
                      <Text>92%</Text>
                    </Flex>
                    <Progress percent={92} status="active" />
                    <Flex justify="space-between">
                      <Text>Warehouse accuracy</Text>
                      <Text>98%</Text>
                    </Flex>
                    <Progress percent={98} />
                    <Divider style={{ margin: "8px 0" }} />
                    <Statistic title="Avg. ship time" value={2.1} suffix="days" />
                  </Space>
                </SmartSkeleton>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                title="Alert (non-real)"
                extra={renderControls("alert")}
              >
                <SmartSkeleton
                  loading={loading.alert}
                  element={
                    <Alert
                      title="Alert message"
                      description="Alert description text"
                      type="warning"
                      showIcon
                      icon={<WarningOutlined />}
                    />
                  }
                >
                  <Alert
                    title="Test alert for skeleton rendering"
                    description="Not a realistic loading case, just for coverage"
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                  />
                </SmartSkeleton>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                title="Result (non-real)"
                extra={renderControls("result")}
              >
                <SmartSkeleton
                  loading={loading.result}
                  element={
                    <Result
                      status="success"
                      title="Result title"
                      subTitle="Result subtitle"
                      extra={<Button type="primary">Action</Button>}
                    />
                  }
                >
                  <Result
                    status="success"
                    title="Payment completed"
                    subTitle="This is a test-only view"
                    extra={<Button type="primary">View receipt</Button>}
                  />
                </SmartSkeleton>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                title="QR Code (non-real)"
                extra={renderControls("qrcode")}
              >
                <SmartSkeleton
                  loading={loading.qrcode}
                  element={
                    <Space orientation="vertical" align="center" style={{ width: "100%" }}>
                      <QRCode value="https://example.com" />
                      <Text type="secondary">QR code label</Text>
                    </Space>
                  }
                >
                  <Space orientation="vertical" align="center" style={{ width: "100%" }}>
                    <QRCode value="https://ant.design" />
                    <Text type="secondary">Test QR for skeleton</Text>
                  </Space>
                </SmartSkeleton>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                title="Badge Lab (non-real)"
                extra={renderControls("lab")}
              >
                <SmartSkeleton
                  loading={loading.lab}
                  element={
                    <Space size="large">
                      <Badge count={0}>
                        <Avatar icon={<UserOutlined />} />
                      </Badge>
                      <Badge count={0}>
                        <Avatar icon={<MailOutlined />} />
                      </Badge>
                      <Badge dot>
                        <Avatar icon={<BellOutlined />} />
                      </Badge>
                    </Space>
                  }
                >
                  <Space size="large">
                    <Badge count={5}>
                      <Avatar icon={<UserOutlined />} />
                    </Badge>
                    <Badge count={0} showZero>
                      <Avatar icon={<MailOutlined />} />
                    </Badge>
                    <Badge dot>
                      <Avatar icon={<BellOutlined />} />
                    </Badge>
                  </Space>
                </SmartSkeleton>
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </ConfigProvider>
  );
}
