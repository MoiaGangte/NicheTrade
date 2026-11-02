import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEVICES = {
  iphone15: {
    name: 'iPhone 15 Pro',
    platform: 'ios',
    width: 393,
    height: 852,
    bezelRadius: 'rounded-[50px]',
    screenRadius: 'rounded-[40px]',
    hasDynamicIsland: true,
  },
  pixel8: {
    name: 'Google Pixel 8',
    platform: 'android',
    width: 412,
    height: 915,
    bezelRadius: 'rounded-[44px]',
    screenRadius: 'rounded-[32px]',
    hasDynamicIsland: false,
  },
  galaxyS24: {
    name: 'Samsung Galaxy S24',
    platform: 'android',
    width: 360,
    height: 780,
    bezelRadius: 'rounded-[42px]',
    screenRadius: 'rounded-[30px]',
    hasDynamicIsland: false,
  },
  tablet: {
    name: 'iPad Mini',
    platform: 'ios',
    width: 768,
    height: 1024,
    bezelRadius: 'rounded-[36px]',
    screenRadius: 'rounded-[24px]',
    hasDynamicIsland: false,
  },
};

export default function MobileDeviceSimulator() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showExpoGuide, setShowExpoGuide] = useState(false);
  const [selectedDeviceKey, setSelectedDeviceKey] = useState('iphone15');
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState(0.85);
  const [currentTime, setCurrentTime] = useState('9:41');
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState('');

  // Check if we are inside the emulator iframe itself
  const isInsideIframe = typeof window !== 'undefined' && (
    window.self !== window.top ||
    new URLSearchParams(window.location.search).get('mobile_preview') === '1'
  );

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isInsideIframe) {
    return null;
  }

  const currentDevice = DEVICES[selectedDeviceKey];
  const frameWidth = isLandscape ? currentDevice.height : currentDevice.width;
  const frameHeight = isLandscape ? currentDevice.width : currentDevice.height;

  // Compute preview URL
  const previewPath = location.pathname + (location.search ? `${location.search}&mobile_preview=1` : '?mobile_preview=1');

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  const devBackendUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-2xl border border-neutral-700 transition-all duration-200 transform hover:scale-105 group cursor-pointer"
          title="Open Mobile Device Emulator and Expo Guide"
        >
          <div className="relative">
            <span className="text-xl">📱</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-left text-xs">
            <div className="font-semibold flex items-center gap-1.5">
              <span>Mobile Emulator</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-medium">Expo / React</span>
            </div>
            <div className="text-neutral-400 text-[11px]">iPhone & Android simulator</div>
          </div>
        </button>
      )}

      {/* Full-screen Emulator Workspace Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/95 backdrop-blur-md text-white overflow-hidden animate-fadeIn">
          {/* Top Control Toolbar */}
          <header className="h-16 px-6 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-4 shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <span>NicheTrade Mobile Emulator</span>
                  <span className="bg-indigo-500/20 text-indigo-400 text-[11px] px-2 py-0.5 rounded font-mono">
                    {currentDevice.name}
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400">Interactive mobile viewport preview</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Device Selector */}
              <select
                value={selectedDeviceKey}
                onChange={(e) => setSelectedDeviceKey(e.target.value)}
                className="bg-neutral-800 text-neutral-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {Object.entries(DEVICES).map(([key, device]) => (
                  <option key={key} value={key}>
                    {device.name} ({device.width}×{device.height})
                  </option>
                ))}
              </select>

              {/* Orientation toggle */}
              <button
                onClick={() => setIsLandscape(!isLandscape)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs flex items-center gap-1 transition cursor-pointer"
                title="Toggle Portrait / Landscape"
              >
                <span>🔄</span>
                <span className="hidden md:inline">{isLandscape ? 'Landscape' : 'Portrait'}</span>
              </button>

              {/* Scale Zoom Controls */}
              <div className="hidden sm:flex items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-lg p-0.5 text-xs">
                {[0.75, 0.85, 1.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`px-2 py-1 rounded transition cursor-pointer ${
                      scale === s ? 'bg-indigo-600 text-white font-medium' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {Math.round(s * 100)}%
                  </button>
                ))}
              </div>

              {/* Refresh Frame */}
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs transition cursor-pointer"
                title="Reload device screen"
              >
                🔄 Reload
              </button>

              {/* Expo Mobile Guide Button */}
              <button
                onClick={() => setShowExpoGuide(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                <span>⚡</span>
                <span>Expo App Guide</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-rose-600/80 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition cursor-pointer"
                title="Exit Mobile Emulator"
              >
                ✕ Close
              </button>
            </div>
          </header>

          {/* Emulator Stage Canvas */}
          <main className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black">
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 200ms ease, width 250ms ease, height 250ms ease',
              }}
              className="relative shrink-0 flex flex-col items-center justify-center"
            >
              {/* Smartphone Chassis */}
              <div
                style={{ width: `${frameWidth + 24}px`, height: `${frameHeight + 24}px` }}
                className={`relative bg-neutral-900 border-[10px] border-neutral-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(99,102,241,0.15)] ${currentDevice.bezelRadius} flex flex-col items-center justify-between p-1 select-none`}
              >
                {/* Physical side buttons simulations */}
                <div className="absolute -left-[14px] top-28 w-[4px] h-12 bg-neutral-700 rounded-l-md"></div>
                <div className="absolute -left-[14px] top-44 w-[4px] h-12 bg-neutral-700 rounded-l-md"></div>
                <div className="absolute -right-[14px] top-32 w-[4px] h-16 bg-neutral-700 rounded-r-md"></div>

                {/* Inner Screen Bezel */}
                <div
                  style={{ width: `${frameWidth}px`, height: `${frameHeight}px` }}
                  className={`relative bg-black ${currentDevice.screenRadius} overflow-hidden flex flex-col`}
                >
                  {/* Status Bar */}
                  <div className="h-10 px-6 flex items-center justify-between bg-black/80 text-white text-[11px] font-medium z-30 select-none">
                    <span>{currentTime}</span>

                    {/* Camera / Island Notch */}
                    {currentDevice.hasDynamicIsland ? (
                      <div className="h-5 w-24 bg-neutral-950 rounded-full flex items-center justify-end px-2 border border-neutral-800/60 shadow-inner">
                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-700"></div>
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span>5G</span>
                      <span>📶</span>
                      <span>🔋 100%</span>
                    </div>
                  </div>

                  {/* Interactive App Screen Iframe */}
                  <div className="flex-1 w-full relative bg-white overflow-hidden">
                    <iframe
                      key={iframeKey}
                      src={previewPath}
                      title="NicheTrade Mobile Preview"
                      className="w-full h-full border-none"
                    />
                  </div>

                  {/* Bottom Home Indicator */}
                  <div className="h-5 bg-black flex items-center justify-center z-30 select-none">
                    <div className="w-32 h-1 bg-neutral-400 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Sub-label under device */}
              <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{currentDevice.name}</span>
                <span>•</span>
                <span>{frameWidth} × {frameHeight}px</span>
                <span>•</span>
                <span className="capitalize">{currentDevice.platform} viewport</span>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Expo Native Mobile Guide Modal */}
      {showExpoGuide && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚀</span>
                <div>
                  <h3 className="text-lg font-bold">Expo Mobile App Setup</h3>
                  <p className="text-xs text-neutral-400">
                    How to run the native React Native / Expo app in <code className="text-emerald-400">/mobile</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExpoGuide(false)}
                className="text-neutral-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="p-3.5 bg-neutral-800/80 border border-neutral-700/60 rounded-xl">
                <h4 className="font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 text-sm">
                  <span>💡</span> Why the in-browser emulator?
                </h4>
                <p className="text-neutral-300 leading-relaxed">
                  The AI Studio cloud workspace is a headless Linux container (port 3000) without hardware virtualization (KVM/AVD) for running native Android Studio or iOS Xcode emulator processes directly inside the browser.
                  The built-in Mobile Simulator above lets you test the full mobile responsive UI right now!
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-200 mb-2 text-sm flex items-center gap-1.5">
                  <span>📱</span> Running on your phone with Expo Go
                </h4>
                <p className="text-neutral-400 mb-2">
                  The complete cross-platform mobile app is located in the <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-200">/mobile</code> directory. Run it with:
                </p>

                {/* Step 1 */}
                <div className="space-y-2">
                  <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-neutral-500 select-none">1. Set API Endpoint:</span>
                      <pre className="text-emerald-400 font-mono text-xs mt-0.5">EXPO_PUBLIC_API_URL={devBackendUrl}</pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`EXPO_PUBLIC_API_URL=${devBackendUrl}`, 'env')}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-medium"
                    >
                      {copiedCmd === 'env' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-neutral-500 select-none">2. Install mobile dependencies:</span>
                      <pre className="text-emerald-400 font-mono text-xs mt-0.5">cd mobile && npm install</pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard('cd mobile && npm install', 'install')}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-medium"
                    >
                      {copiedCmd === 'install' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-neutral-500 select-none">3. Start Metro bundler:</span>
                      <pre className="text-emerald-400 font-mono text-xs mt-0.5">npx expo start</pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard('npx expo start', 'start')}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-medium"
                    >
                      {copiedCmd === 'start' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl">
                <h5 className="font-semibold text-indigo-300 mb-1">Target testing options:</h5>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px]">
                  <li>
                    <strong className="text-white">Physical Phone (iOS & Android):</strong> Install the free <strong>Expo Go</strong> app from App Store / Google Play and scan the terminal QR code.
                  </li>
                  <li>
                    <strong className="text-white">Android Emulator:</strong> Press <code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">a</code> in the terminal to launch on Android Studio AVD.
                  </li>
                  <li>
                    <strong className="text-white">iOS Simulator:</strong> Press <code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">i</code> in the terminal to launch on Xcode Simulator (macOS).
                  </li>
                </ul>
              </div>

              {/* Screens overview */}
              <div>
                <h5 className="font-semibold text-neutral-200 mb-1.5">Mobile features included in /mobile:</h5>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-neutral-800/60 border border-neutral-700/50">
                    <span className="font-medium text-emerald-400">Campus Marketplace</span>
                    <p className="text-neutral-400">Search, categories, product details, favorites</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-800/60 border border-neutral-700/50">
                    <span className="font-medium text-emerald-400">Lost & Found Hub</span>
                    <p className="text-neutral-400">Posts with photo uploads and place tags</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-800/60 border border-neutral-700/50">
                    <span className="font-medium text-emerald-400">Real-Time Messaging</span>
                    <p className="text-neutral-400">Socket.IO chat between buyer & seller</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-800/60 border border-neutral-700/50">
                    <span className="font-medium text-emerald-400">Seller & Cart</span>
                    <p className="text-neutral-400">List items, order tracking & campus delivery</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExpoGuide(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition"
              >
                Back to Mobile Emulator
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
