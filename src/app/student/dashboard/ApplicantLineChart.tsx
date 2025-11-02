"use client";

import { LineChart } from "@mantine/charts";
import { Card, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ApplicantLineProps {
  date: string;
  applicants: number;
}

export default function ApplicantLineChart() {
  const [data, setData] = useState<ApplicantLineProps[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchApplicants = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/students/${session.user.id}/statistics/applied`
        );

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const json: ApplicantLineProps[] = await res.json();

        const aggregated = Object.values(
          json.reduce((acc: Record<string, ApplicantLineProps>, cur) => {
            const existing = acc[cur.date];
            if (existing) {
              existing.applicants += cur.applicants;
            } else {
              acc[cur.date] = { ...cur };
            }
            return acc;
          }, {})
        );

        aggregated.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setData(aggregated);
      } catch (err) {
        console.error("Error fetching applicant data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [session?.user?.id]);

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

      {loading && <div className="text-center mt-2 text-gray-500">Loading...</div>}
    </Card>
  );
}
