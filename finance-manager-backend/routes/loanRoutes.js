// routes/loanRoutes.js
const express = require('express');
const { Loan } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/loans
router.get('/', authMiddleware, async (req, res) => {
  try {
    const loans = await Loan.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(loans);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error fetching loans' });
  }
});

// POST /api/loans
router.post('/', authMiddleware, async (req, res) => {
  const { loanName, totalLoanAmount, monthlyPaymentCalculated, interestRate, loanTermMonths, paidMonths, startDate, lenderName } = req.body;
  if (!loanName || totalLoanAmount === undefined || monthlyPaymentCalculated === undefined || loanTermMonths === undefined) {
     return res.status(400).json({ error: 'Loan name, total amount, EMI, and term are required.' });
  }
  try {
    const newLoan = await Loan.create({
      userId: req.user.id,
      loanName,
      totalLoanAmount: parseFloat(totalLoanAmount),
      monthlyPaymentCalculated: parseFloat(monthlyPaymentCalculated),
      interestRate: interestRate ? parseFloat(interestRate) : null,
      loanTermMonths: parseInt(loanTermMonths),
      paidMonths: paidMonths ? parseInt(paidMonths) : 0,
      startDate: startDate || null,
      lenderName: lenderName || null
    });
    res.status(201).json(newLoan);
  } catch (err) {
    console.error('Create Loan Error:', err.message);
    res.status(400).json({ error: 'Failed to create loan', details: err.message });
  }
});

// PUT /api/loans/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const loan = await Loan.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!loan) return res.status(404).json({ error: 'Loan not found or unauthorized' });

    // Update fields selectively
    const { loanName, totalLoanAmount, monthlyPaymentCalculated, interestRate, loanTermMonths, paidMonths, startDate, lenderName } = req.body;
    if (loanName !== undefined) loan.loanName = loanName;
    if (totalLoanAmount !== undefined) loan.totalLoanAmount = parseFloat(totalLoanAmount);
    if (monthlyPaymentCalculated !== undefined) loan.monthlyPaymentCalculated = parseFloat(monthlyPaymentCalculated);
    if (interestRate !== undefined) loan.interestRate = interestRate === '' || interestRate === null ? null : parseFloat(interestRate);
    if (loanTermMonths !== undefined) loan.loanTermMonths = parseInt(loanTermMonths);
    if (paidMonths !== undefined) loan.paidMonths = parseInt(paidMonths);
    if (startDate !== undefined) loan.startDate = startDate === '' || startDate === null ? null : startDate;
    if (lenderName !== undefined) loan.lenderName = lenderName === '' || lenderName === null ? null : lenderName;

    await loan.save();
    res.json(loan);
  } catch (err) {
    console.error('Update Loan Error:', err.message);
    res.status(400).json({ error: 'Failed to update loan', details: err.message });
  }
});

// DELETE /api/loans/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const loan = await Loan.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!loan) return res.status(404).json({ error: 'Loan not found or unauthorized' });
    await loan.destroy();
    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error deleting loan' });
  }
});

module.exports = router;