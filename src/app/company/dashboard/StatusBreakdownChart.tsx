import React from "react";
import { PieChart } from "@mantine/charts";
import { Card, Title, Group, Box, Text } from "@mantine/core";


interface StatusBreakdownChartProps {
  data: StatusBreakdown | null;
  loading: boolean;
}

interface StatusBreakdown {
  pending: number;
  reviewed: number;
  interviewed: number;
  accepted: number;
  rejected: number;
}


export default function StatusBreakdownChart({data, loading}: StatusBreakdownChartProps) {
  const statusColors: Record<string, string> = {
    Pending: "#FFF4CC",
    Reviewed: "#FFD6E0",
    Interviewed: "#B3E5FC",
    Accepted: "#C8E6C9",
    Rejected: "#F5B7B1",
  };


  const chartData = data
    ? [
        { name: "Pending", value: data.pending, color: statusColors["Pending"] },
        { name: "Reviewed", value: data.reviewed, color: statusColors["Reviewed"] },
        { name: "Interviewed", value: data.interviewed, color: statusColors["Interviewed"] },
        { name: "Accepted", value: data.accepted, color: statusColors["Accepted"] },
        { name: "Rejected", value: data.rejected, color: statusColors["Rejected"] },
      ]
    : [];

  return (
    <Card shadow="md" radius="lg" p="md" className="w-full">
      <Title order={4} mb="md" className="text-gray-800 text-center">
        Application Status Breakdown
      </Title>

      <div className="relative flex justify-center items-center">
        <PieChart
          data={chartData}
          withTooltip
          tooltipDataSource="segment"
          withLabels
          labelsPosition="outside"
          size={230}
          strokeWidth={1}
          strokeColor="white"
        />

        <div className="absolute bottom-2 right-1 border border-gray-100 shadow-md p-2 flex flex-col gap-1 bg-white rounded">
          {chartData.map(item => (
            <Group key={item.name}>
              <Box w={14} h={14} style={{ backgroundColor: item.color }} />
              <Text size="sm">{item.name}</Text>
            </Group>
          ))}
        </div>
      </div>
    </Card>
  );
}
