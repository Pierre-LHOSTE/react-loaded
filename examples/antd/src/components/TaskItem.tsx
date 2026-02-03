import { List, Progress, Space, Typography } from "antd";
import type { Ref } from "react";

const { Text } = Typography;

export interface Task {
  id: string;
  title: string;
  progress: number;
}

interface TaskItemProps {
  task: Task;
  ref?: Ref<HTMLDivElement>;
}

export function TaskItem({ task, ref }: TaskItemProps) {
  return (
    <List.Item ref={ref}>
      <Space orientation="vertical" style={{ width: "100%" }}>
        <Text strong>{task.title}</Text>
        <Progress percent={task.progress} size="small" />
      </Space>
    </List.Item>
  );
}
