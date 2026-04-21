const { generateSuggestions } = require('../services/aiSuggestionEngine');

const getSuggestions = async (req, res) => {
  try {
    const suggestions = await generateSuggestions(req.user._id);
    res.json(suggestions);
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

module.exports = { getSuggestions };
