"use client"

import * as React from "react"
import { useState } from "react"
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
  categoryList: string[]
}

const CategoryCombobox = ({ selectedCategory, setSelectedCategory, placeholder, categoryList, }: CategoryComboboxProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [existingCategories, setExistingCategories] = useState<string[]>(categoryList);

  React.useEffect(() => {
    setExistingCategories(categoryList || []);
  }, [categoryList]);

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
            <span
              className={
                selectedCategory
                  ? "text-gray-700"
                  : "text-gray-400"
              }
            >
              {selectedCategory || placeholder}
            </span>
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
              {(() => {
                const term = searchTerm.trim().toLowerCase();
                const filtered = term
                  ? existingCategories.filter((c) => c.toLowerCase().includes(term))
                  : existingCategories;
                const hasExact = term && existingCategories.some((c) => c.toLowerCase() === term);

                if (filtered.length === 0) {
                  return (
                    <>
                      <CommandEmpty>
                        <div className="flex flex-col gap-3 items-center p-3">
                          <p className="text-gray-600 text-sm text-center max-w-[150px]">
                            No results found. Add <span className="font-semibold text-gray-800 truncate block">{searchTerm}</span> as a new category?
                          </p>
                          {!hasExact && (
                            <Button
                              onClick={handleAddCategory}
                              className="flex items-center justify-center gap-2 bg-[#C5F4E5] text-[#2BA17C] text-sm w-auto max-h-[30px] max-w-[400px]"
                            >
                              <IoIosAdd className="w-5 h-5 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">
                                Add new category: {searchTerm}
                              </span>
                            </Button>
                          )}
                        </div>
                      </CommandEmpty>
                    </>
                  );
                }

                return (
                  <>
                    <CommandGroup>
                      {filtered.map((cat, idx) => (
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

                    {searchTerm.trim() !== "" && !hasExact && (
                      <div className="px-3 py-2">
                        <Button
                          onClick={handleAddCategory}
                          className="flex items-center justify-center gap-2 bg-[#C5F4E5] text-[#2BA17C] text-sm w-full"
                        >
                          <IoIosAdd className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">Add new category: {searchTerm.trim()}</span>
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default CategoryCombobox;
