import { prisma } from '../db/client'

const MAX_VERSIONS = 10

export interface ConfigPayload {
  inputs: unknown
  simpleModeInputs?: unknown
  scenarios?: unknown
  mode?: string
  showNominal?: boolean
  schemaVersion?: number
}

export async function loadConfig(userId: string) {
  return prisma.userConfig.findUnique({ where: { userId } })
}

export async function saveConfig(userId: string, payload: ConfigPayload) {
  // Snapshot current config as a version before overwriting
  const existing = await prisma.userConfig.findUnique({ where: { userId } })
  if (existing) {
    await prisma.configVersion.create({
      data: {
        userId,
        snapshot: {
          inputs: existing.inputs,
          simpleModeInputs: existing.simpleModeInputs,
          scenarios: existing.scenarios,
          mode: existing.mode,
          showNominal: existing.showNominal,
          schemaVersion: existing.schemaVersion,
          savedAt: existing.savedAt,
        },
      },
    })
    // Prune old versions — keep only the most recent MAX_VERSIONS
    const versions = await prisma.configVersion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: MAX_VERSIONS,
      select: { id: true },
    })
    if (versions.length > 0) {
      await prisma.configVersion.deleteMany({
        where: { id: { in: versions.map(v => v.id) } },
      })
    }
  }

  return prisma.userConfig.upsert({
    where: { userId },
    create: {
      userId,
      inputs: payload.inputs as object,
      simpleModeInputs: payload.simpleModeInputs as object | undefined,
      scenarios: (payload.scenarios ?? []) as object,
      mode: payload.mode ?? 'simple',
      showNominal: payload.showNominal ?? true,
      schemaVersion: payload.schemaVersion ?? 1,
      savedAt: new Date(),
    },
    update: {
      inputs: payload.inputs as object,
      simpleModeInputs: payload.simpleModeInputs as object | undefined,
      scenarios: (payload.scenarios ?? []) as object,
      mode: payload.mode ?? 'simple',
      showNominal: payload.showNominal ?? true,
      schemaVersion: payload.schemaVersion ?? 1,
      savedAt: new Date(),
    },
  })
}

export async function listVersions(userId: string) {
  return prisma.configVersion.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: MAX_VERSIONS,
    select: { id: true, label: true, createdAt: true, snapshot: true },
  })
}

export async function restoreVersion(userId: string, versionId: string) {
  const version = await prisma.configVersion.findFirst({
    where: { id: versionId, userId },
  })
  if (!version) return null
  const snap = version.snapshot as ConfigPayload
  return saveConfig(userId, snap)
}
