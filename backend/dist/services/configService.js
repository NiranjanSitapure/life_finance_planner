"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.listVersions = listVersions;
exports.restoreVersion = restoreVersion;
const client_1 = require("../db/client");
const MAX_VERSIONS = 10;
async function loadConfig(userId) {
    return client_1.prisma.userConfig.findUnique({ where: { userId } });
}
async function saveConfig(userId, payload) {
    // Snapshot current config as a version before overwriting
    const existing = await client_1.prisma.userConfig.findUnique({ where: { userId } });
    if (existing) {
        await client_1.prisma.configVersion.create({
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
        });
        // Prune old versions — keep only the most recent MAX_VERSIONS
        const versions = await client_1.prisma.configVersion.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip: MAX_VERSIONS,
            select: { id: true },
        });
        if (versions.length > 0) {
            await client_1.prisma.configVersion.deleteMany({
                where: { id: { in: versions.map(v => v.id) } },
            });
        }
    }
    return client_1.prisma.userConfig.upsert({
        where: { userId },
        create: {
            userId,
            inputs: payload.inputs,
            simpleModeInputs: payload.simpleModeInputs,
            scenarios: (payload.scenarios ?? []),
            mode: payload.mode ?? 'simple',
            showNominal: payload.showNominal ?? true,
            schemaVersion: payload.schemaVersion ?? 1,
            savedAt: new Date(),
        },
        update: {
            inputs: payload.inputs,
            simpleModeInputs: payload.simpleModeInputs,
            scenarios: (payload.scenarios ?? []),
            mode: payload.mode ?? 'simple',
            showNominal: payload.showNominal ?? true,
            schemaVersion: payload.schemaVersion ?? 1,
            savedAt: new Date(),
        },
    });
}
async function listVersions(userId) {
    return client_1.prisma.configVersion.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_VERSIONS,
        select: { id: true, label: true, createdAt: true, snapshot: true },
    });
}
async function restoreVersion(userId, versionId) {
    const version = await client_1.prisma.configVersion.findFirst({
        where: { id: versionId, userId },
    });
    if (!version)
        return null;
    const snap = version.snapshot;
    return saveConfig(userId, snap);
}
