"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { mockCategory } from "public/data/fakeFilterInfo"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { IoIosAdd } from "react-icons/io"

interface CategoryComboboxProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  placeholder: string;
}

const CategoryCombobox = ({ selectedCategory, setSelectedCategory, placeholder }: CategoryComboboxProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  useEffect(() => {
    setExistingCategories(mockCategory);
  }, []);

  const handleAddCategory = () => {
    if (searchTerm && !existingCategories.includes(searchTerm)) {
      setExistingCategories((prev) => [...prev, searchTerm]);
      setSelectedCategory(searchTerm);
      setOpen(false);
    }
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="md:w-[500px] justify-between text-gray-700"
          >
            {selectedCategory || placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="md:w-[500px] p-0">
          <Command>
            <CommandInput
              placeholder="Search category..."
              className="h-9"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col gap-3 items-center p-3">
                  <p className="text-gray-600 text-sm text-center">
                    No results found. Add{" "}
                    <span className="font-semibold text-gray-800">{searchTerm}</span> as a new category?
                  </p>
                  <Button
                    onClick={handleAddCategory}
                    className="flex items-center justify-center gap-2 bg-[#C5F4E5] text-[#2BA17C] text-sm w-full max-w-[200px] max-h-[30px]"
                  >
                    <IoIosAdd className="w-5 h-5" />
                    <span>Add "{searchTerm}"</span>
                  </Button>
                </div>
              </CommandEmpty>

              <CommandGroup>
                {existingCategories.map((cat, idx) => (
                  <CommandItem
                    key={idx}
                    value={cat}
                    onSelect={() => handleSelectCategory(cat)}
                  >
                    {cat}
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedCategory === cat ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default CategoryCombobox;
