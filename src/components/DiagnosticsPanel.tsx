import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldAlert, ShieldCheck, Monitor, Globe, MapPin, Cpu, Clock, 
  Battery, BatteryCharging, Zap, RefreshCw, Terminal, Compass, Info, Map
} from 'lucide-react';

interface DiagnosticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'glass' | 'slate' | 'cyber' | 'light';
}

interface NetworkInfo {
  ipv4: string;
  ipv6: string;
  isp: string;
  asn: string;
  country: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  loading: boolean;
  error?: string;
}

interface GPSInfo {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  resolvedAddress: string | null;
  loading: boolean;
  error: string | null;
}

interface DeviceSpecs {
  os: string;
  browser: string;
  userAgent: string;
  screenResolution: string;
  windowSize: string;
  cores: string;
  memory: string;
  batteryLevel: number | null;
  isCharging: boolean | null;
  timezone: string;
  currentTime: string;
}

export default function DiagnosticsPanel({ isOpen, onClose, theme }: DiagnosticsPanelProps) {
  const [network, setNetwork] = useState<NetworkInfo>({
    ipv4: 'Detecting...',
    ipv6: 'Probing network...',
    isp: 'Loading...',
    asn: '...',
    country: '...',
    region: '...',
    city: '...',
    zip: '...',
    lat: 0,
    lng: 0,
    loading: true
  });

  const [gps, setGps] = useState<GPSInfo>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    resolvedAddress: null,
    loading: false,
    error: null
  });

  const [specs, setSpecs] = useState<DeviceSpecs>({
    os: 'Detecting...',
    browser: 'Detecting...',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    screenResolution: 'Detecting...',
    windowSize: 'Detecting...',
    cores: 'Detecting...',
    memory: 'Detecting...',
    batteryLevel: null,
    isCharging: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currentTime: ''
  });

  const [logs, setLogs] = useState<Array<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }>>([]);
  const [activeTab, setActiveTab] = useState<'network' | 'device' | 'gps'>('network');

  // Add terminal logs
  const logEvent = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [
      { id: Math.random().toString(36).substring(2, 9), time, msg, type },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  // Dynamic Time Ticker
  useEffect(() => {
    const updateTime = () => {
      setSpecs(prev => ({
        ...prev,
        currentTime: new Date().toLocaleTimeString()
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse User Agent & Fetch Initial Device Details
  useEffect(() => {
    if (typeof window === 'undefined') return;

    logEvent('Initializing diagnostics console...', 'info');

    // Parse OS & Browser
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    if (ua.indexOf('Win') !== -1) os = 'Windows OS';
    else if (ua.indexOf('Mac') !== -1) os = 'macOS';
    else if (ua.indexOf('X11') !== -1) os = 'UNIX';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    else if (ua.indexOf('Android') !== -1) os = 'Android';
    else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'iOS';

    if (ua.indexOf('Chrome') !== -1) browser = 'Google Chrome';
    else if (ua.indexOf('Safari') !== -1) browser = 'Apple Safari';
    else if (ua.indexOf('Firefox') !== -1) browser = 'Mozilla Firefox';
    else if (ua.indexOf('MSIE') !== -1 || !!(document as any).documentMode) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') !== -1) browser = 'Microsoft Edge';

    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const winSize = `${window.innerWidth}x${window.innerHeight}`;
    const coresCount = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'Unknown';
    const ram = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unavailable';

    setSpecs(prev => ({
      ...prev,
      os,
      browser,
      screenResolution: screenRes,
      windowSize: winSize,
      cores: coresCount,
      memory: ram
    }));

    logEvent(`Hardware audited: ${coresCount} / ${ram} RAM detected`, 'success');
    logEvent(`OS: ${os} | Browser: ${browser}`, 'info');

    // Setup Battery Listener
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryInfo = () => {
          setSpecs(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging
          }));
          logEvent(`Battery level updated: ${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Discharging'})`, 'info');
        };
        updateBatteryInfo();
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
      });
    } else {
      logEvent('HTML5 Battery API not supported by client browser', 'warn');
    }

    // Dynamic Viewport Resize Tracker
    const handleResize = () => {
      setSpecs(prev => ({
        ...prev,
        windowSize: `${window.innerWidth}x${window.innerHeight}`
      }));
    };
    window.addEventListener('resize', handleResize);

    // Initial Probe
    probeNetwork();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch Network Data (IPv4, IPv6, Geolocation)
  const probeNetwork = async () => {
    setNetwork(prev => ({ ...prev, loading: true }));
    logEvent('Probing IPv4 and IPv6 dual-stack interfaces...', 'info');

    let ipv4Str = 'Unavailable';
    let ipv6Str = 'Unavailable / No route';
    let ispStr = 'Detecting...';
    let countryStr = '';
    let regionStr = '';
    let cityStr = '';
    let zipStr = '';
    let latVal = 0;
    let lngVal = 0;
    let asnStr = 'Unknown';

    // 1. Fetch IPv4 from ipify
    try {
      const v4Res = await fetch('https://api.ipify.org?format=json');
      if (v4Res.ok) {
        const data = await v4Res.json();
        ipv4Str = data.ip || 'Unavailable';
        logEvent(`IPv4 interface resolved: ${ipv4Str}`, 'success');
      }
    } catch (e) {
      logEvent('IPv4 interface probe timed out or blocked by CORS', 'warn');
    }

    // 2. Fetch IPv6 from ipify6
    try {
      const v6Res = await fetch('https://api6.ipify.org?format=json');
      if (v6Res.ok) {
        const data = await v6Res.json();
        const detectedIp = data.ip || '';
        // If it contains colons, it is a valid IPv6 address
        if (detectedIp.includes(':')) {
          ipv6Str = detectedIp;
          logEvent(`IPv6 interface resolved: ${ipv6Str}`, 'success');
        } else {
          // If ipify6 falls back to v4
          if (ipv4Str === 'Unavailable') {
            ipv4Str = detectedIp;
          }
        }
      }
    } catch (e) {
      logEvent('IPv6 route probe complete (No native IPv6 route detected)', 'info');
    }

    // 3. Geolocation using ipapi.co (provides rich ASN/ISP detail)
    try {
      const geoRes = await fetch('https://ipapi.co/json/');
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        ispStr = geoData.org || geoData.asn || 'Unknown ISP';
        asnStr = geoData.asn || 'Unknown';
        countryStr = geoData.country_name || 'Unknown Country';
        regionStr = geoData.region || '';
        cityStr = geoData.city || 'Unknown';
        zipStr = geoData.postal || '';
        latVal = geoData.latitude || 0;
        lngVal = geoData.longitude || 0;

        if (ipv4Str === 'Unavailable' && geoData.ip) {
          if (!geoData.ip.includes(':')) ipv4Str = geoData.ip;
          else ipv6Str = geoData.ip;
        }

        logEvent(`IP Geolocation: Located in ${cityStr}, ${countryStr} (ISP: ${ispStr})`, 'success');
      } else {
        throw new Error('IP Geolocation API failed');
      }
    } catch (e) {
      logEvent('IP Geolocation lookup failed. Using fallback API...', 'warn');
      // Fallback Geo using ip-api.com
      try {
        const fallbackGeo = await fetch('https://ip-api.com/json/');
        if (fallbackGeo.ok) {
          const fbData = await fallbackGeo.json();
          ispStr = fbData.isp || fbData.as || 'Unknown';
          countryStr = fbData.country || '';
          regionStr = fbData.regionName || '';
          cityStr = fbData.city || '';
          zipStr = fbData.zip || '';
          latVal = fbData.lat || 0;
          lngVal = fbData.lon || 0;
          logEvent(`Fallback IP Geolocation: Located in ${cityStr}, ${countryStr}`, 'success');
        }
      } catch {
        logEvent('All geolocation API endpoints exhausted', 'error');
      }
    }

    setNetwork({
      ipv4: ipv4Str,
      ipv6: ipv6Str,
      isp: ispStr,
      asn: asnStr,
      country: countryStr,
      region: regionStr,
      city: cityStr,
      zip: zipStr,
      lat: latVal,
      lng: lngVal,
      loading: false
    });

    setGps({
      latitude: latVal || null,
      longitude: lngVal || null,
      accuracy: latVal ? 15000 : null, // Approx ISP geolocation accuracy in meters
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      resolvedAddress: cityStr && countryStr ? `${cityStr}, ${regionStr ? regionStr + ', ' : ''}${countryStr} ${zipStr ? '(' + zipStr + ')' : ''}`.trim() : 'IP geolocation unresolved',
      loading: false,
      error: latVal ? null : 'Auto-IP location unavailable'
    });
  };

  // Trigger browser-based precise IP location refresh
  const requestGPSPrecision = () => {
    logEvent('Refreshing IP-based coordinate sockets...', 'info');
    probeNetwork();
  };

  // Color mappings
  const themeColors = {
    glass: {
      panelBg: 'bg-[#0b0c1b]/95 backdrop-blur-2xl border-l border-white/10',
      textMain: 'text-slate-100',
      textMuted: 'text-slate-400',
      cardBg: 'bg-[#161932]/80 border border-white/5',
      accentText: 'text-indigo-400',
      tabActive: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      tabInactive: 'hover:bg-white/5 text-slate-400',
    },
    slate: {
      panelBg: 'bg-[#080a15]/95 backdrop-blur-2xl border-l border-cyan-500/20',
      textMain: 'text-slate-100',
      textMuted: 'text-slate-400',
      cardBg: 'bg-[#0e122b]/90 border border-cyan-500/10',
      accentText: 'text-cyan-400',
      tabActive: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      tabInactive: 'hover:bg-cyan-500/5 text-slate-400',
    },
    cyber: {
      panelBg: 'bg-[#020704]/98 backdrop-blur-2xl border-l border-emerald-500/30',
      textMain: 'text-emerald-100',
      textMuted: 'text-emerald-500/70',
      cardBg: 'bg-[#030f08]/95 border border-emerald-500/20',
      accentText: 'text-emerald-400',
      tabActive: 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40',
      tabInactive: 'hover:bg-emerald-500/5 text-emerald-500/60',
    },
    light: {
      panelBg: 'bg-white/95 backdrop-blur-2xl border-l border-rose-100 shadow-2xl',
      textMain: 'text-slate-900',
      textMuted: 'text-slate-500',
      cardBg: 'bg-slate-50 border border-slate-100',
      accentText: 'text-indigo-600',
      tabActive: 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold',
      tabInactive: 'hover:bg-slate-100 text-slate-600',
    }
  };

  const colors = themeColors[theme] || themeColors.glass;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Glass Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] cursor-pointer"
          />

          {/* Right Sliding Diagnostic Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className={`fixed right-0 top-0 bottom-0 w-full max-w-lg z-[201] flex flex-col overflow-hidden h-full ${colors.panelBg}`}
          >
            {/* Header */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold font-sans tracking-tight">Active Diagnostics Console</h2>
                  <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SECURE SECURE_SSL CHANNEL_CONNECTED
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-accent/25 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Banner */}
            <div className={`mx-6 mt-6 p-4 rounded-2xl flex items-center justify-between select-none ${colors.cardBg}`}>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Session Security Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Client Authenticated</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono rounded">SSL</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-bold leading-none">{specs.currentTime}</p>
                <p className="text-[9px] text-muted-foreground mt-1 font-mono uppercase">{specs.timezone?.split('/').pop()?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="px-6 mt-5 flex gap-2 select-none shrink-0">
              {[
                { id: 'network', label: 'Network & IP', icon: Globe },
                { id: 'device', label: 'Specs & Device', icon: Monitor },
                { id: 'gps', label: 'Geo IP Location', icon: MapPin },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
                      isActive ? colors.tabActive : colors.tabInactive
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel Body Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeTab === 'network' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground select-none">ISP & Network Parameters</h3>
                    <button
                      onClick={probeNetwork}
                      disabled={network.loading}
                      className="p-1 rounded-lg hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center gap-1.5 text-[10px]"
                      title="Reprobe network sockets"
                    >
                      <RefreshCw className={`w-3 h-3 ${network.loading ? 'animate-spin' : ''}`} />
                      Probe Sockets
                    </button>
                  </div>

                  {/* Dual-Stack IP Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl ${colors.cardBg}`}>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1 select-none">
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-mono uppercase tracking-wider">IPv4 Address</span>
                      </div>
                      <p className="text-sm font-mono font-bold tracking-tight select-all truncate">
                        {network.ipv4}
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl ${colors.cardBg}`}>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1 select-none">
                        <Globe className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-[10px] font-mono uppercase tracking-wider">IPv6 Address</span>
                      </div>
                      <p className="text-sm font-mono font-bold tracking-tight select-all truncate" title={network.ipv6}>
                        {network.ipv6}
                      </p>
                    </div>
                  </div>

                  {/* Provider & Geo details */}
                  <div className={`p-4 rounded-2xl space-y-3.5 ${colors.cardBg}`}>
                    <div className="flex justify-between items-start border-b border-white/[0.04] pb-2.5">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">Service Provider (ISP)</p>
                        <p className="text-sm font-bold mt-0.5">{network.isp}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">ASN</p>
                        <p className="text-xs font-mono font-bold text-accent/90 mt-0.5">{network.asn}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">Country</p>
                        <p className="text-xs font-bold mt-0.5 truncate">{network.country || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">State / Region</p>
                        <p className="text-xs font-bold mt-0.5 truncate">{network.region || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">City / Suburb</p>
                        <p className="text-xs font-bold mt-0.5 truncate">{network.city || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">Postal Zip Code</p>
                        <p className="text-xs font-mono font-bold mt-0.5 truncate">{network.zip || 'Unknown'}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.04] pt-2.5 grid grid-cols-2 gap-1 select-none">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">IP Latitude</p>
                        <p className="text-xs font-mono mt-0.5">{network.lat ? network.lat.toFixed(5) : 'Unavailable'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">IP Longitude</p>
                        <p className="text-xs font-mono mt-0.5">{network.lng ? network.lng.toFixed(5) : 'Unavailable'}</p>
                      </div>
                    </div>
                  </div>

                  {network.lat !== 0 && (
                    <div className="pt-2 select-none">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${network.lat},${network.lng}`}
                        target="_blank" 
                        referrerPolicy="no-referrer"
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-xl transition-all"
                      >
                        <Map className="w-4 h-4" /> View IP Location on Google Maps
                      </a>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'device' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground select-none">Device Configuration Audit</h3>

                  {/* Core specs cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl ${colors.cardBg}`}>
                      <p className="text-[9px] text-muted-foreground uppercase font-mono mb-1 select-none">Operating System</p>
                      <p className="text-sm font-bold truncate">{specs.os}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${colors.cardBg}`}>
                      <p className="text-[9px] text-muted-foreground uppercase font-mono mb-1 select-none">Web Browser</p>
                      <p className="text-sm font-bold truncate">{specs.browser}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${colors.cardBg}`}>
                      <p className="text-[9px] text-muted-foreground uppercase font-mono mb-1 select-none">Cores (Threads)</p>
                      <p className="text-sm font-mono font-bold">{specs.cores}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${colors.cardBg}`}>
                      <p className="text-[9px] text-muted-foreground uppercase font-mono mb-1 select-none">System Memory</p>
                      <p className="text-sm font-mono font-bold">{specs.memory}</p>
                    </div>
                  </div>

                  {/* Battery Widget */}
                  {specs.batteryLevel !== null && (
                    <div className={`p-4 rounded-2xl flex items-center justify-between ${colors.cardBg}`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {specs.isCharging ? (
                            <BatteryCharging className="w-5 h-5 text-emerald-400 animate-pulse" />
                          ) : (
                            <Battery className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono select-none">Client Power Source</p>
                          <p className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                            {specs.batteryLevel}% Charge
                            {specs.isCharging && (
                              <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-0.5">
                                <Zap className="w-3 h-3 fill-current" /> Charging
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-24 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 select-none">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            specs.batteryLevel < 20 ? 'bg-rose-500' :
                            specs.batteryLevel < 50 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${specs.batteryLevel}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Display Metrics card */}
                  <div className={`p-4 rounded-2xl space-y-3.5 ${colors.cardBg}`}>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground select-none">Display & Window Geometry</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">Hardware Resolution</p>
                        <p className="text-xs font-mono font-bold mt-0.5">{specs.screenResolution}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-mono">Viewport Boundary</p>
                        <p className="text-xs font-mono font-bold mt-0.5">{specs.windowSize}</p>
                      </div>
                    </div>
                  </div>

                  {/* Full raw User Agent details */}
                  <div className={`p-4 rounded-2xl space-y-1.5 ${colors.cardBg}`}>
                    <p className="text-[9px] text-muted-foreground uppercase font-mono select-none">Raw Diagnostic User-Agent String</p>
                    <p className="text-[11px] font-mono leading-relaxed break-all select-all text-muted-foreground/90">
                      {specs.userAgent}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'gps' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between select-none">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Auto IP Geolocation Node</h3>
                    <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded font-mono uppercase font-extrabold">WGS84 (IP)</span>
                  </div>

                  <div className={`p-6 rounded-2xl text-center flex flex-col items-center justify-center relative overflow-hidden select-none ${colors.cardBg}`}>
                    {/* Animated High Tech Radar Scan Visual */}
                    <div className="w-24 h-24 rounded-full border border-indigo-500/20 relative flex items-center justify-center mb-4">
                      <div className="absolute inset-0 rounded-full bg-indigo-500/5 animate-pulse" />
                      {gps.loading ? (
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                      ) : (
                        <div className="absolute inset-1.5 rounded-full border border-dashed border-indigo-500/10 animate-[spin_30s_linear_infinite]" />
                      )}
                      
                      {/* Scanning sweeping arm */}
                      <div className="absolute inset-0 rounded-full border border-indigo-500/30 overflow-hidden">
                        <div className="absolute w-1/2 h-1/2 bg-gradient-to-tr from-indigo-500/20 to-transparent origin-bottom-right animate-[spin_3s_linear_infinite]" style={{ bottom: '50%', right: '50%' }} />
                      </div>

                      <Compass className={`w-8 h-8 ${gps.loading ? 'text-indigo-400 animate-pulse' : gps.latitude ? 'text-emerald-400' : 'text-indigo-400'}`} />
                    </div>

                    {gps.loading ? (
                      <div className="space-y-3 max-w-sm">
                        <p className="text-xs font-mono text-indigo-400 animate-pulse">Resolving location through dual-stack IP sockets...</p>
                        <p className="text-[10px] text-muted-foreground">Please wait while we audit routing nodes.</p>
                      </div>
                    ) : !gps.latitude ? (
                      <div className="space-y-3.5 max-w-sm">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          IP Geolocation could not resolve coordinates automatically.
                        </p>
                        <button
                          onClick={probeNetwork}
                          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" /> Retry Auto-Detection
                        </button>
                      </div>
                    ) : (
                      <div className="w-full space-y-4 text-left select-all">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] text-muted-foreground uppercase font-mono">IP Latitude</p>
                            <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{gps.latitude.toFixed(6)}°</p>
                          </div>
                          <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] text-muted-foreground uppercase font-mono">IP Longitude</p>
                            <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{gps.longitude.toFixed(6)}°</p>
                          </div>
                        </div>

                        {gps.accuracy !== null && (
                          <div className="flex items-center justify-between text-xs font-mono border-b border-white/[0.04] pb-2 text-muted-foreground">
                            <span>Resolution Estimate:</span>
                            <span className="text-emerald-400 font-bold">~{Math.round(gps.accuracy / 1000)} km (City Level)</span>
                          </div>
                        )}

                        {gps.resolvedAddress && (
                          <div className="space-y-1 bg-slate-900/50 p-3.5 rounded-xl border border-white/5">
                            <p className="text-[9px] text-muted-foreground uppercase font-mono">Detected Human Address (IP Bound)</p>
                            <p className="text-xs leading-relaxed font-semibold text-slate-100 select-all">
                              {gps.resolvedAddress}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1 select-none">
                          <button
                            onClick={probeNetwork}
                            disabled={gps.loading}
                            className="flex-1 py-2.5 px-3 bg-accent/20 hover:bg-accent/35 text-xs font-bold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${gps.loading ? 'animate-spin' : ''}`} /> Recalculate Node
                          </button>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`}
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            className="flex-1 py-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-400 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            <Map className="w-3.5 h-3.5" /> View on Google Maps
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* High-Tech Diagnostic Terminal Log (Collapsible/Fixed footer console) */}
            <div className="bg-slate-950 border-t border-white/10 shrink-0 select-none flex flex-col h-44 font-mono">
              <div className="px-4 py-2 bg-slate-900/90 border-b border-white/5 flex items-center justify-between shrink-0 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Local System Activity log
                </span>
                <span className="text-[9px] px-1 bg-white/10 rounded">LIVE</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 text-[11px] font-mono leading-relaxed select-text">
                {logs.length === 0 ? (
                  <p className="text-slate-600 italic">Listening for diagnostic events...</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="flex gap-2">
                      <span className="text-slate-500 shrink-0">[{log.time}]</span>
                      <span className={
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'warn' ? 'text-amber-400' :
                        log.type === 'error' ? 'text-rose-400' :
                        'text-slate-300'
                      }>
                        {log.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
