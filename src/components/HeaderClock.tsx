import React, { useState, useEffect, memo } from 'react';

interface HeaderClockProps {
  clockFormat?: '12' | '24';
  timezone?: string;
  visible: boolean;
}

export const HeaderClock = memo(function HeaderClock({ clockFormat = '12', timezone, visible }: HeaderClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();

  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      });
      const parts = formatter.formatToParts(time);
      const hPart = parts.find(p => p.type === 'hour');
      const mPart = parts.find(p => p.type === 'minute');
      const sPart = parts.find(p => p.type === 'second');
      if (hPart) hours = parseInt(hPart.value, 10);
      if (mPart) minutes = parseInt(mPart.value, 10);
      if (sPart) seconds = parseInt(sPart.value, 10);
    } catch (e) {
      console.warn("Invalid timezone or failed to format: ", timezone, e);
    }
  }
  
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  let displayHours = hours;
  let ampm = '';

  if (clockFormat === '12') {
    ampm = hours >= 12 ? 'PM' : 'AM';
    displayHours = hours % 12;
    displayHours = displayHours ? displayHours : 12; // the hour '0' should be '12'
  }

  const formattedHours = clockFormat === '24' 
    ? (displayHours < 10 ? `0${displayHours}` : displayHours)
    : displayHours;

  return (
    <div 
      id="header-clock"
      className={`hidden sm:flex items-center gap-1.5 bg-accent/10 border border-border/40 backdrop-blur-md px-3 py-1.5 rounded-2xl select-none shadow-sm transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu will-change-[transform,opacity] ${
        visible 
          ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' 
          : 'opacity-0 scale-95 translate-x-3 pointer-events-none'
      }`}
      title={`Current System Time (${timezone || 'Local'})`}
    >
      <div className="flex items-baseline font-sans">
        <span className="text-base md:text-lg font-extrabold tracking-tight text-foreground drop-shadow-sm leading-none">
          {formattedHours}
          <span className={`mx-0.5 transition-opacity duration-500 ${seconds % 2 === 0 ? 'opacity-100' : 'opacity-40'}`}>:</span>
          {formattedMinutes}
        </span>
        {clockFormat === '12' ? (
          <span className="text-[9px] font-black tracking-widest text-muted-foreground/80 ml-0.5 select-none uppercase self-start relative top-[-4px]">
            {ampm}
          </span>
        ) : (
          <span className="text-[7.5px] font-bold tracking-wider text-muted-foreground/60 ml-1.5 uppercase select-none self-start relative top-[-3px] bg-accent/30 px-1 py-0.2 rounded-md">
            24H
          </span>
        )}
      </div>
    </div>
  );
});

export default HeaderClock;
