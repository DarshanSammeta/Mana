"use client";

import React, { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/admin/DashboardShell';
import {
  AlertTriangle, ExternalLink, Clock
} from 'lucide-react';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  useEffect(() => {
    // In a real app, fetch from /api/admin/disputes
    // Mocking for now as we just built the backend API structure
    const mockDisputes = [
      {
        id: 'DISP-1001',
        bookingNumber: 'ME-2024-000123',
        type: 'QUALITY',
        status: 'OPEN',
        raisedBy: 'Customer (Rahul S.)',
        description: 'Vendor arrived late and equipment was not as described.',
        createdAt: '2024-05-20T10:00:00Z',
        evidenceCount: 3
      },
      {
        id: 'DISP-1002',
        bookingNumber: 'ME-2024-000145',
        type: 'NO_SHOW',
        status: 'RESOLVED',
        raisedBy: 'Customer (Anita K.)',
        description: 'Vendor did not show up for the event.',
        createdAt: '2024-05-19T14:30:00Z',
        evidenceCount: 1
      }
    ];
    setDisputes(mockDisputes);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-amber-100 text-amber-700';
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* List View */}
        <div className="lg:w-1/3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">All Disputes</h3>
            <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              {disputes.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[calc(100vh-250px)]">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedDispute?.id === dispute.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                onClick={() => setSelectedDispute(dispute)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-gray-900">{dispute.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(dispute.status)}`}>
                    {dispute.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{dispute.bookingNumber}</p>
                <p className="text-sm text-gray-700 line-clamp-1">{dispute.description}</p>
                <div className="flex items-center mt-3 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {selectedDispute ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedDispute.id} Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Booking: <span className="font-medium text-indigo-600 cursor-pointer">{selectedDispute.bookingNumber}</span></p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50">
                    Reject
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
                    Resolve
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Claim Information</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500">Raised By</p>
                        <p className="text-sm font-medium text-gray-900">{selectedDispute.raisedBy}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reason Category</p>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md text-gray-700">
                          {selectedDispute.type}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Detailed Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed mt-1">
                          {selectedDispute.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Evidence Timeline</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                       <div className="flex space-x-2 mb-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-20 h-20 rounded border border-gray-200 bg-white flex items-center justify-center relative cursor-zoom-in">
                               <ExternalLink className="w-4 h-4 text-gray-300" />
                            </div>
                          ))}
                       </div>
                       <div className="space-y-3">
                          <div className="flex items-start">
                             <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 mr-3"></div>
                             <div>
                                <p className="text-xs font-medium text-gray-900">Evidence Uploaded by Customer</p>
                                <p className="text-[10px] text-gray-500">10:05 AM, 20 May</p>
                             </div>
                          </div>
                          <div className="flex items-start">
                             <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 mr-3"></div>
                             <div>
                                <p className="text-xs font-medium text-gray-400">Waiting for Vendor Response</p>
                                <p className="text-[10px] text-gray-500">SLA: 24h remaining</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Internal Admin Notes */}
                <div className="mt-8 border-t border-gray-100 pt-8">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Admin Resolution Center</h4>
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter internal notes or resolution details..."
                      rows={4}
                    ></textarea>
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center text-xs text-gray-600">
                                <input type="checkbox" className="mr-2" /> Refund full amount
                            </label>
                            <label className="flex items-center text-xs text-gray-600">
                                <input type="checkbox" className="mr-2" /> Apply vendor penalty
                            </label>
                        </div>
                        <button className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg">
                            Send Resolution
                        </button>
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <AlertTriangle className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a dispute to view details and take action</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}


