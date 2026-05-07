const { body, query, validationResult } = require('express-validator');

const MAX_AMOUNT = 1_000_000_000;
const TRANSACTION_TYPES = ['income', 'expense'];
const BUDGET_PERIODS = ['weekly', 'monthly'];
const RECURRING_FREQUENCIES = ['daily', 'weekly', 'monthly'];
const AI_PERIODS = ['week', 'month', 'year', 'all'];

// Run after validator chains; returns 422 on first set of errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    next();
};

// Date must not be more than 1 day in the future
const notAfterTomorrow = (val) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) throw new Error('Invalid date');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    if (d > tomorrow) throw new Error('Date cannot be more than 1 day in the future');
    return true;
};

// Reusable amount chain (no .optional())
const amountChain = (field = 'amount') =>
    body(field)
        .isFloat({ min: 0.01, max: MAX_AMOUNT })
        .withMessage(`Amount must be a number between 0.01 and ${MAX_AMOUNT.toLocaleString()}`);

// ── Auth ─────────────────────────────────────────────────────────────────────

const passwordRules = (field) =>
    body(field)
        .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/\d/).withMessage('Password must contain a digit')
        .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character');

const registerValidators = [
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1–50 characters'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1–50 characters'),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    passwordRules('password'),
];

const loginValidators = [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidators = [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1–50 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1–50 characters'),
    body('email').optional().trim().isEmail().withMessage('Valid email required').normalizeEmail(),
];

const changePasswordValidators = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    passwordRules('newPassword'),
];

const deleteAccountValidators = [
    body('password').notEmpty().withMessage('Password is required'),
];

// ── Transactions ──────────────────────────────────────────────────────────────

const createTransactionValidators = [
    body('type').isIn(TRANSACTION_TYPES).withMessage(`Type must be income or expense`),
    amountChain(),
    body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category must be 1–100 characters'),
    body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1–500 characters'),
    body('date').custom(notAfterTomorrow),
];

const updateTransactionValidators = [
    body('type').optional().isIn(TRANSACTION_TYPES).withMessage(`Type must be income or expense`),
    body('amount').optional().isFloat({ min: 0.01, max: MAX_AMOUNT })
        .withMessage(`Amount must be a number between 0.01 and ${MAX_AMOUNT.toLocaleString()}`),
    body('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Category must be 1–100 characters'),
    body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1–500 characters'),
    body('date').optional().custom(notAfterTomorrow),
];

// ── Budgets ───────────────────────────────────────────────────────────────────

const createBudgetValidators = [
    body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category must be 1–100 characters'),
    amountChain(),
    body('period').optional().isIn(BUDGET_PERIODS).withMessage(`Period must be weekly or monthly`),
];

const updateBudgetValidators = [
    body('amount').optional().isFloat({ min: 0.01, max: MAX_AMOUNT })
        .withMessage(`Amount must be a number between 0.01 and ${MAX_AMOUNT.toLocaleString()}`),
    body('period').optional().isIn(BUDGET_PERIODS).withMessage(`Period must be weekly or monthly`),
];

// ── Recurring ─────────────────────────────────────────────────────────────────

const createRecurringValidators = [
    body('type').isIn(TRANSACTION_TYPES).withMessage(`Type must be income or expense`),
    amountChain(),
    body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category must be 1–100 characters'),
    body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1–500 characters'),
    body('frequency').isIn(RECURRING_FREQUENCIES).withMessage(`Frequency must be daily, weekly, or monthly`),
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').optional({ nullable: true }).isISO8601().withMessage('End date must be a valid ISO date'),
];

const updateRecurringValidators = [
    body('type').optional().isIn(TRANSACTION_TYPES).withMessage(`Type must be income or expense`),
    body('amount').optional().isFloat({ min: 0.01, max: MAX_AMOUNT })
        .withMessage(`Amount must be a number between 0.01 and ${MAX_AMOUNT.toLocaleString()}`),
    body('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Category must be 1–100 characters'),
    body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1–500 characters'),
    body('frequency').optional().isIn(RECURRING_FREQUENCIES).withMessage(`Frequency must be daily, weekly, or monthly`),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').optional({ nullable: true }).isISO8601().withMessage('End date must be a valid ISO date'),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];

// ── AI ────────────────────────────────────────────────────────────────────────

const suggestCategoryValidators = [
    body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1–500 characters'),
];

const parseTransactionValidators = [
    body('text').trim().isLength({ min: 10, max: 1000 }).withMessage('Text must be 10–1000 characters'),
];

const insightsValidators = [
    query('period').optional().isIn(AI_PERIODS).withMessage(`Period must be one of: ${AI_PERIODS.join(', ')}`),
];

module.exports = {
    validate,
    registerValidators,
    loginValidators,
    updateProfileValidators,
    changePasswordValidators,
    deleteAccountValidators,
    createTransactionValidators,
    updateTransactionValidators,
    createBudgetValidators,
    updateBudgetValidators,
    createRecurringValidators,
    updateRecurringValidators,
    suggestCategoryValidators,
    parseTransactionValidators,
    insightsValidators,
};
