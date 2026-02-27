import { AnimationService } from '../services/AnimationService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Animation Controller - HTTP request handlers
 */

export const createAnimation = asyncHandler(async (req, res) => {
  const animation = await AnimationService.create(req.userId, req.body);
  res.status(201).json(animation);
});

export const getAnimation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const animation = await AnimationService.getById(id, req.userId);
  res.json(animation);
});

export const updateAnimation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const animation = await AnimationService.update(id, req.userId, req.body);
  res.json(animation);
});

export const deleteAnimation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await AnimationService.delete(id, req.userId);
  res.json(result);
});

export const reorderAnimations = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  const { animationIds } = req.body;
  const result = await AnimationService.reorder(sectionId, req.userId, animationIds);
  res.json(result);
});

// Built-in animations
export const getBuiltinAnimations = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const animations = await AnimationService.getBuiltinAnimations(category);
  res.json(animations);
});

export const getBuiltinCategories = asyncHandler(async (req, res) => {
  const categories = await AnimationService.getBuiltinCategories();
  res.json(categories);
});

export const getBuiltinAnimation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const animation = await AnimationService.getBuiltinById(id);
  res.json(animation);
});

export const seedBuiltinAnimations = asyncHandler(async (req, res) => {
  const result = await AnimationService.seedBuiltinAnimations();
  res.json(result);
});
