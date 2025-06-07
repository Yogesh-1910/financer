// routes/budgetRoutes.js
const express = require('express');
const { BudgetItem } = require('../models'); // Ensure this is capitalized BudgetItem
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/budget - Get all budget items for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('[BudgetRoutes GET /] Fetching budget items for userId:', req.user.id); // Log userId
    const budgetItems = await BudgetItem.findAll({
      where: { userId: req.user.id }, // CRITICAL: Scope by authenticated user
      order: [['monthYear', 'DESC'], ['type', 'ASC'], ['createdAt', 'ASC']]
    });
    console.log('[BudgetRoutes GET /] Found items:', budgetItems.length);
    res.json(budgetItems);
  } catch (err) {
    console.error('Get Budget Error:', err.message, err.stack);
    res.status(500).send('Server Error');
  }
});

// POST /api/budget - Add a new budget item
router.post('/', authMiddleware, async (req, res) => {
  const { monthYear, category, type, itemName, plannedAmount, actualAmount, notes } = req.body;
  console.log('[BudgetRoutes POST /] Received data:', req.body);
  console.log('[BudgetRoutes POST /] Creating for userId:', req.user.id); // Log userId

  if (!monthYear || !category || !type || !itemName || plannedAmount === undefined || plannedAmount === null) {
     return res.status(400).json({ msg: 'Month/Year, category, type, item name, and planned amount are required.' });
  }
  if(isNaN(parseFloat(plannedAmount))) {
     return res.status(400).json({ msg: 'Planned amount must be a valid number.' });
  }

  try {
    const newItem = await BudgetItem.create({
      userId: req.user.id, // CRITICAL: Assign userId from authenticated user
      monthYear,
      category,
      type,
      itemName,
      plannedAmount: parseFloat(plannedAmount),
      actualAmount: actualAmount ? parseFloat(actualAmount) : null,
      notes: notes || null
    });
    console.log('[BudgetRoutes POST /] Item created:', newItem.toJSON());
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Add Budget Item Error:', err.message, err.stack);
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ msg: 'Validation Error', details: err.errors.map(e => e.message) });
    }
    res.status(500).send('Server Error');
  }
});

// PUT /api/budget/:id - Update a budget item
router.put('/:id', authMiddleware, async (req, res) => {
  const { monthYear, category, type, itemName, plannedAmount, actualAmount, notes } = req.body;
  console.log(`[BudgetRoutes PUT /${req.params.id}] Received data:`, req.body);
  console.log(`[BudgetRoutes PUT /${req.params.id}] Updating for userId:`, req.user.id);

  try {
    // Ensure the item belongs to the user before updating
    let item = await BudgetItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) {
      console.log(`[BudgetRoutes PUT /${req.params.id}] Item not found or user not authorized.`);
      return res.status(404).json({ msg: 'Budget item not found or unauthorized' });
    }

    item.monthYear = monthYear !== undefined ? monthYear : item.monthYear;
    item.category = category !== undefined ? category : item.category;
    item.type = type !== undefined ? type : item.type;
    item.itemName = itemName !== undefined ? itemName : item.itemName;
    item.plannedAmount = plannedAmount !== undefined ? parseFloat(plannedAmount) : item.plannedAmount;
    item.actualAmount = actualAmount !== undefined ? (actualAmount === '' || actualAmount === null ? null : parseFloat(actualAmount)) : item.actualAmount;
    item.notes = notes !== undefined ? (notes === '' ? null : notes) : item.notes;

    await item.save();
    console.log(`[BudgetRoutes PUT /${req.params.id}] Item updated:`, item.toJSON());
    res.json(item);
  } catch (err) {
    console.error('Update Budget Item Error:', err.message, err.stack);
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ msg: 'Validation Error', details: err.errors.map(e => e.message) });
    }
    res.status(500).send('Server Error');
  }
});

// DELETE /api/budget/:id - Delete a budget item
router.delete('/:id', authMiddleware, async (req, res) => {
  console.log(`[BudgetRoutes DELETE /${req.params.id}] Deleting for userId:`, req.user.id);
  try {
    const item = await BudgetItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) {
      console.log(`[BudgetRoutes DELETE /${req.params.id}] Item not found or user not authorized.`);
      return res.status(404).json({ msg: 'Budget item not found or unauthorized' });
    }
    await item.destroy();
    console.log(`[BudgetRoutes DELETE /${req.params.id}] Item deleted.`);
    res.json({ msg: 'Budget item removed' }); // Or res.status(204).send();
  } catch (err) {
    console.error('Delete Budget Item Error:', err.message, err.stack);
    res.status(500).send('Server Error');
  }
});

module.exports = router;