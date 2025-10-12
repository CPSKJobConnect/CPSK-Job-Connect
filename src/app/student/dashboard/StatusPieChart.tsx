"use client";

import { PieChart } from "@mantine/charts";
import { Card, Title } from "@mantine/core";
import { mockStatusPie } from "@public/data/mockStudentStat";
import { useState, useEffect } from "react";

interface StatusPieProps {
  name: string;
  value: number;
}

export default function StatusPieChart() {
  const [data, setData] = useState<StatusPieProps[]>([]);
  const statusColors: Record<string, string> = {
    Pending: "#FFDEDE",
    Offered: "#FF8551",
    Interview: "#ADE4DB",
    Rejected: "#FAF0E4",
  };

  useEffect(() => {
    setData(mockStatusPie.map(item => ({
      name: item.name,
      value: item.value,
    })));
  }, [])

  return (
    <Card shadow="md" radius="lg" p="lg" className="w-full">
      <Title order={4} mb="md" className="text-gray-800 text-center">
        Application Status Breakdown
      </Title>
      <div className="flex justify-center items-center">
        <PieChart
          data={data.map(item => ({
            ...item,
            color: statusColors[item.name] || "gray.4",
          }))}
          withTooltip
          withLabels
          labelsPosition="outside"
          size={250}
          strokeWidth={1}
          tooltipDataSource="segment"
          strokeColor="white"
        />
      </div>
    </Card>
  );
}
