import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import axios from '../utils/axiosConfig';

const AnnualLeaveBalance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    fetchAnnualLeaveData();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  const fetchAnnualLeaveData = async () => {
    try {
      setLoading(true);
      // Fetch actual employee data from the same endpoint as EmployeeHub
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/employees`);
      
      if (response.data.success && response.data.data.length > 0) {
        // Transform API data to match expected format with mock leave data
        const transformedData = response.data.data.map(emp => ({
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          allowance: 12, // Default allowance
          balance: Math.floor(Math.random() * 12) + 1, // Random balance for demo
          remainingPercentage: Math.floor(Math.random() * 100) + 1 // Random percentage for demo
        }));
        setEmployees(transformedData);
      } else {
        // Fallback to mock data if no employees found
        const mockData = [
          { id: "123", name: "Syed Ahmed", allowance: 12, balance: 10, remainingPercentage: 83 },
          { id: "124", name: "Jane Smith", allowance: 15, balance: 8, remainingPercentage: 53 },
          { id: "125", name: "John Doe", allowance: 12, balance: 3, remainingPercentage: 25 },
          { id: "126", name: "Sarah Johnson", allowance: 18, balance: 15, remainingPercentage: 83 },
          { id: "127", name: "Michael Brown", allowance: 12, balance: 11, remainingPercentage: 92 },
          { id: "128", name: "Emily Davis", allowance: 14, balance: 4, remainingPercentage: 29 },
          { id: "129", name: "Robert Wilson", allowance: 12, balance: 7, remainingPercentage: 58 },
          { id: "130", name: "Lisa Anderson", allowance: 16, balance: 12, remainingPercentage: 75 },
          { id: "131", name: "David Martinez", allowance: 12, balance: 2, remainingPercentage: 17 },
          { id: "132", name: "Jennifer Taylor", allowance: 15, balance: 9, remainingPercentage: 60 }
        ];
        setEmployees(mockData);
      }
    } catch (error) {
      console.error('Error fetching annual leave data:', error);
      // Fallback to mock data
      const mockData = [
        { id: "123", name: "Syed Ahmed", allowance: 12, balance: 10, remainingPercentage: 83 },
        { id: "124", name: "Jane Smith", allowance: 15, balance: 8, remainingPercentage: 53 },
        { id: "125", name: "John Doe", allowance: 12, balance: 3, remainingPercentage: 25 },
        { id: "126", name: "Sarah Johnson", allowance: 18, balance: 15, remainingPercentage: 83 },
        { id: "127", name: "Michael Brown", allowance: 12, balance: 11, remainingPercentage: 92 },
        { id: "128", name: "Emily Davis", allowance: 14, balance: 4, remainingPercentage: 29 },
        { id: "129", name: "Robert Wilson", allowance: 12, balance: 7, remainingPercentage: 58 },
        { id: "130", name: "Lisa Anderson", allowance: 16, balance: 12, remainingPercentage: 75 },
        { id: "131", name: "David Martinez", allowance: 12, balance: 2, remainingPercentage: 17 },
        { id: "132", name: "Jennifer Taylor", allowance: 15, balance: 9, remainingPercentage: 60 }
      ];
      setEmployees(mockData);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 60) return '#e63929'; // Red for high remaining
    if (percentage >= 30) return '#e68a00'; // Orange for medium
    return '#3d7a2e'; // Green for low remaining
  };

  const handleEmployeeClick = (employeeId) => {
    navigate(`/employee/${employeeId}`);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmployees = React.useMemo(() => {
    let sortableEmployees = [...filteredEmployees];
    if (sortConfig.key) {
      sortableEmployees.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableEmployees;
  }, [filteredEmployees, sortConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search Filter */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Filter employees"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Annual Leave Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#e9f5ff] border-b border-gray-200">
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-gray-900"
                >
                  <span>Name</span>
                  <div className="flex flex-col">
                    <ChevronUp className={`w-3 h-3 ${sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <ChevronDown className={`w-3 h-3 -mt-1 ${sortConfig.key === 'name' && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Allowance
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Current balance
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Remaining percentage
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEmployees.map((employee, index) => (
              <tr 
                key={employee.id} 
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f8fbff'} hover:bg-gray-50 transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEmployeeClick(employee.id)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {employee.name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.allowance} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.balance} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 max-w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${employee.remainingPercentage}%`,
                            backgroundColor: getProgressBarColor(employee.remainingPercentage)
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-900 font-medium min-w-[3rem] text-right">
                      {employee.remainingPercentage}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedEmployees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No employees found matching your search.
        </div>
      )}
    </div>
  );
};

export default AnnualLeaveBalance;
