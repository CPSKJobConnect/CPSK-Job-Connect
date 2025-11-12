"use client"

import * as React from "react"
import { useState, useEffect } from "react"
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


interface SkillComboboxProps {
  selectedSkill: string[];
  setSelectedSkill: (skills: string[]) => void;
  existingSkills?: string[];
}

const SkillCombobox = ({ selectedSkill, setSelectedSkill, existingSkills = [] }: SkillComboboxProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [skillList, setSkillList] = useState<string[]>(existingSkills);

  useEffect(() => {
    console.log("selected skill: ", selectedSkill)
  }, [selectedSkill])

  const handleSkillAdded = () => {
    const term = searchTerm.trim();
    if (!term) return;

    if (!skillList.some((s) => s.toLowerCase() === term.toLowerCase())) {
      setSkillList((prev) => [...prev, term]);
    }

    if (!selectedSkill.includes(term)) {
      setSelectedSkill([...selectedSkill, term]);
    }

    setValue(term);
    setSearchTerm("");
  };

  const handleSelectSkill = (skillName: string) => {
    if (!selectedSkill.includes(skillName)) {
      setSelectedSkill([...selectedSkill, skillName]);
    }
    setValue(skillName);
    setOpen(false);
  };

  return (
    <>
    <div className="flex flex-col gap-2">
        {selectedSkill.length > 0 && (
            <div className="flex flex-wrap gap-2">
            {selectedSkill.map((skill, idx) => (
                <div
                key={idx}
                className="flex items-center gap-1 rounded-full bg-gray-200 text-gray-700 text-xs py-1 px-3"
                >
                <p>{skill}</p>
                <IoIosClose
                    className="w-4 h-4 cursor-pointer hover:text-red-500"
                    onClick={() =>
                      setSelectedSkill(selectedSkill.filter((s) => s !== skill))
                    }
                />
                </div>
            ))}
            </div>
        )}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-gray-500"
        >
          {value
            ? existingSkills.find((skill) => skill === value) || value
            : "Select skill..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
  <PopoverContent className="w-full max-w-[500px] p-0">
        <Command>
          <CommandInput 
          placeholder="Search skill..." 
          className="h-9"
          value={searchTerm}
          onValueChange={setSearchTerm} 
          />
          <CommandList>
            {/* compute filtered skills and exact match */}
            {(() => {
              const term = searchTerm.trim().toLowerCase();
              const filteredSkills = term
                ? skillList.filter((s) => s.toLowerCase().includes(term))
                : skillList;
              const hasExact = term && skillList.some((s) => s.toLowerCase() === term);

              if (filteredSkills.length === 0) {
                return (
                  <>
                    <CommandEmpty>
                      <div className="flex flex-col gap-3 items-center">
                        <p className="text-gray-600 text-sm text-center max-w-[150px]">
                          No results found. Add <span className="font-semibold text-gray-800 truncate block">{searchTerm}</span> as a new skill?
                        </p>
                        {!hasExact && (
                          <Button
                            onClick={handleSkillAdded}
                            className="flex items-center justify-center gap-2 bg-[#C5F4E5] text-[#2BA17C] text-sm w-auto max-h-[30px] max-w-[200px]"
                          >
                            <IoIosAdd className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              Add new skill: {searchTerm}
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
                    {filteredSkills.map((skill, idx) => (
                      <CommandItem
                        key={idx}
                        value={skill}
                        onSelect={handleSelectSkill}
                      >
                        {skill}
                        <Check
                          className={cn(
                            "ml-auto",
                            value === skill ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* If the search term doesn't exactly match an existing skill, allow adding it */}
                  {searchTerm.trim() !== "" && !hasExact && (
                    <div className="px-3 py-2">
                      <Button
                        onClick={handleSkillAdded}
                        className="flex items-center justify-center gap-2 bg-[#C5F4E5] text-[#2BA17C] text-sm w-full"
                      >
                        <IoIosAdd className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">Add new skill: {searchTerm.trim()}</span>
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
    </div>
    </>
  )
}
export default SkillCombobox;
