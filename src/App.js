import React, { useState } from 'react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  // The actual API key will be provided by the Netlify runtime as an environment variable.
  // In local development, you might need to set it up via a .env file or a proxy.
  const API_KEY = process.env.REACT_APP_GEMINI_API_KEY; 

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setTitle(''); // Reset title and keywords when a new image is uploaded
        setKeywords('');
      };
      reader.readAsDataURL(file);
    }
  };

  const callGeminiAPI = async (base64ImageData, prompt) => {
    if (!API_KEY) {
      setError("API Key is not configured. Please set REACT_APP_GEMINI_API_KEY in your environment variables.");
      return null;
    }

    try {
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg", // Assume JPEG; consider dynamic detection for a robust app
                  data: base64ImageData.split(',')[1] // Remove the 'data:image/jpeg;base64,' prefix
                }
              }
            ]
          }
        ]
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        return result.candidates[0].content.parts[0].text;
      } else {
        // Handle cases where the API might return an error or no content
        const errorMessage = result.error ? result.error.message : 'No content received from API.';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setError(`API Error: ${err.message}. Please check your API Key and network.`);
      return null;
    }
  };

  const generateContent = async () => {
    if (!selectedImage) {
      setError('Please upload an image first to generate content.');
      return;
    }

    setLoading(true);
    setError('');
    setCopyStatus('');

    // Title Generation Prompt: Designed to be trendy and Adobe Stock compliant, now explicitly single sentence
    const titlePrompt = `Generate a trendy, concise, and descriptive title for the following image, suitable for Adobe Stock. The title must be a single sentence, engaging, avoid trademarks or offensive content, and accurately reflect the main subject and mood.`;
    const generatedTitle = await callGeminiAPI(selectedImage, titlePrompt);
    if (generatedTitle) {
      setTitle(generatedTitle);
    } else {
      setTitle('Could not generate title.');
    }

    // Keyword Generation Prompt: Aim for 45 single, relevant keywords
    const keywordPrompt = `Generate exactly 45 highly relevant, single-word keywords for the following image. Each keyword should be separated by a comma. Do not include any numbers, special characters, or phrases, only single words.`;
    const generatedKeywords = await callGeminiAPI(selectedImage, keywordPrompt);
    if (generatedKeywords) {
      // Clean and format keywords, ensuring single words and proper comma separation
      const cleanedKeywords = generatedKeywords
        .split(',')
        .map(kw => kw.trim())
        .filter(kw => kw.length > 0 && !/\s/.test(kw)) // Ensure it's a single word
        .slice(0, 45) // Ensure max 45 keywords
        .join(', ');
      setKeywords(cleanedKeywords);
    } else {
      setKeywords('Could not generate keywords.');
    }

    setLoading(false);
  };

  const copyToClipboard = (text, type) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyStatus(`${type} copied to clipboard!`);
      setTimeout(() => setCopyStatus(''), 2000); // Clear message after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyStatus(`Failed to copy ${type}.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 sm:p-8 flex flex-col items-center justify-center font-sans relative">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col md:flex-row gap-8 transform transition-all duration-300 hover:shadow-3xl">
        {/* Left side: Image upload and preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50 transition duration-300 hover:border-blue-400">
          <label
            htmlFor="image-upload"
            className="cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 mb-6 text-lg tracking-wide"
          >
            Upload Your Image
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          {selectedImage ? (
            <div className="relative w-full max-w-sm sm:max-w-md h-auto rounded-xl overflow-hidden shadow-xl border-4 border-white transition duration-300 hover:shadow-2xl">
              <img
                src={selectedImage}
                alt="Uploaded Visual"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="text-gray-500 text-center py-10 px-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 mx-auto mb-4 text-blue-400 opacity-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium">No image selected yet.</p>
              <p className="text-sm mt-1">Upload an image to get started!</p>
            </div>
          )}
          {error && <p className="text-red-500 mt-4 text-center font-medium">{error}</p>}
        </div>

        {/* Right side: Generated content */}
        <div className="flex-1 flex flex-col justify-between p-6 bg-purple-50 rounded-2xl shadow-inner border border-purple-100">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            AI-Powered Content Generator
          </h2>

          <button
            onClick={generateContent}
            disabled={!selectedImage || loading}
            className={`w-full py-4 px-8 rounded-full font-bold text-white shadow-xl transition duration-300 ease-in-out transform hover:scale-105 mb-8 text-xl
              ${selectedImage && !loading ? 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700' : 'bg-gray-400 cursor-not-allowed opacity-75'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating insights...
              </div>
            ) : (
              'Generate Title & Keywords'
            )}
          </button>

          {/* Title Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-700 mb-3 flex items-center">
              Image Title
              {title && (
                <button
                  onClick={() => copyToClipboard(title, 'Title')}
                  className="ml-3 p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition duration-200 shadow-sm"
                  title="Copy Title"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1.586l-.293.293A1 1 0 0116.707 19H8V5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 3h2a2 2 0 012 2v10a2 2 0 01-2 2h-2m-3-11v3m0 0v3m0-3h3m-3 0h-3"
                    />
                  </svg>
                </button>
              )}
            </h3>
            <textarea
              readOnly
              value={title}
              placeholder="Your AI-generated title will appear here, optimized for Adobe Stock..."
              className="w-full p-4 border border-blue-200 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-300 resize-none h-28 text-lg font-medium shadow-sm"
            ></textarea>
          </div>

          {/* Keyword Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-3 flex items-center">
              Relevant Keywords
              {keywords && (
                <button
                  onClick={() => copyToClipboard(keywords, 'Keywords')}
                  className="ml-3 p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition duration-200 shadow-sm"
                  title="Copy Keywords"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1.586l-.293.293A1 1 0 0116.707 19H8V5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 3h2a2 2 0 012 2v10a2 2 0 01-2 2h-2m-3-11v3m0 0v3m0-3h3m-3 0h-3"
                    />
                  </svg>
                </button>
              )}
            </h3>
            <textarea
              readOnly
              value={keywords}
              placeholder="Your 45 single-word keywords will appear here, comma-separated..."
              className="w-full p-4 border border-blue-200 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-300 resize-none h-48 text-lg font-medium shadow-sm"
            ></textarea>
          </div>

          {copyStatus && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg transition-opacity duration-300 z-10">
              {copyStatus}
            </div>
          )}
        </div>
      </div>
      <footer className="mt-8 text-center text-gray-600 text-sm font-medium">
        Made With ❤️ By <span className="font-semibold text-blue-700">Shahadat Hossain</span>
      </footer>
    </div>
  );
}

export default App;