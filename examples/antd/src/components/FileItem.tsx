import { Avatar, List } from "antd";
import { FileTextOutlined } from "@ant-design/icons";

export interface FileInfo {
  id: string;
  name: string;
  size: string;
  updated: string;
}

interface FileItemProps {
  file: FileInfo;
}

export function FileItem({ file }: FileItemProps) {
  return (
    <List.Item>
      <List.Item.Meta
        avatar={<Avatar icon={<FileTextOutlined />} />}
        title={file.name}
        description={`${file.size} • ${file.updated}`}
      />
    </List.Item>
  );
}
