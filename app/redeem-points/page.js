// app/redeem-points/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../hooks/useAuth';
import { fetchWithAuth } from '../../lib/api.js';
import Swal from 'sweetalert2';

export default function RedeemPointsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pointsData, setPointsData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      fetchPointsData();
    }
  }, [user, loading]);

  const fetchPointsData = async () => {
    setDataLoading(true);
    setError(null);
    
    try {
      const data = await fetchWithAuth('/api/points');
      setPointsData(data.data);
    } catch (error) {
      console.error('Error fetching points data:', error);
      setError('Failed to load points data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleRedeem = async (redemptionOptionId, title, pointsRequired) => {
    if (pointsData.pointsBalance < pointsRequired) {
      Swal.fire({
        title: 'Insufficient Points',
        text: `You need ${pointsRequired} points but only have ${pointsData.pointsBalance}`,
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Redeem Points?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Reward:</strong> ${title}</p>
          <p class="mb-2"><strong>Points Required:</strong> ${pointsRequired}</p>
          <p class="mb-2"><strong>Your Balance:</strong> ${pointsData.pointsBalance}</p>
          <p class="mb-2"><strong>Balance After:</strong> ${pointsData.pointsBalance - pointsRequired}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Redeem Now',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setRedeeming(redemptionOptionId);

    try {
      const response = await fetchWithAuth('/api/points/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ redemptionOptionId })
      });

      Swal.fire({
        title: 'Success!',
        html: `
          <div class="text-left">
            <p class="mb-2">🎉 Reward redeemed successfully!</p>
            <p class="mb-2"><strong>Reward Code:</strong> <span class="font-mono bg-gray-100 px-2 py-1 rounded">${response.data.rewardCode}</span></p>
            <p class="mb-2"><strong>Points Used:</strong> ${response.data.pointsUsed}</p>
            <p class="mb-2"><strong>Expires:</strong> ${new Date(response.data.expiresAt).toLocaleDateString()}</p>
            <p class="text-sm text-gray-600 mt-3">You can find all your reward codes in the dashboard.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#10b981'
      });

      // Refresh points data
      fetchPointsData();

    } catch (error) {
      console.error('Error redeeming points:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to redeem points. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setRedeeming(null);
    }
  };

  const getRewardIcon = (rewardType) => {
    switch (rewardType) {
      case 'discount':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'free_shipping':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'voucher':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading points data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/user" className="text-green-600 hover:text-green-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Redeem Points</h1>
            </div>
            <div className="text-right">
              <div className="bg-green-100 rounded-lg p-3">
                <div className="text-sm text-green-600 font-medium">Your Points</div>
                <div className="text-xl font-bold text-green-700">{pointsData?.pointsBalance || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button
              onClick={fetchPointsData}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Available Rewards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Available Rewards</h2>
          
          {pointsData?.availableRedemptions?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards available</h3>
              <p className="text-gray-600">Check back later for new rewards to redeem with your points.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pointsData?.availableRedemptions?.map((reward) => {
                const canAfford = pointsData.pointsBalance >= reward.points_required;
                const isRedeeming = redeeming === reward.id;
                
                return (
                  <div key={reward.id} className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                    canAfford ? 'border-green-200 hover:border-green-300' : 'border-gray-200'
                  }`}>
                    <div className="p-6">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                        canAfford ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {getRewardIcon(reward.reward_type)}
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{reward.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-500">
                          {reward.reward_type === 'discount' && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {reward.reward_value}% OFF
                            </span>
                          )}
                          {reward.reward_type === 'voucher' && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                              ₹{reward.reward_value} CREDIT
                            </span>
                          )}
                          {reward.reward_type === 'free_shipping' && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              FREE SHIPPING
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{reward.points_required}</div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRedeem(reward.id, reward.title, reward.points_required)}
                        disabled={!canAfford || isRedeeming}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          canAfford && !isRedeeming
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isRedeeming ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Redeeming...
                          </div>
                        ) : !canAfford ? (
                          `Need ${reward.points_required - pointsData.pointsBalance} more points`
                        ) : (
                          'Redeem Now'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Redemptions */}
        {pointsData?.activeRedemptions?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Active Rewards</h2>
            
            <div className="space-y-4">
              {pointsData.activeRedemptions.map((redemption) => (
                <div key={redemption.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                        {getRewardIcon(redemption.reward_type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{redemption.title}</h3>
                        <p className="text-sm text-gray-600">{redemption.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded border">
                        {redemption.reward_code}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(redemption.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {pointsData?.transactions?.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Points History</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {pointsData.transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.transaction_type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.transaction_type === 'earned' ? '+' : '-'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className={`font-medium ${
                      transaction.transaction_type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'earned' ? '+' : ''}{transaction.points_amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
