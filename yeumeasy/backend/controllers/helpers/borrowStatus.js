const { Borrow, BorrowDetail } = require('../../models');

async function recalculateBorrowStatus(borrowId) {
  const details = await BorrowDetail.findAll({ where: { borrow_id: borrowId } });

  const allReturned =
    details.length > 0 && details.every((detail) => Number(detail.returned_amount) >= Number(detail.amount));

  await Borrow.update(
    { borrow_status: allReturned ? 'returned' : 'borrowed' },
    { where: { id: borrowId } }
  );
}

module.exports = { recalculateBorrowStatus };