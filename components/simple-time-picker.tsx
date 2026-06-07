/* eslint-disable */
/** biome-ignore-all lint: third-party component */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  format,
  setHours,
  startOfHour,
  endOfHour,
  setMinutes,
  startOfMinute,
  endOfMinute,
  setSeconds,
  startOfDay,
  endOfDay,
  addHours,
  subHours,
  setMilliseconds,
} from 'date-fns';

interface SimpleTimeOption {
  value: number;
  label: string;
  disabled?: boolean;
}

interface TimeParts {
  hour: number;
  minute: number;
  second: number;
  ampm: number;
}

const AM_VALUE = 0;
const PM_VALUE = 1;

/**
 * Shadcn Simple Time Picker — compact dropdown time picker for shadcn/ui.
 *
 * Live demo: https://shadcn-datetime-picker-pro.vercel.app/
 * Source:    https://github.com/huybuidac/shadcn-datetime-picker
 *
 * MIT licensed — feel free to copy, modify, and ship.
 */
export function SimpleTimePicker({
  value,
  onChange,
  use12HourFormat,
  min,
  max,
  disabled,
  modal,
  className,
  contentClassName,
  showSeconds = true,
  placeholder = 'Select time',
}: {
  use12HourFormat?: boolean;
  value?: Date;
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  showSeconds?: boolean;
  placeholder?: string;
  modal?: boolean;
}) {
  const fallbackDateRef = useRef<Date>(value ?? new Date());
  const selectedDate = value ?? fallbackDateRef.current;

  useEffect(() => {
    if (value) fallbackDateRef.current = value;
  }, [value]);

  const initialParts = useMemo(() => getTimeParts(selectedDate, use12HourFormat, showSeconds), []);

  const [ampm, setAmpm] = useState(initialParts.ampm);
  const [hour, setHour] = useState(initialParts.hour);
  const [minute, setMinute] = useState(initialParts.minute);
  const [second, setSecond] = useState(initialParts.second);
  const [open, setOpen] = useState(false);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextParts = getTimeParts(selectedDate, use12HourFormat, showSeconds);
    setAmpm(nextParts.ampm);
    setHour(nextParts.hour);
    setMinute(nextParts.minute);
    setSecond(nextParts.second);
  }, [selectedDate, use12HourFormat, showSeconds]);

  const _hourIn24h = useMemo(() => to24Hour(hour, ampm, use12HourFormat), [hour, use12HourFormat, ampm]);

  const commitTime = useCallback(
    (nextParts: Partial<TimeParts>) => {
      const timeParts = {
        hour,
        minute,
        second: showSeconds ? second : 0,
        ampm,
        ...nextParts,
      };

      const nextDate = clampDate(
        buildTime({
          value: selectedDate,
          use12HourFormat,
          hour: timeParts.hour,
          minute: timeParts.minute,
          second: showSeconds ? timeParts.second : 0,
          ampm: timeParts.ampm,
        }),
        min,
        max
      );

      const committedParts = getTimeParts(nextDate, use12HourFormat, showSeconds);
      setAmpm(committedParts.ampm);
      setHour(committedParts.hour);
      setMinute(committedParts.minute);
      setSecond(committedParts.second);
      onChange(nextDate);
    },
    [hour, minute, second, ampm, selectedDate, use12HourFormat, showSeconds, min, max, onChange]
  );

  const hours: SimpleTimeOption[] = useMemo(
    () =>
      Array.from({ length: use12HourFormat ? 12 : 24 }, (_, i) => {
        let disabled = false;
        const hourValue = use12HourFormat ? (i === 0 ? 12 : i) : i;
        const hDate = setHours(selectedDate, use12HourFormat ? i + ampm * 12 : i);
        const hStart = startOfHour(hDate);
        const hEnd = endOfHour(hDate);
        if (min && hEnd < min) disabled = true;
        if (max && hStart > max) disabled = true;
        return {
          value: hourValue,
          label: hourValue.toString().padStart(2, '0'),
          disabled,
        };
      }),
    [selectedDate, min, max, use12HourFormat, ampm]
  );

  const minutes: SimpleTimeOption[] = useMemo(() => {
    const anchorDate = setHours(selectedDate, _hourIn24h);
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false;
      const mDate = setMinutes(anchorDate, i);
      const mStart = startOfMinute(mDate);
      const mEnd = endOfMinute(mDate);
      if (min && mEnd < min) disabled = true;
      if (max && mStart > max) disabled = true;
      return {
        value: i,
        label: i.toString().padStart(2, '0'),
        disabled,
      };
    });
  }, [selectedDate, min, max, _hourIn24h]);

  const seconds: SimpleTimeOption[] = useMemo(() => {
    const anchorDate = setMilliseconds(setMinutes(setHours(selectedDate, _hourIn24h), minute), 0);
    const _min = min ? setMilliseconds(min, 0) : undefined;
    const _max = max ? setMilliseconds(max, 0) : undefined;
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false;
      const sDate = setSeconds(anchorDate, i);
      if (_min && sDate < _min) disabled = true;
      if (_max && sDate > _max) disabled = true;
      return {
        value: i,
        label: i.toString().padStart(2, '0'),
        disabled,
      };
    });
  }, [selectedDate, minute, min, max, _hourIn24h]);

  const ampmOptions = useMemo(() => {
    const startD = startOfDay(selectedDate);
    const endD = endOfDay(selectedDate);
    return [
      { value: AM_VALUE, label: 'AM' },
      { value: PM_VALUE, label: 'PM' },
    ].map((v) => {
      let disabled = false;
      const start = addHours(startD, v.value * 12);
      const end = subHours(endD, (1 - v.value) * 12);
      if (min && end < min) disabled = true;
      if (max && start > max) disabled = true;
      return { ...v, disabled };
    });
  }, [selectedDate, min, max]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (open) {
        hourRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
        minuteRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
        secondRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }, 1);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onNowClick = useCallback(() => {
    const now = new Date();
    const next = new Date(selectedDate);
    next.setHours(now.getHours(), now.getMinutes(), showSeconds ? now.getSeconds() : 0, 0);

    const clamped = clampDate(next, min, max);
    const nextParts = getTimeParts(clamped, use12HourFormat, showSeconds);
    setAmpm(nextParts.ampm);
    setHour(nextParts.hour);
    setMinute(nextParts.minute);
    setSecond(nextParts.second);
    onChange(clamped);
  }, [selectedDate, min, max, showSeconds, use12HourFormat, onChange]);

  const display = useMemo(() => {
    return value
      ? format(value, use12HourFormat ? (showSeconds ? 'hh:mm:ss a' : 'hh:mm a') : showSeconds ? 'HH:mm:ss' : 'HH:mm')
      : placeholder;
  }, [value, use12HourFormat, showSeconds, placeholder]);

  const contentWidthClass = use12HourFormat
    ? showSeconds
      ? 'w-[292px]'
      : 'w-[232px]'
    : showSeconds
      ? 'w-[232px]'
      : 'w-[172px]';

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-disabled={disabled}
          disabled={disabled}
          className={cn(
            'group flex h-10 min-w-[250px] items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm font-normal text-foreground shadow-sm transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <span className={cn('truncate tabular-nums', !value && 'text-muted-foreground')}>{display}</span>
          <Clock className="ml-3 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className={cn('overflow-hidden rounded-xl border bg-popover p-0 shadow-lg', contentWidthClass, contentClassName)}
      >
        <div className="flex h-56 border-b bg-popover">
          <TimeColumn options={hours} selectedValue={hour} selectedRef={hourRef} onSelect={(v) => commitTime({ hour: v.value })} />
          <TimeColumn options={minutes} selectedValue={minute} selectedRef={minuteRef} onSelect={(v) => commitTime({ minute: v.value })} />
          {showSeconds && (
            <TimeColumn options={seconds} selectedValue={second} selectedRef={secondRef} onSelect={(v) => commitTime({ second: v.value })} />
          )}
          {use12HourFormat && <TimeColumn options={ampmOptions} selectedValue={ampm} onSelect={(v) => commitTime({ ampm: v.value })} />}
        </div>

        <div className="flex h-12 items-center justify-between bg-popover px-3">
          <button
            type="button"
            className="rounded px-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onNowClick}
          >
            Now
          </button>
          <Button type="button" size="sm" className="h-8 px-3" onClick={() => setOpen(false)}>
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TimeColumn = ({
  options,
  selectedValue,
  selectedRef,
  onSelect,
}: {
  options: SimpleTimeOption[];
  selectedValue: number;
  selectedRef?: RefObject<HTMLDivElement>;
  onSelect: (option: SimpleTimeOption) => void;
}) => {
  return (
    <div className="min-w-0 flex-1 border-r border-border/70 last:border-r-0">
      <ScrollArea className="h-full [&_[data-radix-scroll-area-scrollbar]]:hidden">
        <div className="py-1">
          {options.map((option) => (
            <div ref={option.value === selectedValue ? selectedRef : undefined} key={option.value}>
              <TimeItem option={option} selected={option.value === selectedValue} onSelect={onSelect} disabled={option.disabled} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const TimeItem = ({
  option,
  selected,
  onSelect,
  disabled,
}: {
  option: SimpleTimeOption;
  selected: boolean;
  onSelect: (option: SimpleTimeOption) => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      className={cn(
        'flex h-9 w-full items-center justify-center rounded-none px-1 text-sm font-medium tabular-nums text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35',
        selected && 'bg-accent text-accent-foreground'
      )}
      onClick={() => onSelect(option)}
      disabled={disabled}
    >
      {option.label}
    </button>
  );
};

function getTimeParts(date: Date, use12HourFormat?: boolean, showSeconds = true): TimeParts {
  return {
    ampm: format(date, 'a') === 'AM' ? AM_VALUE : PM_VALUE,
    hour: use12HourFormat ? +format(date, 'hh') : date.getHours(),
    minute: date.getMinutes(),
    second: showSeconds ? date.getSeconds() : 0,
  };
}

function to24Hour(hour: number, ampm: number, use12HourFormat?: boolean) {
  return use12HourFormat ? (hour % 12) + ampm * 12 : hour;
}

function buildTime({
  value,
  use12HourFormat,
  hour,
  minute,
  second,
  ampm,
}: {
  value: Date;
  use12HourFormat?: boolean;
  hour: number;
  minute: number;
  second: number;
  ampm: number;
}) {
  return setHours(setMinutes(setSeconds(setMilliseconds(value, 0), second), minute), to24Hour(hour, ampm, use12HourFormat));
}

function clampDate(date: Date, min?: Date, max?: Date) {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}
