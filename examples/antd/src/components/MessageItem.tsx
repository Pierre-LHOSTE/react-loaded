import { Avatar, List } from "antd";
import { MailOutlined } from "@ant-design/icons";
import type { Ref } from "react";

export interface Message {
  id: string;
  sender: string;
  subject: string;
  time: string;
}

interface MessageItemProps {
  message: Message;
  ref?: Ref<HTMLDivElement>;
}

export function MessageItem({ message, ref }: MessageItemProps) {
  return (
    <List.Item ref={ref}>
      <List.Item.Meta
        avatar={<Avatar icon={<MailOutlined />} />}
        title={message.subject}
        description={`${message.sender} • ${message.time}`}
      />
    </List.Item>
  );
}
