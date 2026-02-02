import { List, Progress, Space, Typography } from "antd";

const { Text } = Typography;

export interface Task {
  id: string;
  title: string;
  progress: number;
}

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  return (
    <List.Item>
      <Space orientation="vertical" style={{ width: "100%" }}>
        <Text strong>{task.title}</Text>
        <Progress percent={task.progress} size="small" />
      </Space>
    </List.Item>
  );
}
