"use client";

import { LineChart } from "@mantine/charts";
import { Card, Title } from "@mantine/core";
import { useEffect, useState } from "react";

interface TrendDataPoint {
  date: string;
  applications: number;
}

export default function ApplicantTrendChart() {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<"week" | "month" | "year">("week");

  async function parseJsonSafe(response: Response) {
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      const text = await response.text().catch(() => null);
      console.error(`Fetch failed (${response.status}):`, text);
      return null;
    }
    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch (err) {
        const text = await response.text().catch(() => null);
        console.error("Failed to parse JSON response:", err, text);
        return null;
      }
    }
    const text = await response.text().catch(() => null);
    console.warn("Expected JSON but got different content-type:", contentType, text);
    return null;
  }

  const fetchTrend = async (period: "week" | "month" | "year") => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/company/analytics?type=trend&period=${period}`);
      const result = await parseJsonSafe(resp);
      if (result?.success) {
        setData(result.data?.trend ?? []);
      } else {
        console.error("Failed to fetch application trend data:", result?.error);
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching trend data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrend(trendPeriod);
  }, [trendPeriod]);

  return (
    <Card shadow="md" radius="lg" p="lg" className="w-full">
      <div className="flex items-center justify-between mb-2">
        <Title order={4} className="text-gray-800">
          Applications Trend Over Time
        </Title>
        <div>
          <select
            value={trendPeriod}
            onChange={(e) => setTrendPeriod(e.target.value as "week" | "month" | "year")}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Select trend period"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

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
