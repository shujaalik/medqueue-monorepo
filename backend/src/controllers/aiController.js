const { expandMedicalNotes, discussMedicalNotes } = require('../services/aiService');

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

const consultAIScribe = async (req, res) => {
  try {
    const { currentReport, query, shorthand } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }
    const discussion = await discussMedicalNotes(currentReport, query, shorthand);
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpandedNotes, consultAIScribe };
