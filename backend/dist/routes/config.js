"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const requireAuth_1 = require("../middleware/requireAuth");
const configService_1 = require("../services/configService");
exports.configRouter = (0, express_1.Router)();
// Load saved config
exports.configRouter.get('/', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const config = await (0, configService_1.loadConfig)(req.userId);
        if (!config) {
            res.status(404).json({ error: 'No saved config' });
            return;
        }
        res.json(config);
    }
    catch {
        res.status(500).json({ error: 'Failed to load config' });
    }
});
const SaveConfigSchema = zod_1.z.object({
    inputs: zod_1.z.record(zod_1.z.unknown()),
    simpleModeInputs: zod_1.z.record(zod_1.z.unknown()).optional(),
    scenarios: zod_1.z.array(zod_1.z.unknown()).optional(),
    mode: zod_1.z.enum(['simple', 'intermediate', 'advanced']).optional(),
    showNominal: zod_1.z.boolean().optional(),
    schemaVersion: zod_1.z.number().int().optional(),
});
// Save / upsert config
exports.configRouter.put('/', requireAuth_1.requireAuth, async (req, res) => {
    const parsed = SaveConfigSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
    }
    try {
        const saved = await (0, configService_1.saveConfig)(req.userId, parsed.data);
        res.json(saved);
    }
    catch {
        res.status(500).json({ error: 'Failed to save config' });
    }
});
// List version history
exports.configRouter.get('/versions', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const versions = await (0, configService_1.listVersions)(req.userId);
        res.json(versions);
    }
    catch {
        res.status(500).json({ error: 'Failed to list versions' });
    }
});
// Restore a version
exports.configRouter.post('/versions/:id/restore', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const restored = await (0, configService_1.restoreVersion)(req.userId, req.params.id);
        if (!restored) {
            res.status(404).json({ error: 'Version not found' });
            return;
        }
        res.json(restored);
    }
    catch {
        res.status(500).json({ error: 'Failed to restore version' });
    }
});
