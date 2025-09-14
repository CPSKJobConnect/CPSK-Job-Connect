"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { mockSkill } from "@/fakeFilterInfo"
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


const SkillCombobox = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [existingSkills, setExistingSkills] = useState<string[]>([]);

  useEffect(() => {
    // fetch existing skill
    setExistingSkills(mockSkill);
  }, [])

  const handleSkillAdded = () => {
    if (searchTerm && !existingSkills.includes(searchTerm)) {
        setExistingSkills((prev) => [...prev, searchTerm]);
    }

    if (searchTerm && !selectedSkill.includes(searchTerm)) {
        setSelectedSkill((prev) => [...prev, searchTerm]);
    }
  };

  const handleSelectSkill = (skill: string) => {
    if (!selectedSkill.includes(skill)) {
       setSelectedSkill((prev) => [...prev, skill]);
    }
    setOpen(false);
  };

  return (
    <>
    <div>
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
                    setSelectedSkill((prev) => prev.filter((s) => s !== skill))
                    }
                />
                </div>
            ))}
            </div>
        )}
    </div>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="md:w-[500px] justify-between text-gray-500"
        >
          {value
            ? existingSkills.find((skill) => skill === value) || value
            : "Select skill..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="md:w-[500px] p-0">
        <Command>
          <CommandInput 
          placeholder="Search skill..." 
          className="h-9"
          value={searchTerm}
          onValueChange={setSearchTerm} 
          />
          <CommandList>
            <CommandEmpty>
            <div className="flex flex-col gap-3 items-center">
                <p className="text-gray-600 text-sm text-center">
                    No results found. Add <span className="font-semibold text-gray-800">{searchTerm}</span> as a new skill?
                </p>
                <Button
                    onClick={handleSkillAdded}
                    className="flex items-center justify-center gap-2 bg-[#C5F4E5] text-[#2BA17C] text-sm w-full max-w-[200px] max-h-[30px]"
                >
                    <IoIosAdd className="w-5 h-5" />
                    <span>Add new skill: {searchTerm}</span>
                </Button>
            </div>
            </CommandEmpty>
            <CommandGroup>
              {existingSkills.map((skill, idx) => (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    </>
  )
}
export default SkillCombobox;
