# AI Mock Interview - Python Backend

Simple Flask backend for evaluating interview answers using a trained ML model.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Place Model Files

The backend automatically loads model files from the `dataset` folder in the project root:

```
ai mock/
├── dataset/
│   ├── interview_model.pkl    # Trained model file
│   └── tfidf_vectorizer.pkl   # TF-IDF vectorizer file
├── python_backend/
│   ├── app.py
│   └── requirements.txt
```

**Note:** Model files should be placed in the `dataset` folder at the project root, not in the python_backend folder.

### 3. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Usage

### Endpoint: POST /evaluate-answer

**Request:**
```json
{
  "question": "Tell me about yourself",
  "user_answer": "I am a software developer with 5 years of experience..."
}
```

**Response:**
```json
{
  "score": 85,
  "feedback": "Excellent answer! You demonstrated strong knowledge and communication skills.",
  "strengths": [
    "Comprehensive and well-structured answer",
    "Demonstrates strong understanding",
    "Clear and articulate communication"
  ],
  "improvements": [
    "Include specific examples to support your points"
  ]
}
```

## Frontend Integration

Use `fetch()` to call the API from your frontend:

```javascript
async function evaluateAnswer(question, userAnswer) {
  const response = await fetch('http://localhost:5000/evaluate-answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: question,
      user_answer: userAnswer
    })
  });
  
  const result = await response.json();
  console.log('Score:', result.score);
  console.log('Feedback:', result.feedback);
  return result;
}
```

## Health Check

**GET /** or **GET /health** - Check if server and model are loaded

```json
{
  "status": "healthy",
  "model_loaded": true,
  "vectorizer_loaded": true
}
```

## Notes

- CORS is enabled for all origins
- Server runs on port 5000 by default
- Model and vectorizer are loaded at startup
- If model files are missing, server will fail to start with clear error messages
