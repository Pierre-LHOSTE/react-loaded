import { Avatar, List, Tag } from "antd";
import { BellOutlined } from "@ant-design/icons";

export interface Ticket {
  id: string;
  customer: string;
  issue: string;
  priority: "high" | "medium" | "low";
}

interface TicketItemProps {
  ticket: Ticket;
}

export function TicketItem({ ticket }: TicketItemProps) {
  const priorityColor =
    ticket.priority === "high"
      ? "red"
      : ticket.priority === "medium"
        ? "gold"
        : "green";

  return (
    <List.Item>
      <List.Item.Meta
        avatar={<Avatar icon={<BellOutlined />} />}
        title={`${ticket.customer} • ${ticket.issue}`}
        description={`Priority: ${ticket.priority}`}
      />
      <Tag color={priorityColor}>{ticket.priority}</Tag>
    </List.Item>
  );
}
