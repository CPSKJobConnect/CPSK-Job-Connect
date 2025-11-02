"use client";

import { BarChart } from '@mantine/charts';
import { Card, Title } from "@mantine/core";
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

interface CategoryBarProps {
    name: string;
    value: number;
}

export default function CategoryBarChart() {
  const { data: session } = useSession();
  const [data, setData] = useState<CategoryBarProps[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchCategoryData = async () => {
      try {
        const res = await fetch(`/api/students/${session.user.id}/statistics/category`);
        const json: CategoryBarProps[] = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching category data:", err);
      }
    };

    fetchCategoryData();
  }, [session]);

  return (
    <Card shadow="md" radius="lg" p="lg" className="w-full h-[300px]">
      <Title order={4} mb="md" className="text-gray-800 text-center">
        Applications by Job Category
      </Title>
      <BarChart
        h={200}
        data={data}
        dataKey="name"
        orientation="vertical"
        yAxisProps={{ width: 80 }}
        barChartProps={{
          maxBarSize: 28,
          barGap: 4,
          barCategoryGap: '20%'
        }}
        barProps={{ radius: 10 }}
        tooltipProps={{
          shared: false,
          allowEscapeViewBox: { x: true, y: true },
          wrapperStyle: { zIndex: 9999 },
          cursor: { fill: 'transparent' }
        }}
        series={[{ name: 'value', color: '#D7C3F1' }]}
      />
    </Card>
  );
}
