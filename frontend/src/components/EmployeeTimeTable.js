import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
  // Function to check if geolocation is GPS coordinates and open map
  const handleGeolocationClick = (geolocation) => {
    // Check if geolocation is in GPS coordinate format (e.g., "51.507351, -0.127758")
    const gpsPattern = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
    if (gpsPattern.test(geolocation)) {
      const [lat, lng] = geolocation.split(',').map(coord => coord.trim());
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
              <TableHead className="w-36">
                <div className="text-gray-700 font-semibold">Day</div>
              </TableHead>
              <TableHead className="w-64">
                <div className="text-gray-700 font-semibold">Clock-in & Out</div>
              </TableHead>
              <TableHead className="w-64">
                <div className="text-gray-700 font-semibold">Break</div>
              </TableHead>
              <TableHead className="w-28 text-center">
                <div className="text-gray-700 font-semibold">Late Arrival</div>
              </TableHead>
              <TableHead className="w-28 text-center">
                <div className="text-gray-700 font-semibold">Work Type</div>
              </TableHead>
              <TableHead className="w-32 text-center">
                <div className="text-gray-700 font-semibold">Location</div>
              </TableHead>
              <TableHead className="w-48">
                <div className="text-gray-700 font-semibold">Overtime</div>
              </TableHead>
              <TableHead className="w-48">
                <div className="text-gray-700 font-semibold">Geolocation</div>
              </TableHead>
              <TableHead className="w-24 text-center">
                <div className="text-gray-700 font-semibold">Action</div>
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
                        <span className={record.overtime !== '-' ? 'text-orange-600 w-[50px] text-right' : 'text-gray-900 w-[50px] text-right'}>
                          {session.clockIn}
                        </span>
                        <div className="flex items-center mx-2">
                          <span className="text-gray-400 leading-none">•</span>
                          <div className="h-[2px] w-2 bg-gray-300"></div>
                          <span className="text-gray-400 text-xs px-1 min-w-[60px] text-center">{session.duration}</span>
                          <div className="h-[2px] w-2 bg-gray-300"></div>
                          <span className="text-gray-400 leading-none">•</span>
                        </div>
                        <span className={record.overtime !== '-' ? 'text-orange-600 w-[50px]' : 'text-gray-900 w-[50px]'}>
                          {session.clockOut}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {record.breaks && record.breaks.length > 0 ? (
                    <div className="space-y-1">
                      {record.breaks.map((breakItem, index) => (
                        <div key={index} className="flex items-center font-mono text-sm">
                          <span className="text-amber-600 w-[50px] text-right">
                            {breakItem.startTime}
                          </span>
                          <div className="flex items-center mx-2">
                            <span className="text-gray-400 leading-none">•</span>
                            <div className="h-[2px] w-2 bg-gray-300"></div>
                            <span className="text-gray-400 text-xs px-1 min-w-[60px] text-center">{breakItem.duration}</span>
                            <div className="h-[2px] w-2 bg-gray-300"></div>
                            <span className="text-gray-400 leading-none">•</span>
                          </div>
                          <span className="text-amber-600 w-[50px]">
                            {breakItem.endTime}
                          </span>
                        </div>
                      ))}
                      {record.breaks.length > 1 && (
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          Total: {record.totalBreakTime}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm">--</div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className={record.lateArrival !== '--' ? 'font-mono text-sm text-red-600 font-semibold' : 'font-mono text-sm text-gray-500'}>
                    {record.lateArrival}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm text-gray-900">{record.workType}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm text-gray-900">{record.location}</span>
                </TableCell>
                <TableCell>
                  {record.overtime !== '-' && record.overtimeHours !== '--' ? (
                    <div className="font-mono text-sm">
                      <div className="flex items-center justify-center">
                        <span className="text-orange-600 font-semibold">
                          {record.overtimeHours}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        {record.overtime}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm">--</div>
                  )}
                </TableCell>
                <TableCell>
                  <div 
                    className={`text-sm ${
                      /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(record.geolocation) 
                        ? 'text-blue-600 cursor-pointer hover:text-blue-800 hover:underline' 
                        : 'text-gray-500'
                    }`}
                    onClick={() => handleGeolocationClick(record.geolocation)}
                    title={/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(record.geolocation) ? 'Click to view on map' : ''}
                  >
                    <span className="truncate">{record.geolocation}</span>
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
