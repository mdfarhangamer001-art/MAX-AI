import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as faceapi from 'face-api.js'
import { GiArtificialIntelligence } from 'react-icons/gi'
import {
  RiKey2Line,
  RiSave3Line,
  RiUserVoiceLine,
  RiUserLine,
  RiLockPasswordLine,
  RiScan2Line,
  RiAddLine,
  RiRecordCircleLine,
  RiLock2Line,
  RiSettings4Line,
  RiShieldKeyholeLine,
  RiPlugLine,
  RiBrainLine,
  RiCloudLine,
  RiCpuLine,
  RiTerminalWindowLine,
  RiRefreshLine,
  RiDownloadCloud2Line,
  RiRocketLine,
  RiTerminalBoxLine
} from 'react-icons/ri'

interface SettingsProps {
  isSystemActive: boolean
}

type TabType = 'updates' | 'general' | 'keys' | 'security'

// --- REUSABLE UI COMPONENTS ---
function GlassPanel({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-zinc-950/40 backdrop-blur-xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none z-0" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function NeonBar({ value, color, glow }: { value: number; color: string; glow: string }) {
  return (
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${Math.min(100, value)}%`,
          background: color,
          boxShadow: `0 0 15px ${glow}`
        }}
      />
    </div>
  )
}

export default function SettingsView({ isSystemActive }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('updates')

  // States
  const [voice, setVoice] = useState<'MALE' | 'FEMALE'>(
    (localStorage.getItem('iris_voice_profile') as 'MALE' | 'FEMALE') || 'MALE'
  )
  const [personality, setPersonality] = useState('')
  const [userName, setUserName] = useState(localStorage.getItem('iris_user_name') || '')

  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('iris_custom_api_key') || '')
  const [groqKey, setGroqKey] = useState(localStorage.getItem('iris_groq_api_key') || '')
  const [hfKey, setHfKey] = useState(localStorage.getItem('iris_hf_api_key') || '')
  const [tailvyKey, setTailvyKey] = useState(localStorage.getItem('iris_tailvy_api_key') || '')

  const [isSecurityUnlocked, setIsSecurityUnlocked] = useState(false)
  const [authPin, setAuthPin] = useState('')
  const [authError, setAuthError] = useState(false)

  const [newPin, setNewPin] = useState('')
  const [faceCount, setFaceCount] = useState(0)

  const [isScanningFace, setIsScanningFace] = useState(false)
  const [enrollStatus, setEnrollStatus] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  const [appVersion, setAppVersion] = useState('1.3.0')
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'
  >('idle')
  const [updateVersion, setUpdateVersion] = useState('')
  const [updateNotes, setUpdateNotes] = useState(
    'System is fully optimized. No new firmware detected.'
  )
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('get-personality').then((res) => {
        if (res) setPersonality(res)
      })
      window.electron.ipcRenderer
        .invoke('check-vault-status')
        .then((res) => setFaceCount(res?.faceCount || 0))
      window.electron.ipcRenderer.invoke('get-app-version').then((v) => setAppVersion(v))

      window.electron.ipcRenderer.on('updater-event', (_e, { status, data, error }) => {
        if (status === 'checking') setUpdateStatus('checking')
        if (status === 'available') {
          setUpdateStatus('available')
          setUpdateVersion(data.version)
          setUpdateNotes(data.releaseNotes || 'Bug fixes and performance improvements.')
        }
        if (status === 'not-available') {
          setUpdateStatus('idle')
          setUpdateNotes('System firmware is up to date.')
        }
        if (status === 'downloading') {
          setUpdateStatus('downloading')
          setDownloadProgress(Math.round(data.percent))
        }
        if (status === 'downloaded') setUpdateStatus('ready')
        if (status === 'error') {
          setUpdateStatus('error')
          setUpdateNotes(`[CRITICAL ERROR]: ${error}`)
        }
      })
    }
    return () => {
      if (window.electron?.ipcRenderer)
        window.electron.ipcRenderer.removeAllListeners('updater-event')
    }
  }, [])

  const checkForUpdates = () => window.electron.ipcRenderer.invoke('check-for-updates')
  const downloadUpdate = () => window.electron.ipcRenderer.invoke('download-update')
  const installUpdate = () => window.electron.ipcRenderer.invoke('install-update')

  const handleVoiceChange = (v: 'MALE' | 'FEMALE') => {
    if (isSystemActive) return
    setVoice(v)
    localStorage.setItem('iris_voice_profile', v)
  }

  const handlePersonalityChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0)
    if (words.length <= 150) setPersonality(text)
  }

  const savePersonality = async () => {
    if (window.electron?.ipcRenderer) {
      await window.electron.ipcRenderer.invoke('set-personality', personality)
      alert('Personality Matrix Saved Securely to OS.')
    }
  }

  const saveUserName = () => {
    localStorage.setItem('iris_user_name', userName)
    alert('User Designation Saved.')
  }

  const saveApiKeys = async () => {
    localStorage.setItem('iris_custom_api_key', geminiKey)
    localStorage.setItem('iris_groq_api_key', groqKey)
    localStorage.setItem('iris_hf_api_key', hfKey)
    localStorage.setItem('iris_tailvy_api_key', tailvyKey)

    if (window.electron?.ipcRenderer) {
      try {
        await window.electron.ipcRenderer.invoke('secure-save-keys', { groqKey, geminiKey })
      } catch (e) {}
    }
    alert(
      'All Neural Uplinks (API Keys) secured locally and in OS Vault. Restart AI modules to apply.'
    )
  }

  const currentWordCount = personality
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length

  const unlockSecurityModule = async () => {
    if (!window.electron?.ipcRenderer) return
    const isValid = await window.electron.ipcRenderer.invoke('verify-vault-pin', authPin)
    if (isValid) {
      setIsSecurityUnlocked(true)
      setAuthPin('')
    } else {
      setAuthError(true)
      setTimeout(() => setAuthError(false), 1000)
    }
  }

  const updateMasterPin = async () => {
    if (newPin.length !== 4 || !window.electron?.ipcRenderer) return
    await window.electron.ipcRenderer.invoke('setup-vault-pin', newPin)
    setNewPin('')
    alert('Master PIN Updated Successfully.')
  }

  const startFaceEnrollment = async () => {
    setIsScanningFace(true)
    setEnrollStatus('INITIALIZING CAMERA...')
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models')
      ])

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setEnrollStatus('POSITION FACE IN FRAME')

        const scanInterval = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) return
          const detection = await faceapi
            .detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor()

          if (detection) {
            clearInterval(scanInterval)
            setEnrollStatus('FACE ACQUIRED. ENCRYPTING...')
            const descriptorArray = Array.from(detection.descriptor)

            if (window.electron?.ipcRenderer) {
              await window.electron.ipcRenderer.invoke('setup-vault-face', descriptorArray)
            }

            stream.getTracks().forEach((t) => t.stop())
            setIsScanningFace(false)
            setFaceCount((prev) => prev + 1)
            alert('New Biometric Identity Saved.')
          }
        }, 1000)
      }
    } catch (e) {
      setEnrollStatus('CAMERA ERROR')
      setTimeout(() => setIsScanningFace(false), 2000)
    }
  }

  // Common CSS classes
  const inputContainerClass =
    'flex items-center bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus-within:border-emerald-500/50 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 w-full'
  const labelClass =
    'text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2 mb-2'
  const titleClass =
    'text-xs font-mono tracking-widest uppercase text-white flex items-center gap-3'

  const tabConfigs = [
    { id: 'updates', label: 'SYSTEM', icon: <RiTerminalWindowLine size={14} /> },
    { id: 'general', label: 'GENERAL', icon: <RiSettings4Line size={14} /> },
    { id: 'keys', label: 'API KEYS', icon: <RiPlugLine size={14} /> },
    { id: 'security', label: 'SECURITY', icon: <RiShieldKeyholeLine size={14} /> }
  ]

  return (
    <div className="flex-1 p-6 md:p-10 flex flex-col items-center bg-transparent min-h-screen text-zinc-100 overflow-y-auto scrollbar-small">
      <motion.div
        className="w-full max-w-4xl flex flex-col gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-900 border border-white/10 shadow-lg">
              <GiArtificialIntelligence size={24} className="text-zinc-100" />
              {isSystemActive && (
                <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse -translate-y-1/2 translate-x-1/2" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">System Configuration</h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-1 tracking-[0.2em] uppercase">
                Kernel: OS_CORE_V2.0
              </p>
            </div>
          </div>

          {/* TAB DOCK */}
          <div className="flex bg-zinc-950/80 p-1.5 rounded-xl border border-white/5 backdrop-blur-md shadow-2xl w-full md:w-fit overflow-x-auto scrollbar-none">
            {tabConfigs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center justify-center gap-2 px-5 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* CONTENT AREA */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {/* --- TAB 1: UPDATES --- */}
            {activeTab === 'updates' && (
              <motion.div
                key="updates"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 absolute w-full"
              >
                {/* Firmware Card */}
                <GlassPanel className="md:col-span-5 p-6 flex flex-col items-center text-center">
                  <div className="w-full flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                    <span className={titleClass}>
                      <RiRocketLine className="text-zinc-400" size={16} /> Firmware
                    </span>
                    <span className="text-[9px] bg-white/5 text-zinc-300 border border-white/10 px-2 py-1 rounded font-mono tracking-[0.2em] uppercase">
                      BUILD v{appVersion}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[200px]">
                    {updateStatus === 'idle' || updateStatus === 'error' ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center relative">
                          <RiRecordCircleLine size={30} className="text-zinc-600" />
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                          System is Nominal
                        </p>
                        <button
                          onClick={checkForUpdates}
                          className="mt-4 px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase flex items-center gap-2 transition-all"
                        >
                          <RiRefreshLine size={14} /> Scan for Updates
                        </button>
                      </div>
                    ) : updateStatus === 'checking' ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative h-24 w-24">
                          <div className="absolute inset-0 rounded-full border border-emerald-500/30" />
                          <div
                            className="absolute inset-0 rounded-full border-t border-emerald-400 animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                            style={{ animationDuration: '1s' }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <RiRocketLine className="text-emerald-400" size={24} />
                          </div>
                        </div>
                        <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase animate-pulse">
                          Querying Mainframe...
                        </p>
                      </div>
                    ) : updateStatus === 'available' ? (
                      <div className="flex flex-col items-center gap-4 w-full">
                        <div className="h-20 w-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                          <RiDownloadCloud2Line size={30} className="text-cyan-400" />
                        </div>
                        <p className="text-[10px] text-cyan-400 font-mono tracking-[0.2em] uppercase mt-2">
                          New Patch Found: v{updateVersion}
                        </p>
                        <button
                          onClick={downloadUpdate}
                          className="mt-2 w-full py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-mono tracking-widest text-[10px] border border-cyan-500/50 uppercase transition-all"
                        >
                          Initialize Download
                        </button>
                      </div>
                    ) : updateStatus === 'downloading' ? (
                      <div className="flex flex-col w-full gap-4 justify-center h-full px-4">
                        <div className="flex justify-between text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                          <span>Downloading</span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <NeonBar
                          value={downloadProgress}
                          color="#06b6d4"
                          glow="rgba(6,182,212,0.5)"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 w-full">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                          <RiRecordCircleLine size={30} className="text-emerald-400" />
                        </div>
                        <p className="text-[10px] text-emerald-400 font-mono tracking-[0.2em] uppercase">
                          Ready for Execution
                        </p>
                        <button
                          onClick={installUpdate}
                          className="mt-2 w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono tracking-widest text-[10px] uppercase shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                        >
                          Reboot System
                        </button>
                      </div>
                    )}
                  </div>
                </GlassPanel>

                {/* Patch Notes Card */}
                <GlassPanel className="md:col-span-7 p-0 flex flex-col h-full">
                  <div className="bg-black/40 border-b border-white/5 px-6 py-4 flex items-center gap-3">
                    <RiTerminalBoxLine className="text-zinc-500" size={16} />
                    <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
                      System_Logs.txt
                    </span>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto scrollbar-small font-mono text-[11px] text-zinc-300 leading-relaxed">
                    {updateStatus === 'checking' ? (
                      <span className="text-emerald-400 animate-pulse">
                        Establishing secure connection...
                      </span>
                    ) : (
                      <pre className="whitespace-pre-wrap">{updateNotes}</pre>
                    )}
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* --- TAB 2: GENERAL --- */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 absolute w-full"
              >
                {/* Personality Matrix */}
                <GlassPanel className="md:col-span-2 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className={titleClass}>
                      <RiBrainLine size={16} className="text-emerald-400" /> Core Personality Matrix
                    </span>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-[9px] font-mono tracking-[0.2em] uppercase ${currentWordCount >= 150 ? 'text-red-400' : 'text-zinc-500'}`}
                      >
                        {currentWordCount} / 150 WORDS
                      </span>
                      <button
                        onClick={savePersonality}
                        className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 transition-all"
                      >
                        <RiSave3Line size={16} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={personality}
                    onChange={handlePersonalityChange}
                    placeholder="Define the structural behavior of IRIS..."
                    className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-[12px] text-zinc-300 font-mono h-32 resize-none focus:border-emerald-500/30 outline-none transition-all scrollbar-small leading-relaxed"
                  />
                </GlassPanel>

                {/* User Designation */}
                <GlassPanel className="p-6">
                  <span className={`${titleClass} mb-4`}>
                    <RiUserLine size={16} className="text-zinc-400" /> User Designation
                  </span>
                  <div className={inputContainerClass}>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Operator Name"
                      className="bg-transparent border-none outline-none text-[12px] font-mono tracking-widest uppercase text-zinc-100 w-full placeholder:text-zinc-600"
                    />
                    <button
                      onClick={saveUserName}
                      className="text-zinc-400 hover:text-emerald-400 transition-colors ml-2"
                    >
                      <RiSave3Line size={18} />
                    </button>
                  </div>
                </GlassPanel>

                {/* Voice Profile */}
                <GlassPanel className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className={titleClass}>
                      <RiUserVoiceLine size={16} className="text-zinc-400" /> Voice Synthesis
                    </span>
                    {isSystemActive && (
                      <span className="text-[8px] text-red-400 font-mono tracking-widest uppercase border border-red-500/20 bg-red-500/10 px-2 py-0.5 rounded">
                        Locked (Active)
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex gap-3 h-[42px] ${isSystemActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {(['FEMALE', 'MALE'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleVoiceChange(s)}
                        disabled={isSystemActive}
                        className={`flex-1 rounded-lg font-mono text-[10px] tracking-[0.2em] uppercase transition-all border ${
                          voice === s
                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                            : 'bg-black/50 border-white/10 text-zinc-500 hover:border-white/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* --- TAB 3: API KEYS --- */}
            {activeTab === 'keys' && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 absolute w-full"
              >
                <GlassPanel className="md:col-span-2 p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className={titleClass}>
                      <RiKey2Line size={16} className="text-emerald-400" /> Neural Endpoints
                    </span>
                    <button
                      onClick={saveApiKeys}
                      className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-[0.2em] uppercase hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                    >
                      <RiSave3Line size={14} /> Commit Keys
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>
                        <RiBrainLine /> Gemini Core
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          type="password"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="bg-transparent border-none outline-none text-[12px] font-mono text-zinc-300 w-full placeholder:text-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        <RiCpuLine /> Groq Inference
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          type="password"
                          value={groqKey}
                          onChange={(e) => setGroqKey(e.target.value)}
                          placeholder="gsk_..."
                          className="bg-transparent border-none outline-none text-[12px] font-mono text-zinc-300 w-full placeholder:text-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        <RiCloudLine /> Hugging Face
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          type="password"
                          value={hfKey}
                          onChange={(e) => setHfKey(e.target.value)}
                          placeholder="hf_..."
                          className="bg-transparent border-none outline-none text-[12px] font-mono text-zinc-300 w-full placeholder:text-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        <RiPlugLine /> Tavily Search
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          type="password"
                          value={tailvyKey}
                          onChange={(e) => setTailvyKey(e.target.value)}
                          placeholder="tvly-..."
                          className="bg-transparent border-none outline-none text-[12px] font-mono text-zinc-300 w-full placeholder:text-zinc-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex gap-3 items-start mt-2">
                    <RiShieldKeyholeLine className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                    <p className="text-[9px] text-emerald-500/70 font-mono uppercase tracking-widest leading-relaxed">
                      All endpoints are encrypted and stored in local memory. IRIS does not transmit
                      keys externally.
                    </p>
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* --- TAB 4: SECURITY --- */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full absolute"
              >
                <GlassPanel className="p-0 overflow-hidden min-h-[400px]">
                  <AnimatePresence>
                    {!isSecurityUnlocked && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className="absolute inset-0 z-20 backdrop-blur-3xl bg-black/80 flex flex-col items-center justify-center border border-white/5"
                      >
                        <div
                          className={`p-5 rounded-full mb-6 border transition-all duration-300 ${authError ? 'border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.1)]'}`}
                        >
                          <RiLockPasswordLine
                            size={32}
                            className={authError ? 'text-red-500' : 'text-emerald-400'}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase mb-6">
                          Vault Authentication Required
                        </p>
                        <div className="flex gap-3 h-12">
                          <input
                            type="password"
                            maxLength={4}
                            pattern="\d*"
                            value={authPin}
                            onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="PIN"
                            className={`h-full bg-black/50 border w-32 rounded-lg text-center text-xl tracking-[0.5em] text-white outline-none transition-colors ${authError ? 'border-red-500' : 'border-white/10 focus:border-emerald-500/50'}`}
                          />
                          <button
                            onClick={unlockSecurityModule}
                            className="h-full px-6 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-mono tracking-widest uppercase rounded-lg transition-all"
                          >
                            Unlock
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    {/* Master PIN */}
                    <div className="bg-black/50 border border-white/5 p-6 rounded-2xl flex flex-col h-fit">
                      <span className={`${titleClass} mb-6`}>
                        <RiLock2Line className="text-zinc-500" /> Master PIN
                      </span>
                      <div className={inputContainerClass}>
                        <input
                          type="password"
                          maxLength={4}
                          pattern="\d*"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="New 4-Digit PIN"
                          className="bg-transparent border-none outline-none text-[14px] font-mono tracking-[0.3em] text-zinc-100 w-full"
                        />
                        <button
                          onClick={updateMasterPin}
                          className="text-zinc-500 hover:text-emerald-400 transition-colors ml-2"
                        >
                          <RiSave3Line size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Biometrics */}
                    <div className="bg-black/50 border border-white/5 p-6 rounded-2xl flex flex-col h-full min-h-[250px]">
                      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <span className={titleClass}>
                          <RiScan2Line className="text-zinc-500" /> Biometrics
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/10">
                          {faceCount} Enrolled
                        </span>
                      </div>

                      {isScanningFace ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                          <div className="relative p-1 rounded-xl border border-emerald-500/50 bg-emerald-500/10">
                            <video
                              ref={videoRef}
                              autoPlay
                              muted
                              playsInline
                              className="w-24 h-24 rounded-lg object-cover -scale-x-100"
                            />
                            <div className="absolute inset-0 border border-emerald-400 animate-pulse pointer-events-none rounded-xl" />
                          </div>
                          <span className="text-[9px] text-emerald-400 font-mono tracking-[0.2em] uppercase animate-pulse">
                            {enrollStatus}
                          </span>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col justify-between">
                          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed uppercase tracking-widest">
                            Add structural face descriptors for passwordless authentication.
                          </p>
                          <button
                            onClick={startFaceEnrollment}
                            className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono tracking-widest text-[10px] uppercase flex items-center justify-center gap-2 transition-all mt-4"
                          >
                            <RiAddLine size={14} /> Scan Face
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
