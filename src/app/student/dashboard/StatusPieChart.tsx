"use client";

import React, { useState, useEffect } from "react";
import { PieChart } from "@mantine/charts";
import { Card, Title, Group, Box, Text } from "@mantine/core";
import { useSession } from "next-auth/react";

interface StatusPieProps {
  name: string;
  value: number;
}

export default function StatusPieChart() {
  const { data: session } = useSession();
  const [data, setData] = useState<StatusPieProps[]>([]);
  const statusColors: Record<string, string> = {
    Pending: "#ffe377",
    Offered: "#65df6a",
    Interview: "#77cbef",
    Rejected: "#f17c8a",
    Reviewed: "#b474dd",
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchStatusData = async () => {
      try {
        const res = await fetch(`/api/students/${session.user.id}/statistics/status`);
        const json: StatusPieProps[] = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching status data:", error);
      }
    };

    fetchStatusData();
  }, [session]);

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
