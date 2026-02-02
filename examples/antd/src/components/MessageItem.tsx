import { Avatar, List } from "antd";
import { MailOutlined } from "@ant-design/icons";

export interface Message {
  id: string;
  sender: string;
  subject: string;
  time: string;
}

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  return (
    <List.Item>
      <List.Item.Meta
        avatar={<Avatar icon={<MailOutlined />} />}
        title={message.subject}
        description={`${message.sender} • ${message.time}`}
      />
    </List.Item>
  );
}
