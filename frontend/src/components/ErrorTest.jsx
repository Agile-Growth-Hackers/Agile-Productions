import { useState } from 'react';

// Component that throws an error on demand
function ErrorTest() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error - Error Boundary is working!');
  }

  return (
    <button
      onClick={() => setShouldError(true)}
      className="fixed bottom-4 right-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg shadow-lg hover:bg-red-700 transition-colors opacity-50 hover:opacity-100"
      title="Click to test Error Boundary"
    >
      Test Error UI
    </button>
  );
}

export default ErrorTest;
