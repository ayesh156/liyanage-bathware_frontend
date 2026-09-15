import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  isWithinInterval, parseISO 
} from 'date-fns';
import { DateRange } from 'react-day-picker';

interface CustomCalendarProps {
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
  onClose?: () => void;
  isDark?: boolean;
}

export const Calendar: React.FC<CustomCalendarProps> = ({
  selected,
  onSelect,
  onClose,
  isDark = true,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [range, setRange] = useState<DateRange | undefined>(selected);

  const handleDateClick = (day: Date) => {
    let newRange: DateRange | undefined;

    if (!range || (range.from && range.to)) {
      newRange = { from: day, to: undefined };
    } else if (range.from && !range.to) {
      if (day < range.from) {
        newRange = { from: day, to: undefined };
      } else {
        newRange = { from: range.from, to: day };
      }
    }

    setRange(newRange);
    if (onSelect) onSelect(newRange);
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <div className="w-[260px] p-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold">{format(monthDate, 'MMMM yyyy')}</span>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map((d) => (
            <span key={d} className="text-[10px] font-semibold text-slate-400">
              {d}
            </span>
          ))}
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, idx) => {
            const isSelectedFrom = range?.from && isSameDay(d, range.from);
            const isSelectedTo = range?.to && isSameDay(d, range.to);
            const isInRange =
              range?.from && range?.to && isWithinInterval(d, { start: range.from, end: range.to });
            const isCurrentMonth = isSameMonth(d, monthDate);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateClick(d)}
                className={`h-8 w-8 text-xs font-medium rounded-lg transition-all flex items-center justify-center ${
                  !isCurrentMonth ? 'text-slate-600 opacity-30' : ''
                } ${
                  isSelectedFrom || isSelectedTo
                    ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/30'
                    : isInRange
                    ? 'bg-orange-500/20 text-orange-300 rounded-none'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-200'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {format(d, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`p-3 rounded-2xl select-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Top Controls */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/40">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-orange-400">
          {range?.from ? format(range.from, 'MMM dd, yyyy') : 'Start'} 
          {' ~ '} 
          {range?.to ? format(range.to, 'MMM dd, yyyy') : 'End'}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Months Display */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
        {renderMonth(currentMonth)}
      </div>

      {/* Footer Controls */}
<div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-700/40">
  <button
    type="button"
    onClick={() => {
      setRange(undefined);
      if (onSelect) onSelect(undefined);
    }}
    className="px-2 py-1 text-xs text-rose-400 hover:underline"
  >
    Clear
  </button>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onClose}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        isDark 
          ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
          : 'border-slate-300 text-slate-600 hover:bg-slate-100'
      }`}
    >
      Cancel
    </button>
    
    <button
      type="button"
      onClick={onClose}
      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
    >
      Done
    </button>
  </div>
</div>
    </div>
  );
};