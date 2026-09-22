import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatNextFire, nextOccurrence } from '@shared/alarm-time'
import type { Alarm, AlarmSound } from '@shared/types'

function decodeBase64Audio(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function unlockAudio() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  const ctx = new AC()
  void ctx.resume()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  gain.gain.value = 0
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.01)
  void ctx.close()
}

export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [sounds, setSounds] = useState<AlarmSound[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [ringing, setRinging] = useState<Alarm | null>(null)
  const [systemd, setSystemd] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queued = useRef<{ id: string; patch: Partial<Alarm> } | null>(null)
  const previewAudio = useRef<HTMLAudioElement | null>(null)
  const previewUrl = useRef<string | null>(null)

  const stopPreview = useCallback(() => {
    previewAudio.current?.pause()
    if (previewAudio.current) previewAudio.current.src = ''
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current)
      previewUrl.current = null
    }
    setPreviewing(null)
    void window.taskapp.stopAlarmPreview()
  }, [])

  const replaceAlarm = useCallback((alarm: Alarm) => {
    setAlarms((current) => {
      const exists = current.some((item) => item.id === alarm.id)
      return exists ? current.map((item) => (item.id === alarm.id ? alarm : item)) : [...current, alarm]
    })
  }, [])

  const reload = useCallback(async () => {
    const [list, ringingNow, hasSystemd] = await Promise.all([
      window.taskapp.listAlarms(),
      window.taskapp.ringingAlarm(),
      window.taskapp.hasAlarmSystemd()
    ])
    setAlarms(list)
    setRinging(ringingNow)
    setSystemd(hasSystemd)
    setActiveId((current) => (current && list.some((item) => item.id === current) ? current : list[0]?.id ?? null))
  }, [])

  useEffect(() => {
    void Promise.all([reload(), window.taskapp.listAlarmSounds().then(setSounds)])
    const offRing = window.taskapp.onAlarmRing((alarm) => {
      stopPreview()
      setRinging(alarm)
      void window.taskapp.listAlarms().then(setAlarms)
    })
    const offStop = window.taskapp.onAlarmStopped(() => setRinging(null))
    return () => {
      offRing()
      offStop()
      if (debounce.current) clearTimeout(debounce.current)
      stopPreview()
    }
  }, [reload, stopPreview])

  const flush = useCallback(async () => {
    const work = queued.current
    queued.current = null
    if (debounce.current) {
      clearTimeout(debounce.current)
      debounce.current = null
    }
    if (!work) return
    const result = await window.taskapp.updateAlarm(work.id, work.patch)
    if (!result.ok) return
    replaceAlarm(result.alarm)
    if (result.systemd === false) setSystemd(false)
  }, [replaceAlarm])

  const update = useCallback(
    (id: string, patch: Partial<Alarm>, immediate = false) => {
      setAlarms((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item))
      )
      const previous = queued.current?.id === id ? queued.current.patch : {}
      queued.current = { id, patch: { ...previous, ...patch } }
      if (immediate) {
        void flush()
        return
      }
      if (debounce.current) clearTimeout(debounce.current)
      debounce.current = setTimeout(() => {
        void flush()
      }, 280)
    },
    [flush]
  )

  const create = useCallback(async () => {
    await flush()
    const result = await window.taskapp.createAlarm()
    if (!result.ok) return null
    replaceAlarm(result.alarm)
    setActiveId(result.alarm.id)
    if (result.systemd === false) setSystemd(false)
    return result.alarm
  }, [flush, replaceAlarm])

  const remove = useCallback(async (id: string) => {
    await flush()
    const result = await window.taskapp.deleteAlarm(id)
    if (!result.ok) return
    setAlarms((current) => current.filter((item) => item.id !== id))
    setActiveId((current) => (current === id ? null : current))
    setPendingDelete(null)
  }, [flush])

  const stop = useCallback(async () => {
    await window.taskapp.stopAlarm()
    setRinging(null)
    await reload()
  }, [reload])

  const snooze = useCallback(async (id: string) => {
    await window.taskapp.snoozeAlarm(id)
    setRinging(null)
    await reload()
  }, [reload])

  const preview = useCallback(async (filePath: string) => {
    unlockAudio()
    previewAudio.current?.pause()
    const result = await window.taskapp.previewAlarmSound(filePath)
    if (!result.ok) return
    if (result.stopped) {
      if (previewAudio.current) previewAudio.current.src = ''
      if (previewUrl.current) {
        URL.revokeObjectURL(previewUrl.current)
        previewUrl.current = null
      }
      setPreviewing(null)
      return
    }
    setPreviewing(filePath)
    if (result.native) return
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    const url = URL.createObjectURL(new Blob([decodeBase64Audio(result.data)], { type: result.mime || 'audio/ogg' }))
    previewUrl.current = url
    if (!previewAudio.current) previewAudio.current = new Audio()
    const node = previewAudio.current
    node.pause()
    node.src = url
    node.load()
    node.onended = () => setPreviewing((current) => (current === filePath ? null : current))
    try {
      await node.play()
    } catch {
      setPreviewing(null)
    }
  }, [])

  const active = useMemo(
    () => alarms.find((item) => item.id === activeId) ?? null,
    [alarms, activeId]
  )

  const nextUp = useMemo(() => {
    const upcoming = alarms
      .filter((item) => item.enabled)
      .map((item) => ({ item, when: nextOccurrence(item.hour, item.minute, item.days) }))
      .sort((a, b) => a.when.getTime() - b.when.getTime())
    return upcoming[0] ? `${upcoming[0].item.label} · ${formatNextFire(upcoming[0].when)}` : null
  }, [alarms])

  return {
    alarms,
    sounds,
    active,
    activeId,
    setActiveId,
    ringing,
    systemd,
    pendingDelete,
    setPendingDelete,
    previewing,
    nextUp,
    create,
    update,
    remove,
    stop,
    snooze,
    preview
  }
}
