import { BarChart } from '@mantine/charts';
import { Card, Title } from "@mantine/core";
import { mockApplicantBar } from '@public/data/mockStudentStat';
import { useEffect, useState } from 'react';

interface ApplicantBarProps {
  date: string;
  applicants: number;
}

export default function ApplicantBarChart() {
  const [data, setData] = useState<ApplicantBarProps[]>([]);
  
  useEffect(() => {
    setData(mockApplicantBar.map(item => ({
      date: item.date,
      applicants: item.apply_num,
    })));
  }, [])

  return (
    <Card shadow="md" radius="lg" p="lg" className="w-full">
      <Title order={4} mb="md" className="text-gray-800 text-center">
      Applications Sent Over Time
      </Title>
      <BarChart
        h={300}
        data={data}
        dataKey="date"
        series={[
          { name: "applicants", color: "#ABE9D6" },
        ]}
        tickLine="y"
      />
    </Card>
  );
}
