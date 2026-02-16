"""
Flask Backend for AI Mock Interview Evaluation
Loads trained model and vectorizer, provides API endpoint for answer evaluation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import joblib
import os
import numpy as np

app = Flask(__name__)

# ========================================
# CORS CONFIGURATION FOR EXTERNAL BROWSER
# ========================================
# Allow all origins for local development
# This enables your frontend (opened in Chrome/Edge) to communicate with the backend
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

# Global variables for model and vectorizer
model = None
vectorizer = None

# ========================================
# MODEL LOADING
# ========================================

def load_model_and_vectorizer():
    """Load the trained model and vectorizer at startup"""
    global model, vectorizer
    
    try:
        # Get the base directory (go up one level from python_backend)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_dir = os.path.join(base_dir, 'dataset')
        
        # Load the vectorizer
        vectorizer_path = os.path.join(dataset_dir, 'tfidf_vectorizer.pkl')
        
        # Try loading with pickle first, then joblib
        try:
            with open(vectorizer_path, 'rb') as f:
                vectorizer = pickle.load(f)
        except Exception:
            vectorizer = joblib.load(vectorizer_path)
        
        print("✓ Vectorizer loaded successfully from dataset folder")
        
        # Load the model
        model_path = os.path.join(dataset_dir, 'interview_model.pkl')
        
        # Try loading with pickle first, then joblib
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
        except Exception:
            model = joblib.load(model_path)
        
        print("✓ Model loaded successfully from dataset folder")
        
        return True
    except FileNotFoundError as e:
        print(f"✗ Error: Model files not found - {e}")
        print("Please ensure 'tfidf_vectorizer.pkl' and 'interview_model.pkl' are in the 'dataset' folder")
        return False
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        return False

# ========================================
# EVALUATION LOGIC
# ========================================

def evaluate_answer(question, user_answer):
    """
    Evaluate user's answer using the trained model
    
    Args:
        question (str): The interview question
        user_answer (str): User's answer text
        
    Returns:
        dict: Evaluation results with score, feedback, strengths, improvements
    """
    
    # Basic validation
    if not user_answer or len(user_answer.strip()) < 10:
        return {
            'score': 0,
            'feedback': 'Answer is too short. Please provide a more detailed response.',
            'strengths': [],
            'improvements': ['Provide more detailed explanations', 'Add relevant examples', 'Elaborate on key points']
        }
    
    try:
        # Vectorize the answer
        answer_vector = vectorizer.transform([user_answer])
        
        # Get prediction (assuming model outputs a score or probability)
        prediction = model.predict(answer_vector)[0]
        
        # If model has predict_proba, use it for confidence
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(answer_vector)[0]
            confidence = max(probabilities)
            score = int(confidence * 100)
        else:
            # If prediction is already a score, use it directly
            score = int(prediction) if isinstance(prediction, (int, float)) else 50
        
        # Ensure score is between 0 and 100
        score = max(0, min(100, score))
        
        # Generate feedback based on score
        feedback, strengths, improvements = generate_feedback(score, user_answer, question)
        
        return {
            'score': score,
            'feedback': feedback,
            'strengths': strengths,
            'improvements': improvements
        }
        
    except Exception as e:
        print(f"Error during evaluation: {e}")
        return {
            'score': 50,
            'feedback': 'Unable to evaluate answer accurately. Please try again.',
            'strengths': ['Answer provided'],
            'improvements': ['Ensure answer is clear and well-structured']
        }

def generate_feedback(score, answer, question):
    """
    Generate feedback based on score and answer analysis
    
    Args:
        score (int): Evaluation score (0-100)
        answer (str): User's answer
        question (str): The interview question
        
    Returns:
        tuple: (feedback, strengths, improvements)
    """
    
    word_count = len(answer.split())
    
    # Determine strengths
    strengths = []
    if score >= 80:
        strengths.append('Comprehensive and well-structured answer')
        strengths.append('Demonstrates strong understanding')
        strengths.append('Clear and articulate communication')
    elif score >= 60:
        strengths.append('Good understanding of the topic')
        strengths.append('Relevant points covered')
    elif score >= 40:
        strengths.append('Basic understanding demonstrated')
    
    if word_count >= 100:
        strengths.append('Detailed explanation provided')
    
    # Determine improvements
    improvements = []
    if score < 80:
        if word_count < 50:
            improvements.append('Provide more detailed explanations')
        improvements.append('Include specific examples to support your points')
        improvements.append('Elaborate on key concepts')
    
    if score < 60:
        improvements.append('Address all aspects of the question')
        improvements.append('Organize your thoughts more clearly')
    
    if score < 40:
        improvements.append('Focus on understanding the core question')
        improvements.append('Provide more relevant information')
    
    # Generate overall feedback
    if score >= 80:
        feedback = 'Excellent answer! You demonstrated strong knowledge and communication skills.'
    elif score >= 60:
        feedback = 'Good answer with room for improvement. Consider adding more specific examples and details.'
    elif score >= 40:
        feedback = 'Fair answer. Try to provide more comprehensive responses with better structure.'
    else:
        feedback = 'Needs improvement. Focus on understanding the question and providing more relevant details.'
    
    return feedback, strengths, improvements

# ========================================
# API ENDPOINTS
# ========================================

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'AI Mock Interview Backend API',
        'model_loaded': model is not None,
        'vectorizer_loaded': vectorizer is not None
    })

@app.route('/evaluate-answer', methods=['POST'])
def evaluate_answer_endpoint():
    """
    Evaluate user's answer to an interview question
    
    Expected JSON input:
    {
        "question": "Tell me about yourself",
        "user_answer": "I am a software developer with 5 years..."
    }
    
    Returns JSON:
    {
        "score": 85,
        "feedback": "Excellent answer!",
        "strengths": ["Clear communication", "Relevant experience"],
        "improvements": ["Add more specific examples"]
    }
    """
    
    # Check if model is loaded
    if model is None or vectorizer is None:
        return jsonify({
            'error': 'Model not loaded. Please restart the server.',
            'score': 0,
            'feedback': 'System error. Please try again later.',
            'strengths': [],
            'improvements': []
        }), 500
    
    # Get request data
    data = request.get_json()
    
    if not data:
        return jsonify({
            'error': 'Invalid request. Please provide JSON data.',
            'score': 0,
            'feedback': 'Invalid request format.',
            'strengths': [],
            'improvements': []
        }), 400
    
    # Extract question and answer
    question = data.get('question', '')
    user_answer = data.get('user_answer', '')
    
    if not user_answer:
        return jsonify({
            'error': 'user_answer is required',
            'score': 0,
            'feedback': 'No answer provided.',
            'strengths': [],
            'improvements': ['Provide an answer to the question']
        }), 400
    
    # Evaluate the answer
    result = evaluate_answer(question, user_answer)
    
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'vectorizer_loaded': vectorizer is not None
    })

# ========================================
# MAIN
# ========================================

if __name__ == '__main__':
    print("=" * 70)
    print("🚀 AI MOCK INTERVIEW - PYTHON BACKEND")
    print("=" * 70)
    
    # Load model and vectorizer
    if load_model_and_vectorizer():
        print("\n✓ Backend ready!\n")
        print("=" * 70)
        print("📡 BACKEND URL:  http://localhost:5000")
        print("📡 API ENDPOINT: http://localhost:5000/evaluate-answer")
        print("=" * 70)
        print("\n⚠️  IMPORTANT: OPEN IN EXTERNAL BROWSER (Chrome/Edge/Firefox)")
        print("   DO NOT use VS Code Simple Browser - it blocks camera/microphone!\n")
        print("   1. Keep this terminal running")
        print("   2. Open your frontend in Chrome/Edge: http://localhost:8000")
        print("   3. Grant camera/microphone permissions when prompted\n")
        print("=" * 70)
        print("Press Ctrl+C to stop the server\n")
        
        # Run Flask app WITHOUT debug mode to prevent auto-reload and browser opening
        app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
    else:
        print("\n✗ Failed to start backend. Please check model files.")
        print("Ensure 'dataset/tfidf_vectorizer.pkl' and 'dataset/interview_model.pkl' exist in the root folder.")
