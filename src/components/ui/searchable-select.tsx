import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  theme?: 'light' | 'dark';
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  triggerClassName,
  disabled = false,
  theme = 'light',
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedOption = options.find((option) => option.value === value);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10",
            theme === 'dark' 
              ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white" 
              : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:text-slate-900",
            !value && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.label}
                {selectedOption.count !== undefined && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                  )}>
                    {selectedOption.count}
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[--radix-popover-trigger-width] p-0",
          theme === 'dark' ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white",
          className
        )}
        align="start"
      >
        <Command className={theme === 'dark' ? "bg-slate-800" : "bg-white"} shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className={cn(
              theme === 'dark' ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"
            )}
          />
          <CommandList className={theme === 'dark' ? "text-white" : "text-slate-900"}>
            <CommandEmpty className={theme === 'dark' ? "text-slate-400" : "text-slate-500"}>
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "cursor-pointer",
                    theme === 'dark' 
                      ? "text-slate-200 hover:bg-slate-700 hover:text-white data-[selected=true]:bg-slate-700 data-[selected=true]:text-white aria-selected:bg-slate-700 aria-selected:text-white" 
                      : "text-slate-900 hover:bg-slate-100 hover:text-slate-900 data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900 aria-selected:bg-slate-100 aria-selected:text-slate-900"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex items-center gap-2 flex-1">
                    {option.icon}
                    {option.label}
                  </span>
                  {option.count !== undefined && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full ml-auto",
                      theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
                    )}>
                      {option.count}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
