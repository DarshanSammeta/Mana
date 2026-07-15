"use client";

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  createdAt: string;
  bookingNumber?: string;
}

export const WalletDashboard: React.FC = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch('/api/wallet');
        const data = await res.json();
        setWallet(data);
      } catch (err) {
        console.error("Wallet fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <div>Loading Wallet...</div>;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
                <Wallet className="w-6 h-6" />
            </div>
            <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
                Details
            </button>
          </div>
          <p className="text-indigo-100 text-sm font-medium">Available Balance</p>
          <h2 className="text-3xl font-bold mt-1">₹{wallet?.balance?.toLocaleString() || '0'}</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Lifetime Earnings</p>
          <h2 className="text-3xl font-bold mt-1 text-gray-900">₹{wallet?.lifetimeEarnings?.toLocaleString() || '0'}</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Pending Payouts</p>
          <h2 className="text-3xl font-bold mt-1 text-gray-900">₹{wallet?.pendingPayouts?.toLocaleString() || '0'}</h2>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Recent Transactions</h3>
          <div className="flex space-x-2">
            <button className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg">
                <Filter className="w-4 h-4 mr-2" /> Filter
            </button>
            <button className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg">
                <Download className="w-4 h-4 mr-2" /> Export
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {wallet?.transaction?.map((tx: Transaction) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${tx.type === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {tx.type === 'CREDIT' ?
                        <ArrowDownLeft className={`w-5 h-5 ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`} /> :
                        <ArrowUpRight className={`w-5 h-5 text-red-600`} />
                    }
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{tx.description}</p>
                  <div className="flex items-center mt-0.5 text-xs text-gray-400">
                    <span className="mr-3">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    {tx.bookingNumber && (
                        <span className="flex items-center">
                            <FileText className="w-3 h-3 mr-1" /> {tx.bookingNumber}
                        </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                </p>
                <div className="flex items-center justify-end mt-1">
                    {tx.status === 'COMPLETED' ? (
                        <span className="flex items-center text-[10px] font-bold text-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> SUCCESS
                        </span>
                    ) : tx.status === 'PENDING' ? (
                        <span className="flex items-center text-[10px] font-bold text-amber-500">
                            <Clock className="w-3 h-3 mr-1" /> PENDING
                        </span>
                    ) : (
                        <span className="flex items-center text-[10px] font-bold text-red-500">
                            <AlertCircle className="w-3 h-3 mr-1" /> FAILED
                        </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 text-center">
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            View All Transactions
          </button>
        </div>
      </div>
    </div>
  );
};
