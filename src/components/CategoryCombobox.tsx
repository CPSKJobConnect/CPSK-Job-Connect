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
import { IoIosAdd } from "react-icons/io";
import { IoIosClose } from "react-icons/io";


interface CategoryComboboxProps {
  selectedCategory: string[];
  setSelectedCategory: (categories: string[]) => void;
}

const CategoryCombobox = ({ selectedCategory, setSelectedCategory }: CategoryComboboxProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  useEffect(() => {
    // fetch existing category
    setExistingCategories(mockCategory);
  }, [])

  useEffect(() => {
    console.log("selected category: ", selectedCategory)
  }, [selectedCategory])

  const handleSkillAdded = () => {
    if (searchTerm && !existingCategories.includes(searchTerm)) {
        setExistingCategories((prev) => [...prev, searchTerm]);
    }

    if (searchTerm && !selectedCategory.includes(searchTerm)) {
        setSelectedCategory([...selectedCategory, searchTerm]);
    }
  };

  const handleSelectCategory = (skill: string) => {
    if (!selectedCategory.includes(skill)) {
      setSelectedCategory([...selectedCategory, skill]);
    }
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
          className="md:w-[500px] justify-between text-gray-500"
        >
          {value
            ? existingCategories.find((cat) => cat === value) || value
            : "Select category.."}
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
            <div className="flex flex-col gap-3 items-center">
                <p className="text-gray-600 text-sm text-center">
                    No results found. Add <span className="font-semibold text-gray-800">{searchTerm}</span> as a new category?
                </p>
                <Button
                    onClick={handleSkillAdded}
                    className="flex items-center justify-center gap-2 bg-[#C5F4E5] text-[#2BA17C] text-sm w-full max-w-[200px] max-h-[30px]"
                >
                    <IoIosAdd className="w-5 h-5" />
                    <span>Add new category: {searchTerm}</span>
                </Button>
            </div>
            </CommandEmpty>
            <CommandGroup>
              {existingCategories.map((cat, idx) => (
                <CommandItem
                  key={idx}
                  value={cat}
                  onSelect={handleSelectCategory}
                >
                  {cat}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === cat ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <div>
        {selectedCategory.length > 0 && (
            <div className="flex flex-wrap gap-2">
            {selectedCategory.map((cat, idx) => (
                <div
                key={idx}
                className="flex items-center gap-1 rounded-full bg-gray-200 text-gray-700 text-xs py-1 px-3"
                >
                <p>{cat}</p>
                <IoIosClose
                    className="w-4 h-4 cursor-pointer hover:text-red-500"
                    onClick={() =>
                      setSelectedCategory(selectedCategory.filter((s) => s !== cat))
                    }
                />
                </div>
            ))}
            </div>
        )}
    </div>
    </>
  )
}
export default CategoryCombobox;
