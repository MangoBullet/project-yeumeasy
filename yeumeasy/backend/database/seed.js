require('dotenv').config();

const { sequelize, User, Equipment, Borrow, BorrowDetail } = require('../models');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInPast(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(1, daysBack));
  return date.toISOString().split('T')[0];
}

async function seed() {
  try {
    await sequelize.sync({ force: true });

    const users = await User.bulkCreate([
      { full_name: 'Akarin Somchai', student_id: 'STU001', phone: '0801110001' },
      { full_name: 'Benz Kittipong', student_id: 'STU002', phone: '0801110002' },
      { full_name: 'Chompoo Napat', student_id: 'STU003', phone: '0801110003' },
      { full_name: 'Don Narin', student_id: 'STU004', phone: '0801110004' },
      { full_name: 'Eve Pimchanok', student_id: 'STU005', phone: '0801110005' },
      { full_name: 'Fah Panuwat', student_id: 'STU006', phone: '0801110006' },
      { full_name: 'Game Tanawat', student_id: 'STU007', phone: '0801110007' },
      { full_name: 'Hong Yada', student_id: 'STU008', phone: '0801110008' },
      { full_name: 'Ice Nicha', student_id: 'STU009', phone: '0801110009' },
      { full_name: 'June Patiphan', student_id: 'STU010', phone: '0801110010' }
    ]);

    const equipment = await Equipment.bulkCreate([
      { equipment_name: 'Laptop Dell XPS', category: 'IT', quantity: 10, status: 'available' },
      { equipment_name: 'Projector Epson', category: 'AV', quantity: 5, status: 'available' },
      { equipment_name: 'HDMI Cable', category: 'Accessory', quantity: 30, status: 'available' },
      { equipment_name: 'Wireless Mouse', category: 'Accessory', quantity: 20, status: 'available' },
      { equipment_name: 'Keyboard Mechanical', category: 'Accessory', quantity: 15, status: 'available' },
      { equipment_name: 'Tripod Stand', category: 'AV', quantity: 8, status: 'available' },
      { equipment_name: 'DSLR Camera', category: 'Media', quantity: 6, status: 'available' },
      { equipment_name: 'Microphone Set', category: 'Audio', quantity: 12, status: 'available' },
      { equipment_name: 'Tablet iPad', category: 'IT', quantity: 9, status: 'available' },
      { equipment_name: 'Extension Cord', category: 'Utility', quantity: 25, status: 'available' }
    ]);

    const borrows = [];
    for (let i = 0; i < 20; i += 1) {
      const borrowDate = randomDateInPast(45);
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + randomInt(3, 10));

      borrows.push({
        user_id: users[randomInt(0, users.length - 1)].id,
        borrow_date: borrowDate,
        due_date: dueDate.toISOString().split('T')[0],
        borrow_status: 'borrowed'
      });
    }

    const createdBorrows = await Borrow.bulkCreate(borrows);

    for (const borrow of createdBorrows) {
      const count = randomInt(1, 3);
      const usedEquipment = new Set();

      for (let i = 0; i < count; i += 1) {
        let eqIndex = randomInt(0, equipment.length - 1);
        while (usedEquipment.has(eqIndex)) {
          eqIndex = randomInt(0, equipment.length - 1);
        }
        usedEquipment.add(eqIndex);

        const amount = randomInt(1, 3);
        const returnedAmount = Math.random() > 0.45 ? amount : randomInt(0, amount - 1);

        await BorrowDetail.create({
          borrow_id: borrow.id,
          equipment_id: equipment[eqIndex].id,
          amount,
          returned_amount: returnedAmount
        });
      }
    }

    for (const borrow of createdBorrows) {
      const details = await BorrowDetail.findAll({ where: { borrow_id: borrow.id } });
      const allReturned = details.length > 0 && details.every((d) => d.returned_amount >= d.amount);
      await borrow.update({ borrow_status: allReturned ? 'returned' : 'borrowed' });
    }

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();