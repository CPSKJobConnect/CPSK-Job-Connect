import { Card, Text, Title, Progress, Select } from "@mantine/core";
import { mockInterviewConversion } from "@public/data/mockStudentStat";
import { useEffect, useState } from "react";

export default function InterviewConversionCard() {

  const [category, setCategory] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [conversionRate, setConversionRate] = useState<number>(0);

  useEffect(() => {
    setCategory(mockInterviewConversion.map(item => item.category));

    if (!selectedCategory && mockInterviewConversion.length > 0) {
      setSelectedCategory(mockInterviewConversion[0].category);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const conversionData = mockInterviewConversion.find(item => item.category === selectedCategory);
      setConversionRate(conversionData ? conversionData.conversionRate : 0);
    }
  }, [selectedCategory]);

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
