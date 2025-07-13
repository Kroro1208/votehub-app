interface ErrorProps {
  error: Error | null;
}

const ErrorMessage = ({ error }: ErrorProps) => {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center border-l-4 border-red-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-red-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>community</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          エラーが発生しました
        </h2>
        <p className="text-gray-600">{error?.message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
