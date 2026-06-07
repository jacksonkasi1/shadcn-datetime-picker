/* eslint-disable */
/** biome-ignore-all lint: third-party component */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  format,
  parse,
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
  value: Date;
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
  // hours24h = HH
  // hours12h = hh
  const formatStr = useMemo(
    () => (use12HourFormat ? 'yyyy-MM-dd hh:mm:ss.SSS a xxxx' : 'yyyy-MM-dd HH:mm:ss.SSS xxxx'),
    [use12HourFormat]
  );
  const [ampm, setAmpm] = useState(format(value, 'a') === 'AM' ? AM_VALUE : PM_VALUE);
  const [hour, setHour] = useState(use12HourFormat ? +format(value, 'hh') : value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  const [second, setSecond] = useState(value.getSeconds());

  useEffect(() => {
    setAmpm(format(value, 'a') === 'AM' ? AM_VALUE : PM_VALUE);
    setHour(use12HourFormat ? +format(value, 'hh') : value.getHours());
    setMinute(value.getMinutes());
    setSecond(showSeconds ? value.getSeconds() : 0);
  }, [value, use12HourFormat, showSeconds]);

  useEffect(() => {
    onChange(buildTime({ use12HourFormat, value, formatStr, hour, minute, second: showSeconds ? second : 0, ampm }));
  }, [hour, minute, second, ampm, formatStr, use12HourFormat, showSeconds]);

  const _hourIn24h = useMemo(() => {
    return use12HourFormat ? (hour % 12) + ampm * 12 : hour;
  }, [hour, use12HourFormat, ampm]);

  const hours: SimpleTimeOption[] = useMemo(
    () =>
      Array.from({ length: use12HourFormat ? 12 : 24 }, (_, i) => {
        let disabled = false;
        const hourValue = use12HourFormat ? (i === 0 ? 12 : i) : i;
        const hDate = setHours(value, use12HourFormat ? i + ampm * 12 : i);
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
    [value, min, max, use12HourFormat, ampm]
  );
  const minutes: SimpleTimeOption[] = useMemo(() => {
    const anchorDate = setHours(value, _hourIn24h);
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
  }, [value, min, max, _hourIn24h]);
  const seconds: SimpleTimeOption[] = useMemo(() => {
    const anchorDate = setMilliseconds(setMinutes(setHours(value, _hourIn24h), minute), 0);
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
  }, [value, minute, min, max, _hourIn24h]);
  const ampmOptions = useMemo(() => {
    const startD = startOfDay(value);
    const endD = endOfDay(value);
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
  }, [value, min, max]);

  const [open, setOpen] = useState(false);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

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
  const onHourChange = useCallback(
    (v: SimpleTimeOption) => {
      if (min) {
        let newTime = buildTime({ use12HourFormat, value, formatStr, hour: v.value, minute, second, ampm });
        if (newTime < min) {
          setMinute(min.getMinutes());
          setSecond(showSeconds ? min.getSeconds() : 0);
        }
      }
      if (max) {
        let newTime = buildTime({ use12HourFormat, value, formatStr, hour: v.value, minute, second, ampm });
        if (newTime > max) {
          setMinute(max.getMinutes());
          setSecond(showSeconds ? max.getSeconds() : 0);
        }
      }
      setHour(v.value);
    },
    [use12HourFormat, value, formatStr, minute, second, ampm, min, max, showSeconds]
  );

  const onMinuteChange = useCallback(
    (v: SimpleTimeOption) => {
      if (min) {
        let newTime = buildTime({ use12HourFormat, value, formatStr, hour, minute: v.value, second, ampm });
        if (newTime < min) {
          setSecond(showSeconds ? min.getSeconds() : 0);
        }
      }
      if (max) {
        let newTime = buildTime({ use12HourFormat, value, formatStr, hour, minute: v.value, second, ampm });
        if (newTime > max) {
          setSecond(showSeconds ? max.getSeconds() : 0);
        }
      }
      setMinute(v.value);
    },
    [use12HourFormat, value, formatStr, hour, second, ampm, min, max, showSeconds]
  );

  const onAmpmChange = useCallback(
    (v: SimpleTimeOption) => {
      if (min) {
        let newTime = buildTime({ use12HourFormat, value, formatStr, hour, minute, second, ampm: v.value });
        if (newTime < min) {
          const minH = min.getHours() % 12;
          setHour(minH === 0 ? 12 : minH);
          setMinute(min.getMinutes());
          setSecond(showSeconds ? min.getSeconds() : 0);
        }
      }
      if (max) {
        let newTime = buildTime({ use12HourFormat, value, formatStr, hour, minute, second, ampm: v.value });
        if (newTime > max) {
          const maxH = max.getHours() % 12;
          setHour(maxH === 0 ? 12 : maxH);
          setMinute(max.getMinutes());
          setSecond(showSeconds ? max.getSeconds() : 0);
        }
      }
      setAmpm(v.value);
    },
    [use12HourFormat, value, formatStr, hour, minute, second, min, max, showSeconds]
  );

  const onNowClick = useCallback(() => {
    const now = new Date();
    const next = new Date(value);
    next.setHours(now.getHours(), now.getMinutes(), showSeconds ? now.getSeconds() : 0, 0);

    const clamped = min && next < min ? min : max && next > max ? max : next;
    setAmpm(format(clamped, 'a') === 'AM' ? AM_VALUE : PM_VALUE);
    setHour(use12HourFormat ? +format(clamped, 'hh') : clamped.getHours());
    setMinute(clamped.getMinutes());
    setSecond(showSeconds ? clamped.getSeconds() : 0);
  }, [value, min, max, showSeconds, use12HourFormat]);

  const display = useMemo(() => {
    return format(
      value,
      use12HourFormat ? (showSeconds ? 'hh:mm:ss a' : 'hh:mm a') : showSeconds ? 'HH:mm:ss' : 'HH:mm'
    );
  }, [value, use12HourFormat, showSeconds]);

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
          <span className={cn('truncate tabular-nums', !value && 'text-muted-foreground')}>{value ? display : placeholder}</span>
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
          <TimeColumn options={hours} selectedValue={hour} selectedRef={hourRef} onSelect={onHourChange} />
          <TimeColumn options={minutes} selectedValue={minute} selectedRef={minuteRef} onSelect={onMinuteChange} />
          {showSeconds && (
            <TimeColumn options={seconds} selectedValue={second} selectedRef={secondRef} onSelect={(v) => setSecond(v.value)} />
          )}
          {use12HourFormat && <TimeColumn options={ampmOptions} selectedValue={ampm} onSelect={onAmpmChange} />}
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
  selectedRef?: React.RefObject<HTMLDivElement>;
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

interface BuildTimeOptions {
  use12HourFormat?: boolean;
  value: Date;
  formatStr: string;
  hour: number;
  minute: number;
  second: number;
  ampm: number;
}

function buildTime(options: BuildTimeOptions) {
  const { use12HourFormat, value, formatStr, hour, minute, second, ampm } = options;
  let date: Date;
  if (use12HourFormat) {
    const dateStrRaw = format(value, formatStr);
    // yyyy-MM-dd hh:mm:ss.SSS a zzzz
    // 2024-10-14 01:20:07.524 AM GMT+00:00
    let dateStr = dateStrRaw.slice(0, 11) + hour.toString().padStart(2, '0') + dateStrRaw.slice(13);
    dateStr = dateStr.slice(0, 14) + minute.toString().padStart(2, '0') + dateStr.slice(16);
    dateStr = dateStr.slice(0, 17) + second.toString().padStart(2, '0') + dateStr.slice(19);
    dateStr = dateStr.slice(0, 24) + (ampm == AM_VALUE ? 'AM' : 'PM') + dateStr.slice(26);
    date = parse(dateStr, formatStr, value);
  } else {
    date = setHours(setMinutes(setSeconds(setMilliseconds(value, 0), second), minute), hour);
  }
  return date;
}
