"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Province {
  provinceCode: number;
  provinceNameEn: string;
}

interface District {
  districtCode: number;
  provinceCode: number;
  districtNameEn: string;
}

interface Subdistrict {
  subdistrictCode: number;
  districtCode: number;
  subdistrictNameEn: string;
}

interface LocationComboboxProps {
  value: string;
  onChange: (val: string) => void;
}

export default function LocationCombobox({ value, onChange }: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  const [hoveredProvince, setHoveredProvince] = useState<number | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const provRes = await fetch("/data/provinces.json");
      setProvinces(await provRes.json());

      const distRes = await fetch("/data/districts.json");
      setDistricts(await distRes.json());

      const subRes = await fetch("/data/subdistricts.json");
      setSubdistricts(await subRes.json());
    };
    fetchData();
  }, []);

  // Mapping districts & subdistricts
  const districtsMap = districts.reduce<Record<number, District[]>>((acc, d) => {
    if (!acc[d.provinceCode]) acc[d.provinceCode] = [];
    acc[d.provinceCode].push(d);
    return acc;
  }, {});

  const subdistrictsMap = subdistricts.reduce<Record<number, Subdistrict[]>>((acc, s) => {
    if (!acc[s.districtCode]) acc[s.districtCode] = [];
    acc[s.districtCode].push(s);
    return acc;
  }, {});

  const handleSelect = (province: string, district?: string, subdistrict?: string) => {
    const val = [province, district, subdistrict].filter(Boolean).join(", ");
    onChange(val);
    setOpen(false);
    setHoveredProvince(null);
    setHoveredDistrict(null);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="md:w-[500px] justify-between text-gray-700"
        >
          <span className={value ? "text-gray-700" : "text-gray-400"}>
            {value || "Select location"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[500px]">
        <div className="relative">
          <input
            type="text"
            placeholder="Search location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-b px-2 py-1 outline-none"
          />

          <ul className="max-h-[400px] overflow-auto mt-1 border bg-white">
            {provinces
              .filter((p) => p.provinceNameEn.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((province) => (
                <li
                  key={province.provinceCode}
                  className="relative group hover:bg-gray-100 cursor-pointer"
                  onMouseEnter={() => setHoveredProvince(province.provinceCode)}
                  onMouseLeave={() => setHoveredProvince(null)}
                >
                  <div
                    className="px-2 py-1 flex justify-between items-center"
                    onClick={() => handleSelect(province.provinceNameEn)}
                  >
                    {province.provinceNameEn}
                    {value === province.provinceNameEn && <Check className="ml-2" />}
                  </div>

                  {/* Fly-out districts */}
                  {hoveredProvince === province.provinceCode && districtsMap[province.provinceCode] && (
                    <ul className="absolute top-0 left-full w-[300px] border bg-white shadow-lg z-50">
                      {districtsMap[province.provinceCode]
                        .filter((d) => d.districtNameEn.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((district) => (
                          <li
                            key={district.districtCode}
                            className="relative group hover:bg-gray-100 cursor-pointer"
                            onMouseEnter={() => setHoveredDistrict(district.districtCode)}
                            onMouseLeave={() => setHoveredDistrict(null)}
                            onClick={() => handleSelect(province.provinceNameEn, district.districtNameEn)}
                          >
                            <div className="px-2 py-1 flex justify-between items-center">
                              {district.districtNameEn}
                              {value === `${province.provinceNameEn}, ${district.districtNameEn}` && (
                                <Check className="ml-2" />
                              )}
                            </div>

                            {/* Fly-out subdistricts */}
                            {hoveredDistrict === district.districtCode &&
                              subdistrictsMap[district.districtCode] && (
                                <ul className="absolute top-0 left-full w-[300px] border bg-white shadow-lg z-50">
                                  {subdistrictsMap[district.districtCode]
                                    .filter((s) =>
                                      s.subdistrictNameEn
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase())
                                    )
                                    .map((sub) => (
                                      <li
                                        key={sub.subdistrictCode}
                                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                                        onClick={() =>
                                          handleSelect(
                                            province.provinceNameEn,
                                            district.districtNameEn,
                                            sub.subdistrictNameEn
                                          )
                                        }
                                      >
                                        {sub.subdistrictNameEn}
                                      </li>
                                    ))}
                                </ul>
                              )}
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
