import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Eye, AlertOctagon } from 'lucide-react';
import { api } from '../api/client';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyText } from '../components/common/CurrencyText';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuthStore } from '../store/authStore';
export const AuctionsPage = () => {
    const queryClient = useQueryClient();
    const { accessToken } = useAuthStore();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedAuctionId, setSelectedAuctionId] = useState(null);
    const [forceCloseTarget, setForceCloseTarget] = useState(null);
    // Live Socket bids stream state
    const [liveBids, setLiveBids] = useState([]);
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-auctions', page, statusFilter],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/auctions', {
                params: { page, limit: 10, status: statusFilter || undefined },
            });
            return res.data;
        },
        refetchInterval: 15000,
    });
    const { data: bidsData } = useQuery({
        queryKey: ['superadmin-auction-bids', selectedAuctionId],
        queryFn: async () => {
            if (!selectedAuctionId)
                return null;
            const res = await api.get(`/api/v1/superadmin/auctions/${selectedAuctionId}/bids`);
            return res.data.data;
        },
        enabled: Boolean(selectedAuctionId),
    });
    // Socket.IO connection for live auction room
    useEffect(() => {
        if (!selectedAuctionId)
            return;
        const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://naveen-chitfund-production.up.railway.app' : window.location.origin);
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
        });
        socket.emit('join_auction', {
            auctionId: selectedAuctionId,
            token: accessToken,
        });
        socket.on('bid_placed', (bidData) => {
            setLiveBids((prev) => [
                {
                    ticketNumber: bidData.ticketNumber,
                    bidPct: bidData.bidPct,
                    bidAt: bidData.bidAt || new Date().toISOString(),
                },
                ...prev,
            ]);
        });
        socket.on('auction_closed', () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-auctions'] });
        });
        return () => {
            socket.emit('leave_auction', { auctionId: selectedAuctionId });
            socket.disconnect();
        };
    }, [selectedAuctionId, accessToken, queryClient]);
    // Sync historical bids when detail loads
    useEffect(() => {
        if (bidsData?.bids) {
            setLiveBids(bidsData.bids.map((b) => ({
                ticketNumber: b.ticket_number,
                bidPct: Number(b.bid_pct),
                bidAt: b.created_at,
            })));
        }
    }, [bidsData]);
    // Force close mutation
    const forceCloseMutation = useMutation({
        mutationFn: async ({ id, reason }) => {
            const res = await api.post(`/api/v1/superadmin/auctions/${id}/force-close`, { reason });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-auctions'] });
            setForceCloseTarget(null);
            setSelectedAuctionId(null);
        },
    });
    const columns = [
        {
            header: 'Chit Group & Month',
            accessorKey: 'group_name',
            cell: (item) => (<div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.group_name}</span>
          <span className="text-xs text-slate-500">Month #{item.month_number} Reverse Auction</span>
        </div>),
        },
        {
            header: 'Chit Amount',
            accessorKey: 'chit_amount',
            cell: (item) => <CurrencyText amount={item.chit_amount} className="font-bold"/>,
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (item) => <StatusBadge status={item.status}/>,
        },
        {
            header: 'Winning / Leading Discount',
            accessorKey: 'winning_bid_pct',
            cell: (item) => (<span className="font-bold text-gold-500">
          {item.winning_bid_pct ? `${item.winning_bid_pct}%` : 'In Progress'}
        </span>),
        },
        {
            header: 'Winner / Leading Ticket',
            cell: (item) => (<span className="text-xs text-slate-700 dark:text-slate-300">
          {item.winner_name ? `${item.winner_name} (#${item.winner_ticket_number})` : '-'}
        </span>),
        },
        {
            header: 'Actions',
            cell: (item) => (<div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setSelectedAuctionId(item.id)} className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1">
            <Eye className="w-3.5 h-3.5"/> Monitor
          </button>
          {item.status !== 'COMPLETED' && (<button onClick={() => setForceCloseTarget(item)} className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded border border-rose-200 dark:border-rose-900">
              Force Close
            </button>)}
        </div>),
        },
    ];
    const activeAuction = bidsData?.auction;
    const currentLowest = liveBids.length ? liveBids[0].bidPct : activeAuction?.winning_bid_pct || 5;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Live Reverse Auctions Monitor</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Real-time oversight of subscriber bidding rooms, statutory caps, and dividend allocation.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-4">
        <FilterBar searchQuery="" onSearchChange={() => { }} searchPlaceholder="Filter auctions...">
          <select value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-700 dark:text-slate-200">
            <option value="">All Statuses</option>
            <option value="LIVE">Live Bidding Only</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </FilterBar>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} onRowClick={(item) => setSelectedAuctionId(item.id)} emptyTitle="No Auctions Found"/>

        <Pagination currentPage={page} totalPages={data?.meta?.totalPages || 1} totalItems={data?.meta?.total || 0} pageSize={10} onPageChange={setPage}/>
      </div>

      {/* Live Auction Monitor Modal */}
      <Modal isOpen={Boolean(selectedAuctionId)} onClose={() => setSelectedAuctionId(null)} title={activeAuction?.group_name ? `Auction Monitor: ${activeAuction.group_name}` : 'Live Auction Room'} maxWidth="2xl">
        <div className="space-y-6">
          {/* Room Header Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Chit Value</span>
              <CurrencyText amount={activeAuction?.chit_amount} className="text-base font-bold text-stone-900 dark:text-stone-100"/>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Current Leading Discount</span>
              <span className="text-base font-bold text-gold-500">{currentLowest}%</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Room Status</span>
              <StatusBadge status={activeAuction?.status || 'SCHEDULED'}/>
            </div>
          </div>

          {/* Live Feed Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Bids Audit Stream ({liveBids.length})
            </h4>
            {activeAuction?.status === 'LIVE' && (<button onClick={() => setForceCloseTarget(activeAuction)} className="px-3 py-1.5 rounded-input bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5"/> Force Close Auction
              </button>)}
          </div>

          {/* Live Feed Stream */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {liveBids.length === 0 ? (<div className="p-8 text-center text-xs text-slate-400">Waiting for subscriber bids...</div>) : (liveBids.map((b, idx) => (<div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition ${idx === 0
                ? 'bg-gold-50/50 dark:bg-gold-500/10 border-gold-500/40'
                : 'bg-white dark:bg-navy-950 border-slate-100 dark:border-navy-800'}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center font-bold text-xs">
                      #{b.ticketNumber}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Subscriber Ticket #{b.ticketNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-gold-600 dark:text-gold-400 block">{b.bidPct}%</span>
                    <span className="text-[10px] text-slate-400">{new Date(b.bidAt).toLocaleTimeString()}</span>
                  </div>
                </div>)))}
          </div>
        </div>
      </Modal>

      {/* Force Close Confirm Dialog with Mandatory Reason */}
      <ConfirmDialog isOpen={Boolean(forceCloseTarget)} onClose={() => setForceCloseTarget(null)} title="Force Close Live Auction" message={`Are you sure you want to forcibly close the auction for ${forceCloseTarget?.group_name}? This will declare the highest current discount bidder as the winner and run the dividend distribution engine immediately.`} confirmText="Force Close Now" isDestructive requireReason reasonPlaceholder="e.g. Unresponsive bidding timer or technical failover resolution..." isLoading={forceCloseMutation.isPending} onConfirm={(reason) => {
            if (!forceCloseTarget)
                return;
            forceCloseMutation.mutate({
                id: forceCloseTarget.id,
                reason,
            });
        }}/>
    </div>);
};

