"use client";

import { Card, Text, Title, Progress, Select } from "@mantine/core";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ConversionProps {
  category: string;
  conversionRate: number;
}

export default function InterviewConversionCard() {
  const { data: session } = useSession();
  const [category, setCategory] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [conversionRate, setConversionRate] = useState<number>(0);
  const [data, setData] = useState<ConversionProps[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchConversionData = async () => {
      try {
        const res = await fetch(`/api/students/${session.user.id}/statistics/interviewrate`);
        const json: ConversionProps[] = await res.json();
        setData(json);
        setCategory(json.map(item => item.category));
        if (!selectedCategory && json.length > 0) {
          setSelectedCategory(json[0].category);
        }
      } catch (err) {
        console.error("Error fetching interview conversion data:", err);
      }
    };

    fetchConversionData();
  }, [session]);

  useEffect(() => {
    if (selectedCategory) {
      const conversionData = data.find(item => item.category === selectedCategory);
      setConversionRate(conversionData ? conversionData.conversionRate : 0);
    }
  }, [selectedCategory, data]);

  return (
    <Card shadow="md" radius="lg" p="lg" className="w-full text-center h-[300px]">
      <div className="flex justify-between items-center mb-4 gap-5">
        <Title order={4} className="text-gray-800">
          Interview Conversion Rate
        </Title>
        <Select
          value={selectedCategory}
          onChange={(value) => value && setSelectedCategory(value)}
          data={category.map((cat) => ({ value: cat, label: cat }))}
          size="xs"
          radius="md"
          style={{ width: 130 }}
        />
      </div>
      <div className="mt-8">
        <Text size="xl" fw={700} c="blue.6">
          {conversionRate}%
        </Text>

        <Progress
          value={conversionRate}
          color={
            conversionRate < 30
              ? "red.4"
              : conversionRate < 60
              ? "yellow.4"
              : "green.4"
          }
          size="lg"
          radius="xl"
          mt="md"
        />
        <Text size="sm" c="dimmed" mt="xs">
          % of this student's applications invited to interviews for the selected category
        </Text>
      </div>
    </Card>
  );
}
