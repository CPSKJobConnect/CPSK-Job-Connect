"use client";

import { LineChart } from "@mantine/charts";
import { Card, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { mockApplicantLine } from "@public/data/mockStudentStat";

interface ApplicantLineProps {
  date: string;
  applicants: number;
}

export default function ApplicantLineChart() {
  const [data, setData] = useState<ApplicantLineProps[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Immediate load for mock data — no artificial delay so the global loader
    // will not be held up by this component when using mock data.
    setData(mockApplicantLine);
    setLoading(false);
  }, []);

  return (
    <Card shadow="md" radius="lg" p="lg" className="w-full">
      <Title order={4} mb="md" className="text-gray-800 text-center">
        Applications Sent Over Time
      </Title>
      <LineChart
        h={300}
        data={data}
        dataKey="date"
        series={[{ name: "applicants", label: "Applications Sent", color: "#78C841" }]}
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

  {/* Global loader handles page-level loading; internal loading state kept for visuals if needed */}
    </Card>
  );
}
