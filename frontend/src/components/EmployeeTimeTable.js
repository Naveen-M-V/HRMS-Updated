import React from 'react';
import { Calendar, Clock, Timer, MapPin, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';

export function EmployeeTimeTable({ records, onEdit, onDelete }) {
  // Function to check if location is GPS coordinates and open map
  const handleLocationClick = (location) => {
    // Check if location is in GPS coordinate format (e.g., "51.507351, -0.127758")
    const gpsPattern = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
    if (gpsPattern.test(location)) {
      const [lat, lng] = location.split(',').map(coord => coord.trim());
      // Open Google Maps in a new tab
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  return (
    <div className="w-full">
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="w-40">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Calendar className="h-4 w-4" />
                  Day
                </div>
              </TableHead>
              <TableHead className="w-80">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Clock className="h-4 w-4" />
                  Clock-in & Out
                </div>
              </TableHead>
              <TableHead className="w-32 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold">
                  <Timer className="h-4 w-4" />
                  Total Duration
                </div>
              </TableHead>
              <TableHead className="w-28 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold">
                  <Timer className="h-4 w-4" />
                  Overtime
                </div>
              </TableHead>
              <TableHead className="w-56">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <MapPin className="h-4 w-4" />
                  GPS Location
                </div>
              </TableHead>
              <TableHead className="w-28 text-center">
                <div className="text-gray-700 font-semibold">
                  Action
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div>
                    <div className="text-gray-900">{record.day}</div>
                    <div className="text-gray-500 text-sm">{record.date}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {record.sessions.map((session, index) => (
                      <div key={index} className="flex items-center font-mono text-sm">
                        <span className={record.overtime !== '-' ? 'text-orange-600 w-[72px] text-right mr-2' : 'text-gray-900 w-[72px] text-right mr-2'}>
                          {session.clockIn}
                        </span>
                        <div className="flex items-center">
                          <span className="text-gray-400 leading-none">•</span>
                          <div className="h-[2px] w-3 bg-gray-300"></div>
                          <span className="text-gray-400 text-xs px-2">{session.duration}</span>
                          <div className="h-[2px] w-3 bg-gray-300"></div>
                          <span className="text-gray-400 leading-none">•</span>
                        </div>
                        <span className={record.overtime !== '-' ? 'text-orange-600 w-[72px] ml-2' : 'text-gray-900 w-[72px] ml-2'}>
                          {session.clockOut}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-gray-900">{record.totalDuration}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={record.overtime !== '-' ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                    {record.overtime}
                  </span>
                </TableCell>
                <TableCell>
                  <div 
                    className={`flex items-center gap-2 text-sm ${
                      /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(record.location) 
                        ? 'text-blue-600 cursor-pointer hover:text-blue-800 hover:underline' 
                        : 'text-gray-600'
                    }`}
                    onClick={() => handleLocationClick(record.location)}
                    title={/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(record.location) ? 'Click to view on map' : ''}
                  >
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate max-w-xs">{record.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onDelete(record)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
