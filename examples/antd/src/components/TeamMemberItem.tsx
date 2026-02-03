import { Avatar, List, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { Ref } from "react";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: "online" | "away" | "offline";
}

interface TeamMemberItemProps {
  member: TeamMember;
  ref?: Ref<HTMLDivElement>;
}

export function TeamMemberItem({ member, ref }: TeamMemberItemProps) {
  const statusColor =
    member.status === "online"
      ? "green"
      : member.status === "away"
        ? "gold"
        : "default";

  return (
    <List.Item ref={ref}>
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={member.name}
        description={member.role}
      />
      <Tag color={statusColor}>{member.status}</Tag>
    </List.Item>
  );
}
