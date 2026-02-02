import { Avatar, List, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: "online" | "away" | "offline";
}

interface TeamMemberItemProps {
  member: TeamMember;
}

export function TeamMemberItem({ member }: TeamMemberItemProps) {
  const statusColor =
    member.status === "online"
      ? "green"
      : member.status === "away"
        ? "gold"
        : "default";

  return (
    <List.Item>
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={member.name}
        description={member.role}
      />
      <Tag color={statusColor}>{member.status}</Tag>
    </List.Item>
  );
}
