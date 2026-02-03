import { Card, Col, Statistic } from "antd";
import type { ReactNode, Ref } from "react";

export interface Stat {
  key: string;
  title: string;
  value: number;
  prefix?: ReactNode;
  suffix?: string;
  color: string;
}

interface StatCardProps {
  stat: Stat;
  ref?: Ref<HTMLDivElement>;
}

export function StatCard({ stat, ref }: StatCardProps) {
  return (
    <Col xs={24} md={12} lg={6} ref={ref}>
      <Card>
        <Statistic
          title={stat.title}
          value={stat.value}
          prefix={stat.prefix}
          suffix={stat.suffix}
          styles={{ content: { color: stat.color } }}
        />
      </Card>
    </Col>
  );
}
