const Recurring = require("../models/Recurring");
const Transaction = require("../models/Transaction");

// Calculate next run date based on frequency
const getNextRun = (currentDate, frequency) => {
    const next = new Date(currentDate);
    switch (frequency) {
        case "daily": next.setDate(next.getDate() + 1); break;
        case "weekly": next.setDate(next.getDate() + 7); break;
        case "monthly": next.setMonth(next.getMonth() + 1); break;
    }
    return next;
};

// Process all due recurring transactions
exports.processRecurring = async () => {
    const now = new Date();
    const dueRecurring = await Recurring.find({
        isActive: true,
        nextRun: { $lte: now },
        $or: [
            { endDate: null },
            { endDate: { $gte: now } },
        ],
    });

    let created = 0;
    for (const rec of dueRecurring) {
        try {
            // Create the transaction
            await Transaction.create({
                userId: rec.userId,
                type: rec.type,
                amount: rec.amount,
                category: rec.category,
                description: `[Auto] ${rec.description}`,
                date: rec.nextRun,
            });

            // Update the recurring rule
            rec.lastGenerated = rec.nextRun;
            rec.nextRun = getNextRun(rec.nextRun, rec.frequency);

            // Deactivate if past end date
            if (rec.endDate && rec.nextRun > rec.endDate) {
                rec.isActive = false;
            }

            await rec.save();
            created++;
        } catch (err) {
            console.error("Error processing recurring:", err.message);
        }
    }

    if (created > 0) {
        console.log(`✅ Generated ${created} recurring transactions`);
    }
    return created;
};

exports.getNextRun = getNextRun;