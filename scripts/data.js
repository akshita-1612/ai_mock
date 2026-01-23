// Dummy static data for the mock interview flow
export const QUESTIONS = {
  Technical: [
    "Explain the concept of closures in JavaScript.",
    "Describe the differences between HTTP and HTTPS.",
    "How does a REST API differ from GraphQL?"
  ],
  HR: [
    "Tell me about yourself.",
    "Why do you want to work at our company?",
    "Describe a time you had a conflict with a teammate."
  ],
  Behavioral: [
    "Describe a challenging problem you solved.",
    "Tell me about a time you missed a deadline.",
    "Describe how you prioritize tasks."
  ]
};

export const SAMPLE_RESULTS = {
  score: 82,
  confidence: 74,
  emotions: {
    neutral: 45,
    happy: 25,
    sad: 5,
    angry: 2,
    surprised: 23
  },
  strengths: [
    "Clear technical knowledge",
    "Good structure in answers",
    "Politeness and professionalism"
  ],
  improvements: [
    "Be more concise",
    "Provide more measurable outcomes",
    "Control filler words"
  ]
};
