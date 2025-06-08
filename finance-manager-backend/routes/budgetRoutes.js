// routes/budgetRoutes.js
const express = require('express');
const { BudgetItem } = require('../models');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure this path is correct
const router = express.Router();

// GET /api/budget - Get all budget items for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('[BE BudgetRoutes GET /] Fetching budget for userId:', req.user.id);
    const budgetItems = await BudgetItem.findAll({
      where: { userId: req.user.id },
      order: [['monthYear', 'DESC'], ['type', 'ASC'], ['createdAt', 'ASC']]
    });
    console.log('[BE BudgetRoutes GET /] Found items:', budgetItems.length);
    res.json(budgetItems);
  } catch (err) {
    console.error('[BE BudgetRoutes GET /] Error:', err.message, err.stack);
    res.status(500).json({ error: 'Server Error fetching budget items' });
  }
});

// POST /api/budget - Add a new budget item
router.post('/', authMiddleware, async (req, res) => {
  const { monthYear, category, type, itemName, plannedAmount, actualAmount, notes } = req.body;
  console.log('[BE BudgetRoutes POST /] Received data for new item:', req.body);
  console.log('[BE BudgetRoutes POST /] Creating for userId:', req.user.id);

  if (!monthYear || !category || !type || !itemName || plannedAmount === undefined || plannedAmount === null) {
     console.log('[BE BudgetRoutes POST /] Validation Error: Missing required fields.');
     return res.status(400).json({ msg: 'Month/Year, category, type, item name, and planned amount are required.' });
  }
  if(isNaN(parseFloat(plannedAmount))) {
     console.log('[BE BudgetRoutes POST /] Validation Error: Planned amount not a number.');
     return res.status(400).json({ msg: 'Planned amount must be a valid number.' });
  }

  try {
    const newItemData = {
      userId: req.user.id, // CRITICAL: Assign userId from authenticated user
      monthYear,
      category,
      type,
      itemName,
      plannedAmount: parseFloat(plannedAmount),
      actualAmount: actualAmount ? parseFloat(actualAmount) : null,
      notes: notes || null
    };
    console.log('[BE BudgetRoutes POST /] Attempting to create with data:', newItemData);
    const newItem = await BudgetItem.create(newItemData);
    console.log('[BE BudgetRoutes POST /] Item created successfully:', newItem.toJSON());
    res.status(201).json(newItem);
  } catch (err) {
    console.error('[BE BudgetRoutes POST /] Create Error:', err.name, err.message, err.errors, err.stack);
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ msg: 'Validation Error creating budget item.', details: err.errors.map(e => e.message) });
    }
    res.status(500).json({ error: 'Server Error creating budget item' });
  }
});

// PUT /api/budget/:id - Update a budget item
router.put('/:id', authMiddleware, async (req, res) => {
  const itemId = req.params.id;
  const { monthYear, category, type, itemName, plannedAmount, actualAmount, notes } = req.body;
  console.log(`[BE BudgetRoutes PUT /${itemId}] Received data:`, req.body);
  console.log(`[BE BudgetRoutes PUT /${itemId}] Updating for userId:`, req.user.id);

  try {
    const item = await BudgetItem.findOne({ where: { id: itemId, userId: req.user.id } });
    if (!item) {
      console.log(`[BE BudgetRoutes PUT /${itemId}] Item not found or user not authorized.`);
      return res.status(404).json({ msg: 'Budget item not found or unauthorized' });
    }

    // Update fields only if they are provided in the request body
    if (monthYear !== undefined) item.monthYear = monthYear;
    if (category !== undefined) item.category = category;
    if (type !== undefined) item.type = type;
    if (itemName !== undefined) item.itemName = itemName;
    if (plannedAmount !== undefined) item.plannedAmount = parseFloat(plannedAmount);
    if (actualAmount !== undefined) item.actualAmount = actualAmount === '' || actualAmount === null ? null : parseFloat(actualAmount);
    if (notes !== undefined) item.notes = notes === '' ? null : notes;

    await item.save();
    console.log(`[BE BudgetRoutes PUT /${itemId}] Item updated:`, item.toJSON());
    res.json(item);
  } catch (err) {
    console.error(`[BE BudgetRoutes PUT /${itemId}] Update Error:`, err.message, err.stack);
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ msg: 'Validation Error updating budget item.', details: err.errors.map(e => e.message) });
    }
    res.status(500).json({ error: 'Server Error updating budget item' });
  }
});

// DELETE /api/budget/:id - Delete a budget item
router.delete('/:id', authMiddleware, async (req, res) => {
  const itemId = req.params.id;
  console.log(`[BE BudgetRoutes DELETE /${itemId}] Deleting for userId:`, req.user.id);
  try {
    const item = await BudgetItem.findOne({ where: { id: itemId, userId: req.user.id } });
    if (!item) {
      console.log(`[BE BudgetRoutes DELETE /${itemId}] Item not found or user not authorized.`);
      return res.status(404).json({ msg: 'Budget item not found or unauthorized' });
    }
    await item.destroy();
    console.log(`[BE BudgetRoutes DELETE /${itemId}] Item deleted.`);
    res.json({ msg: 'Budget item removed' });
  } catch (err) {
    console.error(`[BE BudgetRoutes DELETE /${itemId}] Delete Error:`, err.message, err.stack);
    res.status(500).json({ error: 'Server Error deleting budget item' });
  }
});

module.exports = router;