"use client";

import React from "react";
import { PieChart } from "@mantine/charts";
import { Card, Title, Group, Box, Text } from "@mantine/core";
import { mockStatusPie } from "@public/data/mockStudentStat";
import { useState, useEffect } from "react";

interface StatusPieProps {
  name: string;
  value: number;
}

export default function StatusPieChart() {
  const [data, setData] = useState<StatusPieProps[]>([]);
  const statusColors: Record<string, string> = {
    Pending: "#FFF4CC",
    Offered: "#C8E6C9",
    Interview: "#B3E5FC",
    Rejected: "#F8D7DA",
  };


  useEffect(() => {
    setData(mockStatusPie.map(item => ({
      name: item.name,
      value: item.value,
    })));
  }, [])

  return (
    <Card shadow="md" radius="lg" p="md" className="w-full">
      <Title order={4} mb="md" className="text-gray-800 text-center">
        Application Status Breakdown
      </Title>

      <div className="relative flex justify-center items-center">
        <PieChart
          data={data.map(item => ({
            ...item,
            color: statusColors[item.name] || "gray.4",
          }))}
          withTooltip
          tooltipDataSource="segment"
          withLabels
          labelsPosition="outside"
          size={230}
          strokeWidth={1}
          strokeColor="white"
        />

        <div className="absolute bottom-2 right-1 border border-gray-100 shadow-md p-2 flex flex-col gap-1 bg-white rounded">
          {data.map(item => (
            <Group key={item.name}>
              <Box w={14} h={14} style={{ backgroundColor: statusColors[item.name] }} />
              <Text size="sm">{item.name}</Text>
            </Group>
          ))}
        </div>
      </div>
    </Card>
  );
}
