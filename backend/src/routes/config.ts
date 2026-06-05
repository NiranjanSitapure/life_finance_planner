import { Router, type Response } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthRequest } from '../middleware/requireAuth'
import { loadConfig, saveConfig, listVersions, restoreVersion } from '../services/configService'

export const configRouter = Router()

// Load saved config
configRouter.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await loadConfig(req.userId!)
    if (!config) { res.status(404).json({ error: 'No saved config' }); return }
    res.json(config)
  } catch {
    res.status(500).json({ error: 'Failed to load config' })
  }
})

const SaveConfigSchema = z.object({
  inputs: z.record(z.unknown()),
  simpleModeInputs: z.record(z.unknown()).optional(),
  scenarios: z.array(z.unknown()).optional(),
  mode: z.enum(['simple', 'intermediate', 'advanced']).optional(),
  showNominal: z.boolean().optional(),
  schemaVersion: z.number().int().optional(),
})

// Save / upsert config
configRouter.put('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = SaveConfigSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
    return
  }
  try {
    const saved = await saveConfig(req.userId!, parsed.data)
    res.json(saved)
  } catch {
    res.status(500).json({ error: 'Failed to save config' })
  }
})

// List version history
configRouter.get('/versions', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const versions = await listVersions(req.userId!)
    res.json(versions)
  } catch {
    res.status(500).json({ error: 'Failed to list versions' })
  }
})

// Restore a version
configRouter.post('/versions/:id/restore', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restored = await restoreVersion(req.userId!, req.params.id as string)
    if (!restored) { res.status(404).json({ error: 'Version not found' }); return }
    res.json(restored)
  } catch {
    res.status(500).json({ error: 'Failed to restore version' })
  }
})
