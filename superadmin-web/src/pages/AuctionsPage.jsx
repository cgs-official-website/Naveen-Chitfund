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
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedAuctionId, setSelectedAuctionId] = useState(null);
    const [forceCloseTarget, setForceCloseTarget] = useState(null);
    // Live Socket bids stream state
    const [liveBids, setLiveBids] = useState([]);
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-auctions', page, pageSize, statusFilter],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/auctions', {
                params: { page, limit: pageSize, status: statusFilter || undefined },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Live Reverse Auctions Terminal
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Real-time oversight of subscriber bidding rooms, 40% statutory caps, and dividend allocation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            40% Reverse Auction Rule Enforced
          </span>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-5 backdrop-blur-md">
        <FilterBar searchQuery="" onSearchChange={() => { }} searchPlaceholder="Filter auctions...">
          <select value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500">
            <option value="">All Statuses</option>
            <option value="LIVE">Live Bidding Only</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </FilterBar>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} onRowClick={(item) => setSelectedAuctionId(item.id)} emptyTitle="No Auctions Found"/>

        <Pagination
          currentPage={page}
          totalPages={data?.meta?.totalPages || 1}
          totalItems={data?.meta?.total || 0}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Live Auction Monitor Modal */}
      <Modal isOpen={Boolean(selectedAuctionId)} onClose={() => setSelectedAuctionId(null)} title={activeAuction?.group_name ? `Reverse Auction Room: ${activeAuction.group_name}` : 'Live Auction Room'} maxWidth="2xl">
        <div className="space-y-6">
          {/* Room Header Info */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-stone-50 via-amber-50/20 to-stone-50 dark:from-[#1A0B14] dark:via-[#260E1E] dark:to-[#1A0B14] border border-stone-200/90 dark:border-maroon-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 text-xs shadow-xs">
            <div>
              <span className="text-stone-400 block font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">Chit Value</span>
              <CurrencyText amount={activeAuction?.chit_amount} className="text-sm sm:text-base font-black text-stone-900 dark:text-stone-100"/>
            </div> 
            <div>
              <span className="text-stone-400 block font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">Current Leading Discount</span>
              <span className="text-sm sm:text-base font-black text-gold-500 dark:text-gold-400">{currentLowest}%</span>
            </div>
            <div>
              <span className="text-stone-400 block font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">Room Status</span>
              <StatusBadge status={activeAuction?.status || 'SCHEDULED'} className="mt-1"/>
            </div>
          </div>

          {/* Live Feed Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Bids Audit Stream ({liveBids.length})
            </h4>
            {activeAuction?.status === 'LIVE' && (<button onClick={() => setForceCloseTarget(activeAuction)} className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-sm shadow-rose-600/30 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto">
                <AlertOctagon className="w-3.5 h-3.5"/> Force Close Auction
              </button>)}
          </div>

          {/* Live Feed Stream */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {liveBids.length === 0 ? (<div className="p-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-maroon-900/50 rounded-2xl">Waiting for subscriber bids...</div>) : (liveBids.map((b, idx) => (<div key={idx} className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition duration-200 ${idx === 0
                ? 'bg-gradient-to-r from-gold-500/10 via-amber-500/10 to-gold-500/5 border-gold-500/50 ring-1 ring-gold-400/20 shadow-sm'
                : 'bg-white/80 dark:bg-[#160B12] border-stone-200/70 dark:border-maroon-900/40'}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4E1327] to-[#7A1F3D] text-gold-300 flex items-center justify-center font-black text-xs shadow-xs border border-gold-400/30">
                      #{b.ticketNumber}
                    </span>
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">
                        Subscriber Ticket #{b.ticketNumber}
                      </span>
                      <span className="text-[10px] text-stone-400">{new Date(b.bidAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-base text-gold-600 dark:text-gold-400 block">{b.bidPct}%</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Discount Offered</span>
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

