import { Link } from 'react-router-dom';

export function DemoNavigation() {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg font-semibold text-white mb-3">Table Components Demo</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/table-demo"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Table Components Demo
          </Link>
          <Link
            to="/providers-demo"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Providers Demo (Full Page)
          </Link>
          <Link
            to="/doctor-list-demo"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Doctor List Demo (Simple Table)
          </Link>
          <Link
            to="/providers"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Original Providers Page
          </Link>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Compare the original implementation with the new reusable table components
        </p>
      </div>
    </div>
  );
}
