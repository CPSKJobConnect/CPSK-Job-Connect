"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, ArrowLeft } from "lucide-react";
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
  showIcon?: boolean;
  className?: string;
}

export default function LocationCombobox({ value, onChange, showIcon = false, className }: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

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

  const handleSelectProvince = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSearchTerm("");
  };

  const handleSelectDistrict = (district: District) => {
    setSelectedDistrict(district);
    setSearchTerm("");
  };

  const handleSelectSubdistrict = (sub: Subdistrict) => {
    const val = `${selectedProvince?.provinceNameEn}, ${selectedDistrict?.districtNameEn}, ${sub.subdistrictNameEn}`;
    onChange(val);
    resetAll();
  };

  const handleBack = () => {
    if (selectedDistrict) setSelectedDistrict(null);
    else if (selectedProvince) setSelectedProvince(null);
    setSearchTerm("");
  };

  const handleSelectCurrentLayer = () => {
    let val = selectedProvince?.provinceNameEn || "";
    if (selectedDistrict) val = `${val}, ${selectedDistrict.districtNameEn}`;
    onChange(val);
    resetAll();
  };

  const resetAll = () => {
    setOpen(false);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="location-combobox"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={
            className
              ? className
              : "w-full pl-0 pr-3 py-1 rounded-md border-none shadow-none focus:ring-0 focus:outline-none text-sm justify-between text-gray-700 md:w-[500px]"
          }
        >
          <span
            className={`
                ${value ? "text-gray-700" : "text-gray-400"}
                ${showIcon ? "pl-6" : ""}
        `}
          >
            {value || "Select location"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[500px] overflow-visible">
        <div className="relative overflow-visible">
          <input
            type="text"
            placeholder="Search location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-b px-2 py-1 outline-none"
          />

          {(selectedProvince || selectedDistrict) && (
            <div className="flex gap-2 px-2 py-1">
              <button
                className="flex items-center gap-1 text-sm text-gray-600 hover:bg-gray-100 px-2 py-1 rounded"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                className="flex items-center gap-1 text-sm text-gray-600 hover:bg-gray-100 px-2 py-1 rounded"
                onClick={handleSelectCurrentLayer}
              >
                Select Here
              </button>
            </div>
          )}

          <ul className="max-h-[250px] overflow-auto mt-1 border bg-white">
            {!selectedProvince &&
              provinces
                .filter((p) => p.provinceNameEn.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((province) => (
                  <li
                    key={province.provinceCode}
                    data-testid={`province-option-${province.provinceNameEn}`}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => handleSelectProvince(province)}
                  >
                    {province.provinceNameEn}
                    {value === province.provinceNameEn && <Check className="ml-2" />}
                  </li>
                ))}

            {selectedProvince && !selectedDistrict &&
              districtsMap[selectedProvince.provinceCode]
                .filter((d) => d.districtNameEn.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((district) => (
                  <li
                    key={district.districtCode}
                    data-testid={`district-option-${district.districtNameEn}`}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => handleSelectDistrict(district)}
                  >
                    {district.districtNameEn}
                    {value === `${selectedProvince.provinceNameEn}, ${district.districtNameEn}` && (
                      <Check className="ml-2" />
                    )}
                  </li>
                ))}

            {selectedProvince && selectedDistrict &&
              subdistrictsMap[selectedDistrict.districtCode]
                .filter((s) => s.subdistrictNameEn.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((sub) => (
                  <li
                    key={sub.subdistrictCode}
                    data-testid={`subdistrict-option-${sub.subdistrictNameEn}`}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => handleSelectSubdistrict(sub)}
                  >
                    {sub.subdistrictNameEn}
                  </li>
                ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
