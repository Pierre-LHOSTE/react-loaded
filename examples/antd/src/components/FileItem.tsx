import { Avatar, List } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import type { Ref } from "react";

export interface FileInfo {
  id: string;
  name: string;
  size: string;
  updated: string;
}

interface FileItemProps {
  file: FileInfo;
  ref?: Ref<HTMLDivElement>;
}

export function FileItem({ file, ref }: FileItemProps) {
  return (
    <List.Item ref={ref}>
      <List.Item.Meta
        avatar={<Avatar icon={<FileTextOutlined />} />}
        title={file.name}
        description={`${file.size} • ${file.updated}`}
      />
    </List.Item>
  );
}
