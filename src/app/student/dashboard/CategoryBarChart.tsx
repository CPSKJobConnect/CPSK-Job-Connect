"use client";

import { BarChart } from '@mantine/charts';
import { Card, Title } from "@mantine/core";
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { mock } from 'node:test';

interface CategoryBarProps {
    name: string;
    value: number;
}

export default function CategoryBarChart() {
  const { data: session } = useSession();
  const [data, setData] = useState<CategoryBarProps[]>([]);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const perItemHeight = windowWidth < 640 ? 36 : 44; // smaller rows on narrow screens
  const maxChartHeight = windowWidth < 1024 ? 700 : 900; // allow taller charts on wide screens
  const chartHeight = Math.min(Math.max(200, data.length * perItemHeight), maxChartHeight);

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
    <Card shadow="md" radius="lg" p="lg" className="w-full min-h-[200px] max-h-[700px] overflow-auto">
      <Title order={4} mb="md" className="text-gray-800 text-center">
        Applications by Job Category
      </Title>
      <BarChart
        h={chartHeight}
        data={data}
        dataKey="name"
        orientation="vertical"
        yAxisProps={{
          width: windowWidth < 640 ? 110 : 150,
          interval: 0,
          tickFormatter: (val: any) => {
            const s = String(val ?? '');
            return s.length > 28 ? s.slice(0, 26) + '…' : s;
          },
        }}
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
