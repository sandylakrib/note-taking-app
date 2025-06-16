const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { authenticateToken } = require('../middleware/authenticateToken');

// GET all notes for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new note for user
router.post('/', authenticateToken, async (req, res) => {
  const { title, content } = req.body;

  const note = new Note({
    title,
    content,
    user: req.user.id
  });

  try {
    const newNote = await note.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET single note by id (only if owned by user)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update note by id (only if owned by user)
router.put('/:id', authenticateToken, async (req, res) => {
  const { title, content } = req.body;

  try {
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, content },
      { new: true, runValidators: true }
    );
    if (!updatedNote) return res.status(404).json({ message: 'Note not found' });
    res.json(updatedNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE note by id (only if owned by user)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedNote) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
