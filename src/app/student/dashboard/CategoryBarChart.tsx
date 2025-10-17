import { BarChart } from '@mantine/charts';
import { Card, Title } from "@mantine/core";
import { mockCategoryBar } from '@public/data/mockStudentStat';
import { useState, useEffect } from 'react';

interface CategoryBarProps {
    name: string;
    value: number;
}

export default function CategoryBarChart() {
  const [data, setData] = useState<CategoryBarProps[]>([]);
  
  useEffect(() => {
    setData(mockCategoryBar.map(item => ({
      name: item.name,
      value: item.value,
    })));
  }, [])

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
        barProps={{ radius: 10 }}
        series={[{ name: 'value', color: '#D7C3F1' }]}
        />
    </Card>
  );
}