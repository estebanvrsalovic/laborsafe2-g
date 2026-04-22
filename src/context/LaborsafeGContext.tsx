'use client'

import { createContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import type {
  Company, ProcessDocument, RiskAnalysis, SavedMatrix, ControlMeasure,
  GanttActivity, PurchaseLine, AcquisitionStatus,
} from '@/lib/types'
import type { SuggestControlMeasuresOutput } from '@/ai/flows/suggest-control-measures-flow'
import { createTasksAndRisks } from '@/ai/flows/create-tasks-and-risks-flow'
import { suggestControlMeasures } from '@/ai/flows/suggest-control-measures-flow'
import { evaluateRisks } from '@/ai/flows/evaluate-risks-flow'
import { createGanttPlan } from '@/ai/flows/create-gantt-plan-flow'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { calculateRiskLevel, getVep } from '@/lib/constants'
import { addDays, format, addWeeks, addMonths } from 'date-fns'

// ─── Context type ──────────────────────────────────────────────────────────

export interface LaborsafeGContextType {
  companies: Company[]
  activeCompanyId: string | null
  activeCompany: Company | null
  addCompany: (company: Omit<Company, 'id'>) => void
  updateCompany: (company: Company) => void
  deleteCompany: (companyId: string) => void
  setActiveCompanyId: (id: string | null) => void

  processDocuments: ProcessDocument[]
  activeProcessDocuments: ProcessDocument[]
  addProcessDocument: (doc: Omit<ProcessDocument, 'id' | 'companyId'>) => void
  updateProcessDocument: (doc: ProcessDocument) => void
  deleteProcessDocument: (docId: string) => void

  riskAnalyses: RiskAnalysis[]
  setRiskAnalyses: (value: RiskAnalysis[] | ((prev: RiskAnalysis[]) => RiskAnalysis[])) => void
  syncProcessesToMatrix: () => void
  identifyRisksWithAI: () => Promise<void>
  identifyRisksForRisk: (riskId: string) => Promise<void>
  identifyRisksForProcess: (processId: string) => Promise<void>
  evaluateRisksWithAI: (risks?: RiskAnalysis[]) => Promise<RiskAnalysis[]>
  suggestControlsWithAI: (riskId: string) => Promise<SuggestControlMeasuresOutput | null>
  suggestAllControlMeasuresWithAI: (risks: RiskAnalysis[], overwrite: boolean) => Promise<RiskAnalysis[]>
  runFullAIMatrix: (taskCount: number) => Promise<void>
  updateRiskAnalysis: (updatedAnalysis: Partial<RiskAnalysis> & { id: string }) => void
  addRiskAnalysisRow: (sourceRiskId: string) => void
  deleteRiskAnalysis: (riskId: string) => void
  undoDeleteRiskAnalysis: () => void
  lastDeletedRisk: { risk: RiskAnalysis; index: number } | null
  clearActiveMatrix: () => void
  clearAllPreventiveMeasures: () => void
  clearAllEvaluations: () => void
  loadingAI: boolean

  savedMatrices: SavedMatrix[]
  saveCurrentMatrix: (name: string) => void
  loadMatrix: (matrixId: string) => void
  deleteMatrix: (matrixId: string) => void

  ganttActivities: GanttActivity[]
  setGanttActivities: (value: GanttActivity[] | ((prev: GanttActivity[]) => GanttActivity[])) => void
  generateGanttPlanWithAI: () => Promise<void>
  generateGanttPlanWithTestData: () => void
  updateGanttActivity: (activity: GanttActivity | GanttActivity[]) => void

  exportToExcel: () => void
  exportToPDF: () => void
  exportGanttToPDF: () => void

  layoutPlan: string | null
  setLayoutPlan: (value: string | null) => void

  acquisitions: PurchaseLine[]
  setAcquisitions: (value: PurchaseLine[] | ((prev: PurchaseLine[]) => PurchaseLine[])) => void
  createAcquisition: (line: Omit<PurchaseLine, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => PurchaseLine
  updateAcquisition: (line: Partial<PurchaseLine> & { id: string }) => void
  deleteAcquisition: (id: string) => void
  createAcquisitionsFromItems: (items: any[], granular?: boolean) => PurchaseLine[]

  currentUserRole: 'requester' | 'approver'
  setCurrentUserRole: (role: 'requester' | 'approver') => void
  requestApproval: (id: string) => void
  approveAcquisition: (id: string) => void
}

export const LaborsafeGContext = createContext<LaborsafeGContextType | null>(null)

// ─── Helpers ───────────────────────────────────────────────────────────────

function sortRiskAnalyses(analyses: RiskAnalysis[]): RiskAnalysis[] {
  return [...analyses].sort((a, b) => {
    if (a.processId !== b.processId) return a.processId.localeCompare(b.processId)
    if (a.process !== b.process) return a.process.localeCompare(b.process)
    if (a.taskName !== b.taskName) return a.taskName.localeCompare(b.taskName)
    return a.id.localeCompare(b.id)
  })
}

function migrateRiskAnalyses(analyses: RiskAnalysis[]): RiskAnalysis[] {
  if (!Array.isArray(analyses)) return []
  return analyses.map(risk => {
    if (!risk.preventiveMeasures) risk.preventiveMeasures = []
    if (!risk.processDescription) risk.processDescription = ''
    if (!risk.taskDescription) risk.taskDescription = ''
    if (!risk.sexGenderIdentities) risk.sexGenderIdentities = ''
    if (!risk.specificLocation) risk.specificLocation = ''
    if (!risk.numberOfWorkers) risk.numberOfWorkers = 0
    if (risk.security?.consequence) {
      const map: Record<string, string> = {
        'Ligeramente Dañino': 'Leve', 'Dañino': 'Grave', 'Extremadamente Dañino': 'Muy Grave',
        'Mortal o Catastrófico': 'Muy Grave', 'Mortal': 'Muy Grave',
      }
      if (map[risk.security.consequence]) risk.security.consequence = map[risk.security.consequence]
    }
    return risk
  })
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function LaborsafeGProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [companies, setCompanies] = useState<Company[]>([])
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null)
  const [processDocuments, setProcessDocuments] = useState<ProcessDocument[]>([])
  const [internalRiskAnalyses, setInternalRiskAnalyses] = useState<RiskAnalysis[]>([])
  const [ganttActivitiesState, setGanttActivitiesState] = useState<GanttActivity[]>([])
  const [savedMatrices, setSavedMatrices] = useState<SavedMatrix[]>([])
  const [acquisitionsState, setAcquisitionsState] = useState<PurchaseLine[]>([])
  const [currentUserRole, setCurrentUserRoleState] = useState<'requester' | 'approver'>('requester')
  const [lastDeletedRisk, setLastDeletedRisk] = useState<{ risk: RiskAnalysis; index: number } | null>(null)
  const [layoutPlan, setLayoutPlanState] = useState<string | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const userRef = useRef<typeof user>(null)
  const activeCompanyIdRef = useRef<string | null>(null)
  const riskAnalysesRef = useRef<RiskAnalysis[]>([])
  const prevRiskAnalysesRef = useRef<RiskAnalysis[]>([])
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const companiesRef = useRef<Company[]>([])
  const processDocumentsRef = useRef<ProcessDocument[]>([])

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { activeCompanyIdRef.current = activeCompanyId }, [activeCompanyId])
  useEffect(() => { companiesRef.current = companies }, [companies])
  useEffect(() => { processDocumentsRef.current = processDocuments }, [processDocuments])

  // ─── Load data from Firestore ────────────────────────────────────────────

  useEffect(() => {
    if (!user) { setIsMounted(true); return }

    const loadData = async () => {
      try {
        const uid = user.uid
        const results = await Promise.allSettled([
          getDocs(query(collection(db, 'companies'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'processDocuments'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'riskAnalyses'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'ganttActivities'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'savedMatrices'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'acquisitions'), where('userId', '==', uid))),
          getDoc(doc(db, 'userSettings', uid)),
        ])

        const [companiesRes, processDocsRes, riskRes, ganttRes, matricesRes, acqRes, settingsRes] = results

        if (companiesRes.status === 'fulfilled')
          setCompanies(companiesRes.value.docs.map(d => ({ id: d.id, ...d.data() } as Company)))
        else console.error('companies load failed:', companiesRes.reason)

        if (processDocsRes.status === 'fulfilled')
          setProcessDocuments(processDocsRes.value.docs.map(d => ({ id: d.id, ...d.data() } as ProcessDocument)))
        else console.error('processDocuments load failed:', processDocsRes.reason)

        if (riskRes.status === 'fulfilled') {
          const analyses = riskRes.value.docs.map(d => ({ id: d.id, ...d.data() } as RiskAnalysis))
          const sorted = sortRiskAnalyses(migrateRiskAnalyses(analyses))
          riskAnalysesRef.current = sorted
          prevRiskAnalysesRef.current = sorted
          setInternalRiskAnalyses(sorted)
        } else console.error('riskAnalyses load failed:', riskRes.reason)

        if (ganttRes.status === 'fulfilled')
          setGanttActivitiesState(ganttRes.value.docs.map(d => ({ id: d.id, ...d.data() } as GanttActivity)))
        else console.error('ganttActivities load failed:', ganttRes.reason)

        if (matricesRes.status === 'fulfilled')
          setSavedMatrices(matricesRes.value.docs.map(d => ({ id: d.id, ...d.data() } as SavedMatrix)))
        else console.error('savedMatrices load failed:', matricesRes.reason)

        if (acqRes.status === 'fulfilled')
          setAcquisitionsState(acqRes.value.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseLine)))
        else console.error('acquisitions load failed:', acqRes.reason)

        if (settingsRes.status === 'fulfilled' && settingsRes.value.exists()) {
          const s = settingsRes.value.data()
          if (s.activeCompanyId) setActiveCompanyIdState(s.activeCompanyId)
          if (s.currentRole) setCurrentUserRoleState(s.currentRole)
          if (s.layoutPlan) setLayoutPlanState(s.layoutPlan)
        } else if (settingsRes.status === 'rejected') {
          console.error('userSettings load failed:', settingsRes.reason)
        }
      } catch (error) {
        console.error('Failed to load data from Firestore:', error)
      } finally {
        setIsMounted(true)
      }
    }

    loadData()
  }, [user])

  // ─── Settings sync ────────────────────────────────────────────────────────

  const upsertUserSetting = useCallback((patch: Record<string, unknown>) => {
    const u = userRef.current
    if (!u) return
    setDoc(doc(db, 'userSettings', u.uid), patch, { merge: true })
      .catch(e => console.error('userSettings sync error:', e))
  }, [])

  // ─── Exposed setters with Firestore sync ──────────────────────────────────

  const setActiveCompanyId = useCallback((value: string | null) => {
    setActiveCompanyIdState(value)
    upsertUserSetting({ activeCompanyId: value })
  }, [upsertUserSetting])

  const setCurrentUserRole = useCallback((role: 'requester' | 'approver') => {
    setCurrentUserRoleState(role)
    upsertUserSetting({ currentRole: role })
  }, [upsertUserSetting])

  const setLayoutPlan = useCallback((value: string | null) => {
    setLayoutPlanState(value)
    upsertUserSetting({ layoutPlan: value })
  }, [upsertUserSetting])

  const setGanttActivities = useCallback((value: GanttActivity[] | ((prev: GanttActivity[]) => GanttActivity[])) => {
    setGanttActivitiesState(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      const u = userRef.current
      if (u) {
        const prevIds = new Set(prev.map(a => a.id))
        const nextIds = new Set(next.map(a => a.id))
        const deletedIds = [...prevIds].filter(id => !nextIds.has(id))
        const companyId = activeCompanyIdRef.current
        next.forEach(a => setDoc(doc(db, 'ganttActivities', a.id), { ...a, userId: u.uid, companyId }).catch(console.error))
        deletedIds.forEach(id => deleteDoc(doc(db, 'ganttActivities', id)).catch(console.error))
      }
      return next
    })
  }, [])

  const setAcquisitions = useCallback((value: PurchaseLine[] | ((prev: PurchaseLine[]) => PurchaseLine[])) => {
    setAcquisitionsState(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      const u = userRef.current
      if (u) {
        const prevIds = new Set(prev.map(a => a.id))
        const nextIds = new Set(next.map(a => a.id))
        const deletedIds = [...prevIds].filter(id => !nextIds.has(id))
        next.forEach(a => setDoc(doc(db, 'acquisitions', a.id), { ...a, userId: u.uid }).catch(console.error))
        deletedIds.forEach(id => deleteDoc(doc(db, 'acquisitions', id)).catch(console.error))
      }
      return next
    })
  }, [])

  const setRiskAnalyses = useCallback((value: RiskAnalysis[] | ((prev: RiskAnalysis[]) => RiskAnalysis[])) => {
    setInternalRiskAnalyses(current => {
      const newValue = typeof value === 'function' ? value(current) : value
      const sorted = sortRiskAnalyses(migrateRiskAnalyses(newValue))
      riskAnalysesRef.current = sorted

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = setTimeout(async () => {
        const u = userRef.current
        if (!u) return
        const companyId = activeCompanyIdRef.current
        const prev = prevRiskAnalysesRef.current
        const prevIds = new Set(prev.map(r => r.id))
        const nextIds = new Set(sorted.map(r => r.id))
        const deletedIds = [...prevIds].filter(id => !nextIds.has(id))
        prevRiskAnalysesRef.current = sorted

        sorted.forEach(r => setDoc(doc(db, 'riskAnalyses', r.id), { ...r, userId: u.uid, companyId }).catch(console.error))
        deletedIds.forEach(id => deleteDoc(doc(db, 'riskAnalyses', id)).catch(console.error))
      }, 800)

      return sorted
    })
  }, [])

  const riskAnalyses = useMemo(() => internalRiskAnalyses, [internalRiskAnalyses])
  const ganttActivities = useMemo(() => ganttActivitiesState, [ganttActivitiesState])

  const activeCompany = useMemo(
    () => companies.find(c => c.id === activeCompanyId) || null,
    [companies, activeCompanyId]
  )

  const activeProcessDocuments = useMemo(() => {
    if (!activeCompanyId) return []
    return processDocuments.filter(doc => doc.companyId === activeCompanyId)
  }, [processDocuments, activeCompanyId])

  // ─── Company CRUD ─────────────────────────────────────────────────────────

  const addCompany = useCallback(async (company: Omit<Company, 'id'>) => {
    const u = userRef.current
    if (!u) return
    const id = Date.now().toString()
    const newCompany: Company = { ...company, id }
    setCompanies(prev => [...prev, newCompany])
    await setDoc(doc(db, 'companies', id), { ...newCompany, userId: u.uid })
    toast({ title: 'Empresa añadida', description: `La empresa ${company.name} ha sido creada.` })
  }, [toast])

  const updateCompany = useCallback(async (updatedCompany: Company) => {
    const u = userRef.current
    if (!u) return
    setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c))
    await updateDoc(doc(db, 'companies', updatedCompany.id), { ...updatedCompany, userId: u.uid })
    toast({ title: 'Empresa actualizada', description: `Los datos de ${updatedCompany.name} han sido guardados.` })
  }, [toast])

  const deleteCompany = useCallback(async (companyId: string) => {
    const u = userRef.current
    if (!u) return

    const companyToDelete = companiesRef.current.find(c => c.id === companyId)
    const relatedDocs = processDocumentsRef.current.filter(d => d.companyId === companyId)
    const wasActive = activeCompanyIdRef.current === companyId

    if (!companyToDelete) return

    setCompanies(prev => prev.filter(c => c.id !== companyId))
    setProcessDocuments(prev => prev.filter(d => d.companyId !== companyId))
    if (wasActive) setActiveCompanyId(null)
    await deleteDoc(doc(db, 'companies', companyId))

    toast({
      title: 'Empresa eliminada',
      description: `"${companyToDelete.name}" ha sido eliminada.`,
      variant: 'destructive',
      action: (
        <ToastAction altText="Deshacer" onClick={async () => {
          const currentU = userRef.current
          setCompanies(prev => [...prev, companyToDelete])
          setProcessDocuments(prev => [...prev, ...relatedDocs])
          if (wasActive) setActiveCompanyId(companyToDelete.id)
          if (currentU) {
            await setDoc(doc(db, 'companies', companyToDelete.id), { ...companyToDelete, userId: currentU.uid })
          }
          toast({ title: 'Empresa restaurada', description: `"${companyToDelete.name}" ha sido recuperada.` })
        }}>
          Deshacer
        </ToastAction>
      ),
    })
  }, [setActiveCompanyId, toast])

  // ─── Process document CRUD ────────────────────────────────────────────────

  const addProcessDocument = useCallback(async (d: Omit<ProcessDocument, 'id' | 'companyId'>) => {
    const u = userRef.current
    if (!u || !activeCompanyId) return
    const id = Date.now().toString()
    const newDoc: ProcessDocument = {
      ...d, id, companyId: activeCompanyId,
      frequency: d.frequency || '', duration: d.duration || '',
      tools: d.tools || '', materials: d.materials || '',
      environmentalConditions: d.environmentalConditions || '',
      requiredTraining: d.requiredTraining || '',
    }
    setProcessDocuments(prev => [...prev, newDoc])
    await setDoc(doc(db, 'processDocuments', id), { ...newDoc, userId: u.uid })
    toast({ title: 'Proceso documentado', description: `La tarea ${d.taskName} ha sido añadida.` })
  }, [activeCompanyId, toast])

  const updateProcessDocument = useCallback(async (updatedDoc: ProcessDocument) => {
    const u = userRef.current
    if (!u) return
    const withDefaults = {
      ...updatedDoc,
      frequency: updatedDoc.frequency || '', duration: updatedDoc.duration || '',
      tools: updatedDoc.tools || '', materials: updatedDoc.materials || '',
      environmentalConditions: updatedDoc.environmentalConditions || '',
      requiredTraining: updatedDoc.requiredTraining || '',
    }
    setProcessDocuments(prev => prev.map(d => d.id === updatedDoc.id ? withDefaults : d))
    await updateDoc(doc(db, 'processDocuments', updatedDoc.id), { ...withDefaults, userId: u.uid })
    toast({ title: 'Proceso actualizado', description: `La tarea ${updatedDoc.taskName} ha sido guardada.` })
  }, [toast])

  const deleteProcessDocument = useCallback(async (docId: string) => {
    const u = userRef.current
    if (!u) return
    setProcessDocuments(prev => prev.filter(d => d.id !== docId))
    await deleteDoc(doc(db, 'processDocuments', docId))
    toast({ title: 'Proceso eliminado', variant: 'destructive' })
  }, [toast])

  // ─── updateRiskAnalysis ───────────────────────────────────────────────────

  const updateRiskAnalysis = useCallback((updatedPartial: Partial<RiskAnalysis> & { id: string }) => {
    setInternalRiskAnalyses(prev => {
      const newAnalyses = prev.map(r => {
        if (r.id !== updatedPartial.id) return r
        const merged = { ...r, ...updatedPartial }
        if (updatedPartial.security) {
          const { probability, consequence } = merged.security
          const vep = getVep(probability, consequence)
          const riskLevel = calculateRiskLevel(vep)
          merged.security.vep = vep?.toString() || ''
          merged.security.riskLevel = riskLevel
        }
        return merged
      })
      const sorted = sortRiskAnalyses(newAnalyses)
      riskAnalysesRef.current = sorted
      const u = userRef.current
      if (u) {
        const updated = sorted.find(r => r.id === updatedPartial.id)
        if (updated) setDoc(doc(db, 'riskAnalyses', updated.id), { ...updated, userId: u.uid, companyId: activeCompanyIdRef.current }).catch(console.error)
      }
      return sorted
    })
  }, [])

  // ─── Matrix operations ────────────────────────────────────────────────────

  const syncProcessesToMatrix = useCallback(() => {
    const existingProcessIds = new Set(riskAnalyses.map(r => r.processId))
    const newProcesses = activeProcessDocuments.filter(d => !existingProcessIds.has(d.id))
    if (newProcesses.length === 0) {
      toast({ title: 'Matriz Actualizada', description: 'No hay nuevos procesos para añadir.' })
      return
    }
    const newAnalyses: RiskAnalysis[] = newProcesses.map(d => ({
      id: `${d.id}-${Date.now()}`, processId: d.id, process: d.process,
      processDescription: d.processDescription, taskName: d.taskName, taskDescription: d.taskDescription,
      jobPositionsInvolved: d.jobPositionsInvolved, sexGenderIdentities: d.sexGenderIdentities,
      specificLocation: d.specificLocation, numberOfWorkers: d.numberOfWorkers,
      hazard: '', risk: '',
      security: { probability: '', consequence: '', vep: '', riskLevel: '' },
      hygienic: { riskLevel: 'No aplica' },
      psychosocial: { riskLevel: 'No aplica', dimension: '', justification: '' },
      musculoskeletal: { riskLevel: 'No aplica' },
      preventiveMeasures: [], riskCoordinates: { x: 0, y: 0 },
    }))
    setRiskAnalyses(prev => [...prev, ...newAnalyses])
    toast({ title: 'Procesos Sincronizados', description: `${newAnalyses.length} nueva(s) tarea(s) añadida(s).` })
  }, [riskAnalyses, activeProcessDocuments, setRiskAnalyses, toast])

  const addRiskAnalysisRow = useCallback((sourceRiskId: string) => {
    setRiskAnalyses(prev => {
      const sourceIndex = prev.findIndex(r => r.id === sourceRiskId)
      if (sourceIndex === -1) return prev
      const sourceRisk = prev[sourceIndex]
      const newRisk: RiskAnalysis = {
        id: `${sourceRisk.processId}-${Date.now()}`, processId: sourceRisk.processId,
        process: sourceRisk.process, processDescription: sourceRisk.processDescription,
        taskName: sourceRisk.taskName, taskDescription: sourceRisk.taskDescription,
        jobPositionsInvolved: sourceRisk.jobPositionsInvolved, sexGenderIdentities: sourceRisk.sexGenderIdentities,
        specificLocation: sourceRisk.specificLocation, numberOfWorkers: sourceRisk.numberOfWorkers,
        hazard: '', risk: '',
        security: { probability: '', consequence: '', vep: '', riskLevel: '' },
        hygienic: { riskLevel: 'No aplica' },
        psychosocial: { riskLevel: 'No aplica', dimension: '', justification: '' },
        musculoskeletal: { riskLevel: 'No aplica' },
        preventiveMeasures: [], riskCoordinates: { x: 0, y: 0 },
      }
      const newAnalyses = [...prev]
      newAnalyses.splice(sourceIndex + 1, 0, newRisk)
      return newAnalyses
    })
    toast({ title: 'Fila Añadida', description: 'Complete la información del nuevo peligro.' })
  }, [setRiskAnalyses, toast])

  const deleteRiskAnalysis = useCallback((riskId: string) => {
    let deletedRisk: RiskAnalysis | null = null
    let deletedIndex = -1
    setRiskAnalyses(prev => {
      const filtered = prev.filter((r, index) => {
        if (r.id === riskId) { deletedRisk = r; deletedIndex = index; return false }
        return true
      })
      if (deletedRisk) setLastDeletedRisk({ risk: deletedRisk, index: deletedIndex })
      return filtered
    })
    toast({ title: 'Fila eliminada', variant: 'destructive' })
  }, [setRiskAnalyses, toast])

  const undoDeleteRiskAnalysis = useCallback(() => {
    if (!lastDeletedRisk) return
    setRiskAnalyses(prev => {
      const newAnalyses = [...prev]
      newAnalyses.splice(lastDeletedRisk.index, 0, lastDeletedRisk.risk)
      return newAnalyses
    })
    setLastDeletedRisk(null)
    toast({ title: 'Restaurado', description: 'La fila eliminada ha sido restaurada.' })
  }, [lastDeletedRisk, setRiskAnalyses, toast])

  const clearActiveMatrix = useCallback(() => {
    setRiskAnalyses([])
    setGanttActivities([])
    setLastDeletedRisk(null)
    toast({ title: 'Matriz Limpiada' })
  }, [setRiskAnalyses, setGanttActivities, toast])

  const clearAllPreventiveMeasures = useCallback(() => {
    setRiskAnalyses(prev => prev.map(r => ({ ...r, preventiveMeasures: [] })))
    toast({ title: 'Medidas Eliminadas', variant: 'destructive' })
  }, [setRiskAnalyses, toast])

  const clearAllEvaluations = useCallback(() => {
    setRiskAnalyses(prev => prev.map(r => ({
      ...r,
      security: { probability: '', consequence: '', vep: '', riskLevel: '' },
      hygienic: { riskLevel: 'No aplica' },
      psychosocial: { riskLevel: 'No aplica', dimension: '', justification: '' },
      musculoskeletal: { riskLevel: 'No aplica' },
    })))
    toast({ title: 'Evaluaciones Eliminadas', variant: 'destructive' })
  }, [setRiskAnalyses, toast])

  // ─── AI operations ────────────────────────────────────────────────────────

  const identifyRisksWithAI = useCallback(async (): Promise<void> => {
    const risksToAnalyze = riskAnalyses.filter(r => !r.hazard && !r.risk)
    if (risksToAnalyze.length === 0) {
      toast({ title: 'Sin tareas para analizar', description: 'Todas las tareas ya tienen riesgos identificados.' })
      return
    }
    setLoadingAI(true)
    let finalMatrix = [...riskAnalyses]
    try {
      for (let i = 0; i < risksToAnalyze.length; i++) {
        const risk = risksToAnalyze[i]
        toast({ title: `Procesando ${i + 1} / ${risksToAnalyze.length}`, description: `Identificando peligros para "${risk.taskName}"...` })
        const processDoc = activeProcessDocuments.find(d => d.id === risk.processId)
        if (!processDoc) continue
        const results = await createTasksAndRisks({
          process: processDoc.process, processDescription: processDoc.processDescription,
          jobPositionsInvolved: processDoc.jobPositionsInvolved, taskDescription: processDoc.taskDescription,
          isRoutine: processDoc.isRoutine, specificLocation: processDoc.specificLocation,
          numberOfWorkers: processDoc.numberOfWorkers, sexGenderIdentities: processDoc.sexGenderIdentities,
          observations: processDoc.observations || '',
        })
        const newRisksFromAI: RiskAnalysis[] = results.map((result, k) => ({
          ...risk, id: `${risk.id}-ai-${k}`, hazard: result.hazard, risk: result.riskEvent,
        }))
        if (newRisksFromAI.length === 0) continue
        const idx = finalMatrix.findIndex(r => r.id === risk.id)
        if (idx !== -1) { finalMatrix.splice(idx, 1, ...newRisksFromAI); setRiskAnalyses(finalMatrix) }
      }
      toast({ title: 'Identificación Completa' })
    } catch (error) {
      toast({ title: 'Error de IA', variant: 'destructive' })
    } finally {
      setLoadingAI(false)
    }
  }, [riskAnalyses, activeProcessDocuments, setRiskAnalyses, toast])

  const identifyRisksForRisk = useCallback(async (riskId: string): Promise<void> => {
    const riskToAnalyze = riskAnalyses.find(r => r.id === riskId)
    if (!riskToAnalyze) return
    if (riskToAnalyze.hazard || riskToAnalyze.risk) {
      toast({ title: 'Riesgo ya analizado' }); return
    }
    setLoadingAI(true)
    const finalMatrix = [...riskAnalyses]
    try {
      const processDoc = activeProcessDocuments.find(d => d.id === riskToAnalyze.processId)
      if (!processDoc) { setLoadingAI(false); return }
      const results = await createTasksAndRisks({
        process: processDoc.process, processDescription: processDoc.processDescription,
        jobPositionsInvolved: processDoc.jobPositionsInvolved, taskDescription: processDoc.taskDescription,
        isRoutine: processDoc.isRoutine, specificLocation: processDoc.specificLocation,
        numberOfWorkers: processDoc.numberOfWorkers, sexGenderIdentities: processDoc.sexGenderIdentities,
        observations: processDoc.observations || '',
      })
      const idx = finalMatrix.findIndex(r => r.id === riskId)
      if (results.length > 0) {
        const newRisks: RiskAnalysis[] = results.map((result, i) => ({
          ...riskToAnalyze, id: `${riskToAnalyze.id}-ai-${i}`, hazard: result.hazard, risk: result.riskEvent,
        }))
        if (idx !== -1) finalMatrix.splice(idx, 1, ...newRisks)
        else finalMatrix.push(...newRisks)
        setRiskAnalyses(finalMatrix)
        toast({ title: 'Identificación Completa', description: `${newRisks.length} peligros identificados.` })
      }
    } catch {
      toast({ title: 'Error de IA', variant: 'destructive' })
    } finally {
      setLoadingAI(false)
    }
  }, [riskAnalyses, activeProcessDocuments, setRiskAnalyses, toast])

  const identifyRisksForProcess = useCallback(async (processId: string) => {
    const risksForProcess = riskAnalyses.filter(r => r.processId === processId && !r.hazard && !r.risk)
    if (risksForProcess.length === 0) {
      toast({ title: 'Sin Tareas para Analizar' }); return
    }
    setLoadingAI(true)
    const finalMatrix = [...riskAnalyses]
    try {
      for (const risk of risksForProcess) {
        const processDoc = activeProcessDocuments.find(d => d.id === risk.processId)
        if (!processDoc) continue
        const results = await createTasksAndRisks({
          process: processDoc.process, processDescription: processDoc.processDescription,
          jobPositionsInvolved: processDoc.jobPositionsInvolved, taskDescription: processDoc.taskDescription,
          isRoutine: processDoc.isRoutine, specificLocation: processDoc.specificLocation,
          numberOfWorkers: processDoc.numberOfWorkers, sexGenderIdentities: processDoc.sexGenderIdentities,
          observations: processDoc.observations || '',
        })
        const idx = finalMatrix.findIndex(r => r.id === risk.id)
        if (results.length > 0 && idx !== -1) {
          const newRisks: RiskAnalysis[] = results.map((result, k) => ({
            ...risk, id: `${risk.id}-ai-${k}`, hazard: result.hazard, risk: result.riskEvent,
          }))
          finalMatrix.splice(idx, 1, ...newRisks)
        }
      }
      setRiskAnalyses(finalMatrix)
      toast({ title: 'Análisis Completo', description: 'Redirigiendo a la matriz...' })
      router.push('/risk-matrix')
    } catch {
      toast({ title: 'Error de IA', variant: 'destructive' })
    } finally {
      setLoadingAI(false)
    }
  }, [riskAnalyses, activeProcessDocuments, setRiskAnalyses, toast, router])

  const evaluateRisksWithAI = useCallback(async (risks?: RiskAnalysis[]): Promise<RiskAnalysis[]> => {
    const risksToUse = risks || riskAnalyses
    const toEvaluate = risksToUse.filter(r => r.hazard && r.risk && !r.security.riskLevel)
    if (toEvaluate.length === 0) {
      toast({ title: 'Sin riesgos para evaluar' })
      return risksToUse
    }
    setLoadingAI(true)
    let finalRisks = [...risksToUse]
    try {
      for (let i = 0; i < toEvaluate.length; i += 2) {
        const batch = toEvaluate.slice(i, i + 2)
        toast({ title: `Evaluando ${i / 2 + 1}/${Math.ceil(toEvaluate.length / 2)}`, description: `Evaluando ${batch.length} riesgos...` })
        const promises = batch.map(async risk => {
          const processDoc = activeProcessDocuments.find(d => d.id === risk.processId)
          const evaluation = await evaluateRisks({
            process: risk.process, taskName: risk.taskName, hazard: risk.hazard, riskEvent: risk.risk,
            jobPositionsInvolved: risk.jobPositionsInvolved, sexGenderIdentities: processDoc?.sexGenderIdentities || '',
          })
          const vep = getVep(evaluation.security.probability, evaluation.security.consequence)
          const securityRiskLevel = calculateRiskLevel(vep)
          return {
            originalId: risk.id,
            data: {
              id: risk.id,
              security: { ...evaluation.security, vep: vep?.toString() || '', riskLevel: securityRiskLevel },
              hygienic: evaluation.hygienic,
              psychosocial: evaluation.psychosocial,
              musculoskeletal: evaluation.musculoskeletal,
            },
          }
        })
        const batchResults = await Promise.all(promises)
        batchResults.forEach(result => {
          const idx = finalRisks.findIndex(r => r.id === result.originalId)
          if (idx !== -1) finalRisks[idx] = { ...finalRisks[idx], ...result.data }
        })
        setRiskAnalyses(finalRisks)
      }
      toast({ title: 'Evaluación Completa' })
      return finalRisks
    } catch (error) {
      toast({ title: 'Error de IA', variant: 'destructive' })
      throw error
    } finally {
      setLoadingAI(false)
    }
  }, [riskAnalyses, activeProcessDocuments, setRiskAnalyses, toast])

  const suggestControlsWithAI = useCallback(async (riskId: string): Promise<SuggestControlMeasuresOutput | null> => {
    const risk = riskAnalyses.find(r => r.id === riskId)
    if (!risk || !risk.hazard) { toast({ title: 'Falta contexto', variant: 'destructive' }); return null }
    const processDoc = activeProcessDocuments.find(d => d.id === risk.processId)
    setLoadingAI(true)
    try {
      const result = await suggestControlMeasures(
        {
          process: risk.process, processDescription: processDoc?.processDescription || '',
          task: risk.taskName, hazard: risk.hazard, risk: risk.risk,
          probability: risk.security.probability, consequence: risk.security.consequence, riskLevel: risk.security.riskLevel,
          frequency: processDoc?.frequency, duration: processDoc?.duration,
          tools: processDoc?.tools, materials: processDoc?.materials,
          environmentalConditions: processDoc?.environmentalConditions, requiredTraining: processDoc?.requiredTraining,
        },
        { hygienic: risk.hygienic, psychosocial: risk.psychosocial as any, musculoskeletal: risk.musculoskeletal }
      )
      toast({ title: 'Sugerencias generadas' })
      return result
    } catch {
      toast({ title: 'Error de IA', variant: 'destructive' })
      return null
    } finally {
      setLoadingAI(false)
    }
  }, [riskAnalyses, activeProcessDocuments, toast])

  const suggestAllControlMeasuresWithAI = useCallback(async (risks: RiskAnalysis[], _overwrite: boolean): Promise<RiskAnalysis[]> => {
    const toProcess = risks.filter(r => r.security.riskLevel && r.preventiveMeasures.length === 0)
    if (toProcess.length === 0) {
      toast({ title: 'Sin riesgos para completar' })
      return risks
    }
    setLoadingAI(true)
    let finalRisks = [...risks]
    try {
      for (let i = 0; i < toProcess.length; i += 2) {
        const batch = toProcess.slice(i, i + 2)
        toast({ title: `Procesando ${i / 2 + 1}/${Math.ceil(toProcess.length / 2)}`, description: `Generando medidas para ${batch.length} riesgos...` })
        const promises = batch.map(async risk => {
          const processDoc = activeProcessDocuments.find(d => d.id === risk.processId)
          const suggestions = await suggestControlMeasures(
            {
              process: risk.process, processDescription: processDoc?.processDescription || '',
              task: risk.taskName, hazard: risk.hazard, risk: risk.risk,
              probability: risk.security.probability, consequence: risk.security.consequence, riskLevel: risk.security.riskLevel,
              frequency: processDoc?.frequency, duration: processDoc?.duration,
              tools: processDoc?.tools, materials: processDoc?.materials,
              environmentalConditions: processDoc?.environmentalConditions, requiredTraining: processDoc?.requiredTraining,
            },
            { hygienic: risk.hygienic, psychosocial: risk.psychosocial as any, musculoskeletal: risk.musculoskeletal }
          )
          if (suggestions.length > 0) {
            const newMeasures: ControlMeasure[] = suggestions.map((s, index) => ({
              id: `measure-${risk.id}-${Date.now()}-${index}`, description: s.description,
              classification: s.classification, responsible: '', startDate: '', endDate: '', status: 'Pendiente',
            }))
            return { id: risk.id, preventiveMeasures: newMeasures }
          }
          return { id: risk.id, preventiveMeasures: risk.preventiveMeasures }
        })
        const batchResults = await Promise.all(promises)
        const resultsMap = new Map(batchResults.map(r => [r.id, r.preventiveMeasures]))
        finalRisks = finalRisks.map(r => resultsMap.has(r.id) ? { ...r, preventiveMeasures: resultsMap.get(r.id)! } : r)
        setRiskAnalyses(finalRisks)
      }
      toast({ title: 'Medidas Completadas' })
      return finalRisks
    } catch {
      toast({ title: 'Error de IA', variant: 'destructive' })
      throw new Error('AI failed')
    } finally {
      setLoadingAI(false)
    }
  }, [setRiskAnalyses, toast, activeProcessDocuments])

  const runFullAIMatrix = useCallback(async (_taskCount: number) => {
    setLoadingAI(true)
    try {
      toast({ title: 'Paso 1/3', description: 'Identificando peligros...' })
      await identifyRisksWithAI()
      const identified = riskAnalysesRef.current
      toast({ title: 'Paso 2/3', description: 'Evaluando riesgos...' })
      const evaluated = await evaluateRisksWithAI(identified)
      toast({ title: 'Paso 3/3', description: 'Sugiriendo medidas...' })
      await suggestAllControlMeasuresWithAI(evaluated, true)
      toast({ title: '¡Matriz Completa!' })
    } catch {
      toast({ title: 'Error en el Proceso Automático', variant: 'destructive' })
    } finally {
      setLoadingAI(false)
    }
  }, [identifyRisksWithAI, evaluateRisksWithAI, suggestAllControlMeasuresWithAI, toast])

  // ─── Saved matrices ────────────────────────────────────────────────────────

  const saveCurrentMatrix = useCallback(async (name: string) => {
    if (!activeCompany) { toast({ title: 'Se necesita empresa activa', variant: 'destructive' }); return }
    const u = userRef.current
    if (!u) return
    const id = Date.now().toString()
    const newMatrix: SavedMatrix = {
      id, name, companyId: activeCompany.id, companyName: activeCompany.name,
      savedAt: new Date().toISOString(), riskAnalyses, ganttActivities,
    }
    setSavedMatrices(prev => [...prev, newMatrix])
    await setDoc(doc(db, 'savedMatrices', id), { ...newMatrix, userId: u.uid })
    toast({ title: 'Matriz Guardada', description: `Se ha guardado '${name}'.` })
  }, [activeCompany, riskAnalyses, ganttActivities, toast])

  const loadMatrix = useCallback((matrixId: string) => {
    const matrix = savedMatrices.find(m => m.id === matrixId)
    if (!matrix) return
    setActiveCompanyId(matrix.companyId)
    setRiskAnalyses(migrateRiskAnalyses(matrix.riskAnalyses))
    setGanttActivities(matrix.ganttActivities || [])
    setLastDeletedRisk(null)
    toast({ title: 'Matriz Cargada', description: `Se ha cargado '${matrix.name}'.` })
    router.push('/risk-matrix')
  }, [savedMatrices, setActiveCompanyId, setRiskAnalyses, setGanttActivities, toast, router])

  const deleteMatrix = useCallback(async (matrixId: string) => {
    setSavedMatrices(prev => prev.filter(m => m.id !== matrixId))
    await deleteDoc(doc(db, 'savedMatrices', matrixId))
    toast({ title: 'Matriz Eliminada', variant: 'destructive' })
  }, [toast])

  // ─── Gantt ────────────────────────────────────────────────────────────────

  const updateGanttActivity = useCallback((activityOrActivities: GanttActivity | GanttActivity[]) => {
    const toUpdate = Array.isArray(activityOrActivities) ? activityOrActivities : [activityOrActivities]
    const activityMap = new Map(toUpdate.map(a => [a.id, a]))
    setGanttActivities(prev => {
      const updatedActivities: GanttActivity[] = []
      const existingIds = new Set<string>()
      prev.forEach(old => {
        updatedActivities.push(activityMap.has(old.id) ? { ...old, ...activityMap.get(old.id) } : old)
        existingIds.add(old.id)
      })
      toUpdate.forEach(a => { if (!existingIds.has(a.id)) updatedActivities.push(a) })
      return updatedActivities
    })
  }, [setGanttActivities])

  const generateGanttPlanWithAI = useCallback(async (): Promise<void> => {
    const allMeasures = riskAnalyses.flatMap(risk =>
      risk.preventiveMeasures.map(measure => ({
        ...measure, riskId: risk.id, risk: risk.risk, measure: measure.description, riskLevel: risk.security.riskLevel,
      }))
    )
    const ganttMap = new Map(ganttActivities.map(a => [a.id, a]))
    const toPlan = allMeasures.filter(m => {
      const existing = ganttMap.get(m.id)
      return (!existing || existing.status === 'Pendiente') && m.riskLevel && m.riskLevel !== 'Tolerable'
    })
    if (toPlan.length === 0) { toast({ title: 'Sin medidas para planificar' }); return }
    setLoadingAI(true)
    try {
      const plan = await createGanttPlan(toPlan)
      const updated = plan.map(p => {
        const original = allMeasures.find(m => m.id === p.id)!
        const existing = ganttMap.get(p.id)
        return { ...(existing || {}), ...original, ...p }
      })
      updateGanttActivity(updated)
      toast({ title: 'Plan Actualizado', description: `${updated.length} actividades actualizadas.` })
    } catch {
      toast({ title: 'Error de IA', variant: 'destructive' })
    } finally {
      setLoadingAI(false)
    }
  }, [riskAnalyses, ganttActivities, toast, updateGanttActivity])

  const generateGanttPlanWithTestData = useCallback(() => {
    const allMeasures = riskAnalyses.flatMap(risk =>
      risk.preventiveMeasures.map(measure => ({
        ...measure, riskId: risk.id, risk: risk.risk, measure: measure.description, riskLevel: risk.security.riskLevel,
      }))
    )
    const ganttMap = new Map(ganttActivities.map(a => [a.id, a]))
    const toPlan = allMeasures.filter(m => !ganttMap.get(m.id) || ganttMap.get(m.id)?.status === 'Pendiente')
    if (toPlan.length === 0) { toast({ title: 'Sin medidas para planificar' }); return }
    const responsibles = ['Jefe de Área', 'Supervisor', 'Comité Paritario', 'Gerente', 'Prevencionista']
    const statuses: GanttActivity['status'][] = ['En progreso', 'Pendiente']
    const today = new Date()
    const updated = toPlan.map(measure => {
      const existing = ganttMap.get(measure.id)
      let startDate: Date, endDate: Date, priority: GanttActivity['priority']
      switch (measure.riskLevel) {
        case 'Alto': case 'Intolerable': startDate = addDays(today, Math.floor(Math.random() * 3)); endDate = addWeeks(startDate, 2); priority = 'Crítica'; break
        case 'Medio': case 'Moderado': startDate = addDays(today, Math.floor(Math.random() * 7)); endDate = addWeeks(startDate, 3); priority = 'Media'; break
        default: startDate = today; endDate = addMonths(today, 1); priority = 'Baja'
      }
      return {
        ...(existing || {}), ...measure, priority,
        responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
        startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd'),
        status: statuses[Math.floor(Math.random() * statuses.length)],
      }
    })
    updateGanttActivity(updated)
    toast({ title: 'Datos de Prueba Generados', description: `${updated.length} actividades generadas.` })
  }, [riskAnalyses, ganttActivities, toast, updateGanttActivity])

  // ─── Acquisitions ─────────────────────────────────────────────────────────

  const createAcquisition = useCallback((line: Omit<PurchaseLine, 'id' | 'createdAt' | 'updatedAt' | 'status'>): PurchaseLine => {
    const newLine: PurchaseLine = {
      ...line, id: Date.now().toString(), companyId: line.companyId || activeCompany?.id,
      status: 'Draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      requestedBy: line.requestedBy || activeCompany?.responsible || 'Usuario',
    }
    if (typeof newLine.unitCost === 'number' && typeof newLine.quantityRequested === 'number') {
      newLine.totalCost = newLine.unitCost * newLine.quantityRequested
    }
    setAcquisitions(prev => [...prev, newLine])
    toast({ title: 'Requisición creada', description: `Se ha agregado ${newLine.article}.` })
    return newLine
  }, [setAcquisitions, toast, activeCompany])

  const updateAcquisition = useCallback((updated: Partial<PurchaseLine> & { id: string }) => {
    setAcquisitions(prev => prev.map(a => {
      if (a.id !== updated.id) return a
      const merged = { ...a, ...updated, updatedAt: new Date().toISOString() } as PurchaseLine
      if (typeof merged.unitCost === 'number' && typeof merged.quantityRequested === 'number') {
        merged.totalCost = merged.unitCost * merged.quantityRequested
      }
      return merged
    }))
  }, [setAcquisitions])

  const deleteAcquisition = useCallback((id: string) => {
    setAcquisitions(prev => prev.filter(a => a.id !== id))
    toast({ title: 'Requisición eliminada', variant: 'destructive' })
  }, [setAcquisitions, toast])

  const createAcquisitionsFromItems = useCallback((items: any[], granular = false): PurchaseLine[] => {
    const newLines: PurchaseLine[] = []
    items.forEach(i => {
      const base = {
        companyId: activeCompany?.id, originMeasureId: i.id,
        article: i.description || (i.items?.length ? i.items[0] : 'Artículo'),
        classification: i.classification || 'EPP', quantityRequested: i.quantity || 1,
      } as Omit<PurchaseLine, 'id' | 'createdAt' | 'updatedAt' | 'status'>
      if (granular && i.items?.length > 0) {
        i.items.forEach((it: string) => newLines.push(createAcquisition({ ...base, article: it })))
      } else {
        newLines.push(createAcquisition(base))
      }
    })
    return newLines
  }, [createAcquisition, activeCompany?.id])

  const requestApproval = useCallback((id: string) => {
    setAcquisitions(prev => prev.map(a => a.id === id ? { ...a, status: 'Requested', updatedAt: new Date().toISOString() } : a))
    toast({ title: 'Requisición solicitada' })
  }, [setAcquisitions, toast])

  const approveAcquisition = useCallback((id: string) => {
    setAcquisitions(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, status: 'Approved' as AcquisitionStatus, updatedAt: new Date().toISOString() } : a)
      const approved = updated.find(a => a.id === id)
      if (approved) {
        const activity: GanttActivity = {
          id: approved.id, riskId: approved.originRiskId || '', risk: '', measure: approved.article,
          classification: approved.classification, riskLevel: 'Medio', priority: 'Media',
          responsible: activeCompany?.responsible || '',
          startDate: approved.requiredBy || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          endDate: format(addDays(new Date(approved.requiredBy || new Date().toISOString()), 7), 'yyyy-MM-dd'),
          status: 'Pendiente',
        }
        updateGanttActivity(activity)
        toast({ title: 'Requisición aprobada' })
      }
      return updated
    })
  }, [setAcquisitions, updateGanttActivity, activeCompany, toast])

  // ─── Exports ───────────────────────────────────────────────────────────────

  const exportToExcel = useCallback(async () => {
    if (!activeCompany) return
    const ExcelJS = (await import('exceljs')).default as any
    const workbook = new ExcelJS.Workbook()
    const wsCompany = workbook.addWorksheet('Info Empresa')
    ;[
      ['Nombre Empresa', activeCompany.name], ['RUT', activeCompany.rut],
      ['Dirección', activeCompany.address], ['Comuna', activeCompany.commune],
      ['Actividad Económica', activeCompany.economicActivity],
      ['N° Trabajadores', activeCompany.numWorkers], ['Responsable', activeCompany.responsible],
    ].forEach(row => wsCompany.addRow(row))
    const wsProcesses = workbook.addWorksheet('Procesos')
    if (activeProcessDocuments.length > 0) {
      wsProcesses.addRow(['Proceso', 'Descripción', 'Puestos', 'Tarea', 'Descripción Tarea', 'Rutinaria', 'Ubicación', 'N° Trabajadores', 'Frecuencia', 'Duración', 'Herramientas', 'Materiales', 'Condiciones', 'Capacitación', 'Observaciones'])
      activeProcessDocuments.forEach(p => wsProcesses.addRow([p.process, p.processDescription, p.jobPositionsInvolved, p.taskName, p.taskDescription, p.isRoutine ? 'Sí' : 'No', p.specificLocation, p.numberOfWorkers, p.frequency || '', p.duration || '', p.tools || '', p.materials || '', p.environmentalConditions || '', p.requiredTraining || '', p.observations || '']))
    }
    const wsMatrix = workbook.addWorksheet('Matriz de Riesgos')
    if (riskAnalyses.length > 0) {
      wsMatrix.addRow(['Proceso', 'Puestos', 'Tareas', 'Peligros', 'Riesgo', 'Probabilidad', 'Consecuencia', 'VEP', 'NR Seguridad', 'NR Higiénico', 'NR Psicosocial', 'Dimensión Psicosocial', 'NR Musculoesquelético', 'Medidas Preventivas'])
      riskAnalyses.forEach(r => wsMatrix.addRow([r.process, r.jobPositionsInvolved, r.taskName, r.hazard, r.risk, r.security?.probability, r.security?.consequence, r.security?.vep, r.security?.riskLevel, r.hygienic?.riskLevel, r.psychosocial?.riskLevel, r.psychosocial?.dimension, r.musculoskeletal?.riskLevel, r.preventiveMeasures.map((m: any) => m.description).join('\n')]))
    }
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${activeCompany.name}_Matriz_de_Riesgos.xlsx`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    toast({ title: 'Exportado a Excel' })
  }, [activeCompany, activeProcessDocuments, riskAnalyses, toast])

  const exportToPDF = useCallback(async () => {
    if (!activeCompany) return
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const docPDF = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    docPDF.setFontSize(18)
    docPDF.text(`Matriz de Riesgos - ${activeCompany.name}`, 14, 22)
    autoTable(docPDF, {
      startY: 45,
      head: [['Proceso', 'Tarea', 'Peligro', 'Riesgo', 'P', 'S', 'VEP', 'NR Seg.', 'NR Hig.', 'NR Psic.', 'Dim.', 'NR ME', 'Medidas']],
      body: riskAnalyses.map(r => [r.process, r.taskName, r.hazard, r.risk, r.security.probability, r.security.consequence, r.security.vep, r.security.riskLevel, r.hygienic.riskLevel, r.psychosocial.riskLevel, r.psychosocial.dimension, r.musculoskeletal.riskLevel, r.preventiveMeasures.map(m => `• ${m.description}`).join('\n')]) as any,
      theme: 'striped', headStyles: { fillColor: [34, 49, 63] },
      styles: { fontSize: 5, cellPadding: 1, valign: 'middle' },
    })
    docPDF.save(`${activeCompany.name}_Matriz_de_Riesgos.pdf`)
    toast({ title: 'Exportado a PDF' })
  }, [activeCompany, riskAnalyses, toast])

  const exportGanttToPDF = useCallback(async () => {
    if (!activeCompany || ganttActivities.length === 0) return
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const docPDF = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    docPDF.setFontSize(18)
    docPDF.text(`Plan de Acción - ${activeCompany.name}`, 14, 22)
    autoTable(docPDF, {
      startY: 40,
      head: [['Actividad', 'Clasificación', 'Nivel de Riesgo', 'Prioridad', 'Responsable', 'Inicio', 'Fin', 'Estado']],
      body: ganttActivities.map(a => [a.measure, a.classification, a.riskLevel, a.priority, a.responsible, a.startDate, a.endDate, a.status]) as any,
      theme: 'striped', headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8, cellPadding: 2 },
    })
    docPDF.save(`${activeCompany.name}_Plan_de_Accion.pdf`)
    toast({ title: 'Plan de Acción Exportado' })
  }, [activeCompany, ganttActivities, toast])

  // ─── Context value ─────────────────────────────────────────────────────────

  const value: LaborsafeGContextType = {
    companies, activeCompanyId, activeCompany, addCompany, updateCompany, deleteCompany, setActiveCompanyId,
    processDocuments, activeProcessDocuments, addProcessDocument, updateProcessDocument, deleteProcessDocument,
    riskAnalyses, setRiskAnalyses, syncProcessesToMatrix, identifyRisksWithAI, identifyRisksForRisk,
    identifyRisksForProcess, evaluateRisksWithAI, suggestControlsWithAI, suggestAllControlMeasuresWithAI,
    runFullAIMatrix, updateRiskAnalysis, addRiskAnalysisRow, deleteRiskAnalysis, undoDeleteRiskAnalysis,
    lastDeletedRisk, clearActiveMatrix, loadingAI, clearAllPreventiveMeasures, clearAllEvaluations,
    savedMatrices, saveCurrentMatrix, loadMatrix, deleteMatrix,
    ganttActivities, setGanttActivities, generateGanttPlanWithAI, generateGanttPlanWithTestData, updateGanttActivity,
    exportToExcel, exportToPDF, exportGanttToPDF,
    layoutPlan, setLayoutPlan,
    acquisitions: acquisitionsState, setAcquisitions, createAcquisition, updateAcquisition, deleteAcquisition, createAcquisitionsFromItems,
    currentUserRole, setCurrentUserRole, requestApproval, approveAcquisition,
  }

  if (!isMounted) return null

  return (
    <LaborsafeGContext.Provider value={value}>
      {children}
    </LaborsafeGContext.Provider>
  )
}
