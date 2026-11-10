import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
const router = express.Router();

// In-memory seed data
let items = [
    { id: 1, name: 'Paneer Roll', price: 90, available: true },
    { id: 2, name: 'Veg Sandwich', price: 60, available: true },
    { id: 3, name: 'Masala Dosa', price: 80, available: true },
    { id: 4, name: 'Cold Coffee', price: 50, available: false }
];

let nextId = 5;

// GET /items - Get all items
router.get('/', authenticate, (req, res) => {
    res.status(200).json(items);
});

// GET /items/:id - Get one item
router.get('/:id', authenticate, (req, res) => {
    const id = Number(req.params.id);

    const item = items.find(item => item.id === id);

    if (!item) {
        return res.status(404).json({
            error: 'Item not found'
        });
    }

    res.status(200).json(item);
});

// POST /items - Create new item
router.post('/', authenticate, requireRole('restaurant'), (req, res) => {
    const { name, price, available } = req.body;

    if (
        typeof name !== 'string' ||
        name.trim() === '' ||
        price === undefined ||
        price === null ||
        price === '' ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
    ) {
        return res.status(422).json({
            error: 'Valid name and price are required'
        });
    }

    const newItem = {
        id: nextId++,
        name: name.trim(),
        price: Number(price),
        available: available === undefined ? true : Boolean(available)
    };

    items.push(newItem);

    res.status(201).json(newItem);
});

// DELETE /:id
router.delete('/:id', authenticate, requireRole('restaurant'), (req, res) => {
    const id = Number(req.params.id);

    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({
            error: 'Item not found'
        });
    }

    items.splice(index, 1);

    return res.status(204).send();
});

export default router;