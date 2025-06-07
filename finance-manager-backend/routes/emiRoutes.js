// finance-manager-backend/routes/emiRoutes.js
const express = require('express');
const { EMI, Loan } = require('../models'); // Include Loan if you want to validate loanId existence
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/emis - Get all EMIs for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const emis = await EMI.findAll({
      where: { userId: req.user.id },
      order: [['emiStartDate', 'ASC'], ['createdAt', 'ASC']], // Order by start date, then creation
      include: [{ model: Loan, as: 'loan', attributes: ['id', 'loanName'] }] // Optionally include linked loan name
    });
    res.json(emis);
  } catch (err) {
    console.error('Get EMIs Error:', err.message);
    res.status(500).json({ error: 'Server Error fetching EMIs' });
  }
});

// POST /api/emis - Add a new EMI
router.post('/', authMiddleware, async (req, res) => {
  const {
    emiDescription,
    totalEmiAmount,
    monthlyEmiPayment,
    numberOfInstallments,
    paidInstallments,
    emiStartDate,
    loanId // This will be a string from form, or empty/null
  } = req.body;

  // Basic Validation
  if (!emiDescription || monthlyEmiPayment === undefined || numberOfInstallments === undefined) {
    return res.status(400).json({ error: 'EMI description, monthly payment, and number of installments are required.' });
  }
  if (isNaN(parseFloat(monthlyEmiPayment)) || parseFloat(monthlyEmiPayment) <= 0) {
    return res.status(400).json({ error: 'Monthly EMI payment must be a positive number.' });
  }
  if (isNaN(parseInt(numberOfInstallments)) || parseInt(numberOfInstallments) <= 0) {
    return res.status(400).json({ error: 'Number of installments must be a positive integer.' });
  }

  try {
    let validLoanId = null;
    if (loanId && loanId !== '' && !isNaN(parseInt(loanId))) {
      validLoanId = parseInt(loanId);
      // Optional: Check if the loanId actually exists for this user and is valid
      const loanExists = await Loan.findOne({ where: { id: validLoanId, userId: req.user.id } });
      if (!loanExists) {
        return res.status(400).json({ error: 'Associated loan not found or you do not have permission for it.' });
      }
    }

    const newEmiData = {
      userId: req.user.id,
      loanId: validLoanId, // Use the validated and parsed loanId or null
      emiDescription,
      totalEmiAmount: totalEmiAmount ? parseFloat(totalEmiAmount) : null,
      monthlyEmiPayment: parseFloat(monthlyEmiPayment),
      numberOfInstallments: parseInt(numberOfInstallments),
      paidInstallments: paidInstallments ? parseInt(paidInstallments) : 0,
      emiStartDate: emiStartDate || null,
      // emiEndDate can be calculated if needed based on startDate and numberOfInstallments
    };

    const newEmi = await EMI.create(newEmiData);
    res.status(201).json(newEmi);
  } catch (err) {
    console.error('Create EMI Error:', err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors.map(e => e.message) });
    }
    res.status(500).json({ error: 'Server Error creating EMI', details: err.message });
  }
});

// PUT /api/emis/:id - Update an existing EMI
router.put('/:id', authMiddleware, async (req, res) => {
  const emiId = req.params.id;
  const {
    emiDescription,
    totalEmiAmount,
    monthlyEmiPayment,
    numberOfInstallments,
    paidInstallments,
    emiStartDate,
    loanId
  } = req.body;

  try {
    const emi = await EMI.findOne({ where: { id: emiId, userId: req.user.id } });
    if (!emi) {
      return res.status(404).json({ error: 'EMI not found or unauthorized' });
    }

    // Update fields if they are provided in the request body
    if (emiDescription !== undefined) emi.emiDescription = emiDescription;
    if (totalEmiAmount !== undefined) emi.totalEmiAmount = totalEmiAmount === '' || totalEmiAmount === null ? null : parseFloat(totalEmiAmount);
    if (monthlyEmiPayment !== undefined) emi.monthlyEmiPayment = parseFloat(monthlyEmiPayment);
    if (numberOfInstallments !== undefined) emi.numberOfInstallments = parseInt(numberOfInstallments);
    if (paidInstallments !== undefined) emi.paidInstallments = parseInt(paidInstallments);
    if (emiStartDate !== undefined) emi.emiStartDate = emiStartDate === '' || emiStartDate === null ? null : emiStartDate;

    if (loanId !== undefined) {
        if (loanId === '' || loanId === null) {
            emi.loanId = null;
        } else {
            const validLoanId = parseInt(loanId);
            if (!isNaN(validLoanId)) {
                const loanExists = await Loan.findOne({ where: { id: validLoanId, userId: req.user.id }});
                if (!loanExists) {
                    return res.status(400).json({ error: 'Associated loan for update not found or not owned by user.' });
                }
                emi.loanId = validLoanId;
            } else {
                 return res.status(400).json({ error: 'Invalid Loan ID format for update.' });
            }
        }
    }

    // Basic validation for updated values
    if (emi.monthlyEmiPayment <= 0) return res.status(400).json({ error: 'Monthly EMI payment must be positive.' });
    if (emi.numberOfInstallments <= 0) return res.status(400).json({ error: 'Number of installments must be positive.' });


    await emi.save();
    res.json(emi);
  } catch (err) {
    console.error('Update EMI Error:', err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors.map(e => e.message) });
    }
    res.status(500).json({ error: 'Server Error updating EMI', details: err.message });
  }
});

// DELETE /api/emis/:id - Delete an EMI
router.delete('/:id', authMiddleware, async (req, res) => {
  const emiId = req.params.id;
  try {
    const emi = await EMI.findOne({ where: { id: emiId, userId: req.user.id } });
    if (!emi) {
      return res.status(404).json({ error: 'EMI not found or unauthorized' });
    }
    await emi.destroy();
    res.status(204).send(); // No content, successful deletion
  } catch (err) {
    console.error('Delete EMI Error:', err.message);
    res.status(500).json({ error: 'Server Error deleting EMI' });
  }
});

module.exports = router;