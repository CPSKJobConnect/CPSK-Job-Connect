"use client";

import { LineChart } from "@mantine/charts";
import { Card, Title } from "@mantine/core";


interface ApplicationTrendChartProps {
  data: TrendDataPoint[];
  loading: boolean;
}

interface TrendDataPoint {
  date: string;
  applications: number;
}


export default function ApplicantTrendChart({data, loading}: ApplicationTrendChartProps) {

  return (
    <Card shadow="md" radius="lg" p="lg" className="w-full">
      <Title order={4} mb="md" className="text-gray-800 text-center">
        Applications Trend Over Time
      </Title>
      <LineChart
        h={300}
        data={data}
        dataKey="date"
        series={[{ name: "applications", label: "Applications", color: "#78C841" }]}
        strokeWidth={3}
        curveType="monotone"
        tooltipProps={{
            labelFormatter: (date) => `Period: ${date}`,
            formatter: (value) => `${value} applications`,
        }}
        yAxisProps={{
            domain: ["auto", "auto"],
            tickFormatter: (val) => Math.round(val).toString(),
        }}
      />


      {loading && <div className="text-center mt-2 text-gray-500">Loading...</div>}
    </Card>
  );
}
