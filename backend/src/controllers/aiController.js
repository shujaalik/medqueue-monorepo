const { expandMedicalNotes } = require('../services/aiService');

const getExpandedNotes = async (req, res) => {
  try {
    const { shorthand } = req.body;
    if (!shorthand) {
      return res.status(400).json({ message: 'Shorthand notes are required' });
    }
    const expanded = await expandMedicalNotes(shorthand);
    res.json({ expanded });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpandedNotes };
